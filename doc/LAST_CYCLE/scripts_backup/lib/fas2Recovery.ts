import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { selectRelevantRetryFiles, extractErrorSignature, buildRetryAnchor, getRequiredFiles } from './ticketAndAnchor.js';
import { planContextBatches, buildCrashDumpPayload } from './contextBatcher.js';
import { diagnostiseraRotOrsak } from './channelRunner.js';
import { runMicroChannel } from './fas1Sweep.js';

export interface RecoveryState {
  innerAttempts: number;
  reversals: number;
}

const MAX_OUTER_REVERSALS = 4;
const MAX_INNER_ATTEMPTS = 3;

export async function korMaintValidering(
  ai: any,
  modelName: string,
  ticketPath: string,
  systemInstruction: string,
  codegenTools: any[],
  executeFas2Tools: (name: string, args: any) => string,
  isFas2Complete: () => boolean
): Promise<void> {
  const ticketId = path.basename(ticketPath, '.md');
  let attempts = 0;
  let prevSig = '';

  while (attempts < 4) {
    attempts++;
    console.log(`\n🔍 [MAINT-VALIDERING]: Kör maintValidation.ts (Försök ${attempts}/4)...`);
    try {
      execSync('npx tsx scripts/lib/maintValidation.ts', { stdio: 'pipe', cwd: process.cwd(), encoding: 'utf-8' });
      console.log('✅ [MAINT-VALIDERING]: Samtliga kontroller godkända!');
      return;
    } catch (err: any) {
      const errLog = [err?.stdout, err?.stderr].filter(Boolean).join('\n').trim() || err?.message || String(err);
      const currentSig = extractErrorSignature(errLog);

      if (attempts > 1 && currentSig && currentSig === prevSig) {
        console.error('❌ [MAINT]: Ingeniörsmässigt framsteg uteblev – avbryter loop i förtid.');
        process.exit(1);
      }
      prevSig = currentSig;

      if (attempts >= 4) {
        console.error('❌ [MAINT]: Maximalt antal självrättningsförsök (4) uppnått.');
        process.exit(1);
      }

      const ticketPrompt = fs.existsSync(ticketPath) ? fs.readFileSync(ticketPath, 'utf-8') : ticketId;
      const reqFiles = getRequiredFiles(ticketPrompt, true, 'scripts');
      const mentioned = (errLog.match(/(?:scripts|src)\/[^\s:()'"]+\.(?:ts|tsx|js)/g) || []);
      const allSourceFiles = Array.from(new Set([...reqFiles, ...mentioned]));
      const sourceContext = allSourceFiles
        .filter((f) => fs.existsSync(path.resolve(process.cwd(), f)))
        .map((f) => `--- ${f} ---\n${fs.readFileSync(path.resolve(process.cwd(), f), 'utf-8')}`)
        .join('\n\n');

      const diag = await diagnostiseraRotOrsak(ai, modelName, ticketId, errLog, sourceContext, systemInstruction);
      const repairPrompt = `Självrättning (Försök ${attempts}/4) för ${ticketId}. Använd 'apply_patch' för att laga felen.\n\nFELUTDRAG:\n${currentSig}\n\nROTORSAKSDIAGNOS:\n${diag}\n\nKÄLLKOD:\n${sourceContext.slice(0, 18000)}`;

      let repaired = false;
      const trackedRepairTools = (name: string, args: any): string => {
        const res = executeFas2Tools(name, args);
        if (name === 'apply_patch' || name === 'save_code') repaired = true;
        return res;
      };
      await runMicroChannel(ai, modelName, 'Att vända om', repairPrompt, currentSig, systemInstruction, codegenTools, trackedRepairTools, {
        requireMutation: true,
        maxTurns: 6,
        onMutationCheck: () => repaired,
        getFollowupPrompt: () => 'Du har inspekterat filen. Applicera nu lagningen med apply_patch omedelbart!'
      });
    }
  }
}

export async function hanteraFas2TestFel(
  ai: any,
  modelName: string,
  targetDomain: string,
  startAnchor: string,
  systemInstruction: string,
  codegenTools: any[],
  executeFas2Tools: (name: string, args: any) => string,
  transientTestFile: string,
  modifiedFiles: string[],
  state: RecoveryState,
  errorLog: string
): Promise<RecoveryState> {
  state.innerAttempts++;
  const sig = extractErrorSignature(errorLog);

  if (state.innerAttempts > MAX_INNER_ATTEMPTS) {
    state.innerAttempts = 0;
    state.reversals++;
    if (state.reversals > MAX_OUTER_REVERSALS) {
      const payload = buildCrashDumpPayload({ targetDomain, reversals: state.reversals, errorLog, modifiedFiles });
      fs.writeFileSync(path.join(process.cwd(), 'doc', 'LAST_CYCLE', 'CRASH_DUMP.json'), JSON.stringify(payload, null, 2), 'utf-8');
      throw new Error(`❌ Yttre omvändelsegräns (4) överskriden: ${sig}`);
    }
    const relevant = selectRelevantRetryFiles(modifiedFiles, errorLog);
    const batch = planContextBatches(relevant, errorLog, 20000);
    const diag = await diagnostiseraRotOrsak(ai, modelName, targetDomain, errorLog, batch.pass1.map((p) => p.content).join('\n'), systemInstruction);
    const anchor = buildRetryAnchor(fs.existsSync(transientTestFile) ? fs.readFileSync(transientTestFile, 'utf-8') : '', batch.pass1.map((p) => `--- ${p.path} ---\n${p.content}`).join('\n'), `${errorLog}\n\nDIAGNOS:\n${diag}`);
    let outerMutated = false;
    const outerTools = (name: string, args: any): string => {
      const res = executeFas2Tools(name, args);
      if (name === 'apply_patch' || name === 'save_code') outerMutated = true;
      return res;
    };
    await runMicroChannel(ai, modelName, 'Att vända om', 'Åtgärda källkoden utifrån 5-Varför-diagnosen med apply_patch.', anchor, systemInstruction, codegenTools, outerTools, {
      requireMutation: true,
      maxTurns: 6,
      onMutationCheck: () => outerMutated,
      getFollowupPrompt: () => 'Du har inspekterat koden. Applicera nu ändringen med apply_patch omedelbart!'
    });
    return state;
  }

  const relevant = selectRelevantRetryFiles(modifiedFiles, errorLog);
  const srcSummary = relevant
    .filter((f) => fs.existsSync(path.resolve(process.cwd(), f)))
    .map((f) => `--- ${f} ---\n${fs.readFileSync(path.resolve(process.cwd(), f), 'utf-8')}`)
    .join('\n\n');
  const anchor = buildRetryAnchor(fs.existsSync(transientTestFile) ? fs.readFileSync(transientTestFile, 'utf-8') : '', srcSummary, errorLog);
  let innerMutated = false;
  const innerTools = (name: string, args: any): string => {
    const res = executeFas2Tools(name, args);
    if (name === 'apply_patch' || name === 'save_code') innerMutated = true;
    return res;
  };
  await runMicroChannel(ai, modelName, 'Att vända om', `Laga testfelet (inre försök ${state.innerAttempts}/${MAX_INNER_ATTEMPTS}) med apply_patch.\n${startAnchor.slice(0, 2000)}`, anchor, systemInstruction, codegenTools, innerTools, {
    requireMutation: true,
    maxTurns: 5,
    onMutationCheck: () => innerMutated,
    getFollowupPrompt: () => 'Du har läst filen. Applicera nu ändringen med apply_patch omedelbart!'
  });
  return state;
}
