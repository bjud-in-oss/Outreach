import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { GoogleGenAI } from '@google/genai';
import { BidiLiveSession } from './bidiLiveRunner.js';
import { execCaptured, dumpCrashDiff, restoreScriptsBackup, createVerifiedScriptsBackup } from './lib/shellAndBackup.js';
import { getFeatureIndexText, getInstalledDependencies, appendCycleLog } from './lib/channelRunner.js';
import { hanteraKonstruktivKritik } from './lib/critiqueTriage.js';
import { exekveraFas1Sweep } from './lib/fas1Sweep.js';
import { korFas2Loop } from './lib/fas2Loop.js';
import { codegenTools, createFas2ToolExecutor, isFas2Complete, getFas2FollowupPrompt } from './lib/fas2Tooling.js';
import { konsolideraTest, synkaDomanBarrel, uppdateraFeatureIndex, uppdateraBiljettstatus, hanteraTrepunktsbesiktning, genomforGitCommitPush, saneraSkordadLegacy } from './lib/fas3Consolidation.js';

const ROOT_DIR = process.cwd();
const CYCLE_LOG_DIR = path.join(ROOT_DIR, 'doc', 'LAST_CYCLE');
const CYCLE_LOG_PATH = path.join(CYCLE_LOG_DIR, 'CYCLE_LOG.md');
const CRASH_DUMP_PATH = path.join(CYCLE_LOG_DIR, 'CRASH_DUMP.json');
const SI_PATH = path.join(ROOT_DIR, 'doc', 'SI_v10.5.md');
const TICKETS_PATH = path.join(ROOT_DIR, 'doc', 'TICKETS.md');

const MODEL_NAME = process.env.LIVE_MODEL || process.env.GEMINI_MODEL || 'gemini-3.8-live';
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error('❌ KRITISKT FEL: GEMINI_API_KEY saknas i miljövariablerna.');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY, apiVersion: 'v1alpha' });

if (!fs.existsSync(CYCLE_LOG_DIR)) fs.mkdirSync(CYCLE_LOG_DIR, { recursive: true });

process.on("exit", (code) => {
  if (code !== 0) {
    dumpCrashDiff();
    restoreScriptsBackup();
  }
});

let systemInstruction = 'Du är motorn i Outreach Coordination Engine v10.5.';
if (fs.existsSync(SI_PATH)) systemInstruction = fs.readFileSync(SI_PATH, 'utf-8');

async function runMicroChannel(
  kraft: 'Att följa' | 'Att vända om' | 'Att förlikas',
  stepInstruction: string,
  startAnchor: string,
  si: string,
  tools: any[] = [],
  executeTool?: (name: string, args: any) => string,
  options: any = {}
): Promise<string> {
  const runner = new BidiLiveSession({
    ai,
    model: MODEL_NAME,
    systemInstruction: `${si}\n\nREPOTOPOGRAFI:\n${getFeatureIndexText()}\n\n${getInstalledDependencies()}\n\nDu agerar som kraften: ${kraft}.\nUppgift: ${stepInstruction}`,
    tools,
    executeTool,
  });

  try {
    let response = await runner.send(`STARTANKARE:\n${startAnchor}\n\nUPPDRAG:\n${stepInstruction}`);
    const maxTurns = options.maxTurns || 3;
    let turn = 1;

    while (options.requireMutation && options.onMutationCheck && !options.onMutationCheck() && turn < maxTurns) {
      turn++;
      const followUp = options.getFollowupPrompt ? options.getFollowupPrompt() : `Du har genomfört inspektion. Slutför nu uppdraget omedelbart!`;
      console.log(`\n   🔁 [ACTION LOOP]: Krav ej uppfyllt ännu. Fortsätter mikrokanalen (vända ${turn}/${maxTurns})...`);
      response = await runner.send(followUp);
    }

    runner.close();
    await new Promise((r) => setTimeout(r, 400));
    return response;
  } catch (err: any) {
    runner.close();
    await new Promise((r) => setTimeout(r, 400));
    throw err;
  }
}

async function main() {
  const isMaintRun = process.argv.some(a => a.toUpperCase().includes("MAINT"));
  if (isMaintRun) {
    try { createVerifiedScriptsBackup(); } catch (e: any) { process.exit(1); }
  }

  const ticketArg = process.argv[2];
  let ticketId = ticketArg ? ticketArg.toUpperCase() : 'PROMPT';
  if (ticketId.endsWith('.MD')) ticketId = ticketId.replace('.MD', '');
  const isMaint = ticketId.startsWith('TCK-MAINT');

  if (!process.argv.includes('--force') && !process.argv.includes('--omvandelse') && fs.existsSync(TICKETS_PATH)) {
    const ticketsContent = fs.readFileSync(TICKETS_PATH, 'utf-8');
    if (ticketsContent.includes(`[x] **${ticketId}** (VERIFIED)`)) {
      console.log(`\n🎟️ [AVBRYT BRYGGA]: Biljetten ${ticketId} är redan verifierad. Avbryter bygget.`);
      process.exit(0);
    }
  }

  console.log(`\n🚀 OUTREACH COORDINATION ENGINE v10.5 – STARTAR BYGG: ${ticketId}`);
  console.log(`📌 Aktiv Live-modell: ${MODEL_NAME}`);

  let ticketPath = path.join(ROOT_DIR, 'PROMPT.md');
  if (ticketId !== 'PROMPT') ticketPath = path.join(ROOT_DIR, 'doc', '.TICKETS', `${ticketId}.md`);
  if (!fs.existsSync(ticketPath)) {
    console.error(`❌ Biljettfil saknas: ${ticketPath}`);
    process.exit(1);
  }

  const ticketPrompt = fs.readFileSync(ticketPath, 'utf-8');
  let targetDomain = isMaint ? 'scripts' : 'telemetry';
  const domainMatch = ticketPrompt.match(/src\/features\/([a-zA-Z0-9_-]+)/);
  if (domainMatch && !isMaint) targetDomain = domainMatch[1];
  
  console.log(`🎯 Måldomän: ${isMaint ? 'scripts/ & doc/ (Underhåll)' : `src/features/${targetDomain}/`}\n`);

  try { execSync('node scripts/update-tickets.js', { cwd: ROOT_DIR }); } catch (err) { console.warn('⚠️ Kunde inte köra scripts/update-tickets.js:', err); }

  fs.writeFileSync(CYCLE_LOG_PATH, `# BYGGCYKEL LOGG: ${ticketId}\n**Starttid:** ${new Date().toISOString()}\n**Modell:** ${MODEL_NAME}\n\n---\n### INITIAL PROMPT\n\`\`\`\n${ticketPrompt}\n\`\`\`\n`, 'utf-8');

  let testExt = 'ts';
  const domainDir = path.join(ROOT_DIR, 'src', 'features', targetDomain);
  const hasTsxExtensions = (dir: string): boolean => {
    if (!fs.existsSync(dir)) return false;
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      if (item.isDirectory() && item.name !== '__tests__') {
        if (hasTsxExtensions(path.join(dir, item.name))) return true;
      } else if (item.name.endsWith('.tsx')) {
        return true;
      }
    }
    return false;
  };

  if (targetDomain === 'a2ui' || ticketPrompt.includes('.tsx') || ticketPrompt.includes('React') || hasTsxExtensions(domainDir)) {
    testExt = 'tsx';
  }

  const transientTestFile = `src/__tests__/transient_${ticketId}.test.${testExt}`;
  const transientTestFullPath = path.join(ROOT_DIR, transientTestFile);

  ['ts', 'tsx'].forEach(ext => {
    const globPattern = path.join(ROOT_DIR, 'src', '__tests__', `transient_*.test.${ext}`);
    const files = execSync(`ls ${globPattern} 2>/dev/null || true`, { encoding: 'utf-8' }).split('\n').filter(Boolean);
    for (const f of files) {
      if (fs.existsSync(f)) {
        console.log(`🧹 [STARTSANERING]: Tar bort transient testfil: ${path.basename(f)}`);
        fs.unlinkSync(f);
      }
    }
  });

  try {
    const gitStatus = execSync(`git status --porcelain src/`, { encoding: 'utf-8', cwd: ROOT_DIR });
    const untracked = gitStatus.split('\n').filter(l => l.startsWith('?? ')).map(l => l.substring(3).trim());
    for (const f of untracked) {
      const full = path.resolve(ROOT_DIR, f);
      if (fs.existsSync(full) && !fs.lstatSync(full).isDirectory()) {
        console.log(`🧹 [STARTSANERING]: Tar bort ospårad fil i src/: ${f}`);
        fs.unlinkSync(full);
      }
    }
  } catch (err: any) {
    console.warn(`⚠️ [STARTSANERING]: Kunde inte rensa ospårade filer: ${err?.message || err}`);
  }

  const startAnchor = `BILJETT: ${ticketId}\nDOMÄN: ${targetDomain}\nREPOTOPOGRAFI:\n${getFeatureIndexText()}\nKONTRAKT:\n${ticketPrompt}`;

  console.log('### FAS 0: PREMISSVALIDERING & DÖRRVAKT');
  await exekveraFas1Sweep(ai, systemInstruction, ticketId, ticketPrompt, startAnchor, runMicroChannel);

  console.log('\n### FAS 2: KÄLLKODSEXEKVERING\n');
  let codeSaved = { value: false };
  const modifiedFiles: string[] = [];
  const createdModules: string[] = [];
  const executeFas2Tools = createFas2ToolExecutor(isMaint, targetDomain, modifiedFiles, createdModules, codeSaved, ticketPrompt, ticketPath);

  process.argv.forEach((val, index) => {
    if (val.startsWith('--omvandelse=')) {
      const parts = val.split('=');
      if (parts.length > 1) {
        process.argv[index] = '--omvandelse=0';
        console.log(`🔄 [OMVÄNDELSERÄKNARE]: Nollställer omvändelseregnaren före --kritik-iter=1`);
      }
    }
  });

  await korFas2Loop(
    ai, systemInstruction, ticketId, ticketPath, targetDomain, startAnchor, runMicroChannel, transientTestFile, transientTestFullPath, isMaint, codeSaved, modifiedFiles, createdModules, codegenTools, executeFas2Tools, isFas2Complete, getFas2FollowupPrompt
  );

  if (!isMaint) {
    konsolideraTest(targetDomain, ticketId, testExt, createdModules, transientTestFullPath);
    synkaDomanBarrel(targetDomain, createdModules);
    uppdateraFeatureIndex(targetDomain, createdModules);
  }

  uppdateraBiljettstatus(ticketId);
  execSync('pnpm verify', { stdio: 'inherit', cwd: ROOT_DIR });
  if (!isMaint) saneraSkordadLegacy(ticketPath);

  if (isMaint) {
    await hanteraTrepunktsbesiktning(ticketId, ai, systemInstruction);
  }

  genomforGitCommitPush(isMaint, ticketId, targetDomain);
}

main().catch(err => {
  dumpCrashDiff();
  console.error("\n💥 Byggfel:", err);
  process.exit(1);
});
