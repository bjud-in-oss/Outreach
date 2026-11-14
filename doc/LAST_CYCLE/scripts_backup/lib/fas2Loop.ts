import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { runMicroChannel } from './fas1Sweep.js';
import { execCaptured } from './shellAndBackup.js';
import { getRequiredFiles } from './ticketAndAnchor.js';
import { planContextBatches } from './contextBatcher.js';
import { hanteraFas2TestFel, RecoveryState, korMaintValidering } from './fas2Recovery.js';

export async function korFas2Loop(
  ai: any,
  modelName: string,
  isMaint: boolean,
  targetDomain: string,
  startAnchor: string,
  systemInstruction: string,
  codegenTools: any[],
  executeFas2Tools: (name: string, args: any) => string,
  fas2Prompt: string,
  isFas2Complete: () => boolean,
  getFas2FollowupPrompt: () => string,
  transientTestFile: string,
  transientTestFullPath: string,
  syncDomainBarrel: () => void,
  modifiedFiles: string[]
): Promise<string> {

  if (!isMaint) {
    let gate3aPassed = false;
    let gate3aAttempts = 0;
    while (!gate3aPassed && gate3aAttempts < 3) {
      gate3aAttempts++;
      try {
        console.log(`🔒 Verifierar Gate 3a (Försök ${gate3aAttempts}/3)...`);
        execCaptured(`node scripts/drivers/ts.js --check-alibi --file ${transientTestFile}`);
        gate3aPassed = true;
      } catch (err: any) {
        if (gate3aAttempts >= 3) {
          console.error('❌ Gate 3a underkändes 3 gånger i rad.');
          process.exit(1);
        }
        
        const recoveryStartAnchor = `${startAnchor}\n\nBEFINTLIGT TEST:\n${fs.existsSync(transientTestFullPath) ? fs.readFileSync(transientTestFullPath, 'utf-8') : ''}`;
        const recoveryPrompt = `Gate 3a underkände testet!
FELLOGG:
${err.message || String(err)}
Åtgärda och spara till '${transientTestFile}'. Ta bort all import av 'vi' och ersätt varje vi.fn()/vi.spyOn() med vanliga variabler utan tautologier.

KONTRAKT OCH BAKGRUND:
${startAnchor}`;
        
        await runMicroChannel(ai, modelName, 'Att vända om', recoveryPrompt, recoveryStartAnchor, systemInstruction, codegenTools, executeFas2Tools, { requireMutation: true, maxTurns: 5 });
      }
    }

    console.log('\n🔴 Gate 3a Fail-First: Verifierar att testet fallerar rött (exit 1)...');
    let testFailedAsExpected = false;
    let failFirstOutput = '';
    try {
      syncDomainBarrel();
      execSync(`npx vitest run ${transientTestFile}`, { stdio: 'pipe', cwd: process.cwd() });
    } catch (err: any) {
      testFailedAsExpected = true;
      failFirstOutput = (err.stdout ? err.stdout.toString() : '') + '\n' + (err.stderr ? err.stderr.toString() : '');
    }
    if (!testFailedAsExpected) {
      console.error('❌ GATE 3a UNDERKÄND: Transient-testet måste fallera med exit-kod 1 innan kod får skrivas.');
      process.exit(1);
    }
    if (failFirstOutput.includes('TypeError:') || failFirstOutput.includes('ReferenceError:') || failFirstOutput.includes('Cannot find package')) {
      console.error('❌ GATE 3a UNDERKÄND: Testet kraschar på körtidsfel eller trasiga importer!');
      console.error(failFirstOutput.slice(0, 1000));
      process.exit(1);
    }
    console.log('✅ Godkänt Fail-First: Testet fallerade rött av rätt orsak.');
  }

  console.log('\n⚡ Exekverar kodändringar via Bidi Live WebSocket...');

  const existingTargetFiles = getRequiredFiles(startAnchor, isMaint, targetDomain)
    .filter((f) => fs.existsSync(path.resolve(process.cwd(), f)));
  let prepackedTargets = '';
  if (existingTargetFiles.length > 0) {
    const batchPlan = planContextBatches(existingTargetFiles, '', 24000);
    const packedPass1 = batchPlan.pass1
      .map((entry) => `\n--- ${entry.path} (${entry.lineCount} rader) ---\n${entry.content}`)
      .join('\n');
    const pass2Notice = batchPlan.pass2.length > 0
      ? `\n\n⚠️ Följande målfiler rymdes inte i första 24K-fönstret och måste läsas med 'read_file' före 'apply_patch': ${batchPlan.pass2.map((e) => e.path).join(', ')}`
      : '';
    prepackedTargets = `\n\nBEFINTLIGA MÅLFILER (FÖRBEREDDA FÖR KIRURGISK apply_patch):\n${packedPass1}${pass2Notice}`;
  }
  const enrichedFas2Anchor = `${startAnchor}${prepackedTargets}`;

  await runMicroChannel(ai, modelName, 'Att följa', fas2Prompt, enrichedFas2Anchor, systemInstruction, codegenTools, executeFas2Tools, {
    requireMutation: true,
    maxTurns: 8,
    onMutationCheck: isFas2Complete,
    getFollowupPrompt: getFas2FollowupPrompt
  });

  if (!isFas2Complete()) {
    console.error('❌ FAS 2 MISSLYCKADES: Samtliga målfiler uppdaterades inte.');
    process.exit(1);
  }

  console.log('🎉 Fas 2 slutförd och validerad.');
  return 'STATUS: GODKÄND';
}
