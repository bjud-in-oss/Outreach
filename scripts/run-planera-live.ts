import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { GoogleGenAI } from '@google/genai';
import { dumpCrashDiff, restoreScriptsBackup, createVerifiedScriptsBackup } from './lib/shellAndBackup.js';
import { getFeatureIndexText, appendCycleLog, runMicroChannel } from './lib/channelRunner.js';
import { hanteraKonstruktivKritik } from './lib/critiqueTriage.js';
import { exekveraFas1Sweep } from './lib/fas1Sweep.js';
import { korFas2Loop } from './lib/fas2Loop.js';
import { codegenTools, createFas2ToolExecutor, isFas2Complete, getFas2FollowupPrompt } from './lib/fas2Tooling.js';
import { konsolideraTest, synkaDomanBarrel, uppdateraFeatureIndex, uppdateraBiljettstatus, hanteraTrepunktsbesiktning, genomforGitCommitPush, saneraSkordadLegacy } from './lib/fas3Consolidation.js';
import { getCompactTicketWindow, validateTicketScope } from './lib/ticketAndAnchor.js';

const ROOT_DIR = process.cwd();
const CYCLE_LOG_DIR = path.join(ROOT_DIR, 'doc', 'LAST_CYCLE');
const CYCLE_LOG_PATH = path.join(CYCLE_LOG_DIR, 'CYCLE_LOG.md');
const SI_PATH = path.join(ROOT_DIR, 'doc', 'SI_v10.5.md');
const TICKETS_PATH = path.join(ROOT_DIR, 'doc', 'TICKETS.md');
const IMPROVEMENTS_PATH = path.join(ROOT_DIR, 'doc', 'PROCESS_IMPROVEMENTS.md');

const MODEL_NAME = process.env.LIVE_MODEL || process.env.GEMINI_MODEL || 'gemini-3.8-live';
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error('❌ KRITISKT FEL: GEMINI_API_KEY saknas i miljövariablerna.');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY, apiVersion: 'v1alpha' });
if (!fs.existsSync(CYCLE_LOG_DIR)) fs.mkdirSync(CYCLE_LOG_DIR, { recursive: true });

process.on('exit', (code) => {
  if (code !== 0) {
    dumpCrashDiff();
    restoreScriptsBackup();
  }
});

const systemInstruction = fs.existsSync(SI_PATH)
  ? fs.readFileSync(SI_PATH, 'utf-8')
  : 'Du är motorn i Outreach Coordination Engine v10.5.';

async function main() {
  const isMaintRun = process.argv.some((a) => a.toUpperCase().includes('MAINT'));
  if (isMaintRun) {
    try { createVerifiedScriptsBackup(); } catch { process.exit(1); }
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

  const ticketPath = ticketId === 'PROMPT'
    ? path.join(ROOT_DIR, 'PROMPT.md')
    : path.join(ROOT_DIR, 'doc', '.TICKETS', `${ticketId}.md`);

  if (!fs.existsSync(ticketPath)) {
    console.error(`❌ Biljettfil saknas: ${ticketPath}`);
    process.exit(1);
  }

  const ticketPrompt = fs.readFileSync(ticketPath, 'utf-8');
  let targetDomain = isMaint ? 'scripts' : 'telemetry';
  const domainMatch = ticketPrompt.match(/src\/features\/([a-zA-Z0-9_-]+)/);
  if (domainMatch && !isMaint) targetDomain = domainMatch[1];

  const scope = validateTicketScope(ticketPrompt, isMaint, targetDomain);
  if (!scope.valid) {
    console.error(`❌ [OMFÅNGSSPÄRR]: ${scope.reason}`);
    process.exit(1);
  }

  console.log(`🎯 Måldomän: ${isMaint ? 'scripts/ & doc/ (Underhåll)' : `src/features/${targetDomain}/`}\n`);
  try { execSync('node scripts/update-tickets.js', { cwd: ROOT_DIR }); } catch {}

  fs.writeFileSync(CYCLE_LOG_PATH, `# BYGGCYKEL LOGG: ${ticketId}\n**Starttid:** ${new Date().toISOString()}\n**Modell:** ${MODEL_NAME}\n\n---\n### INITIAL PROMPT\n\`\`\`\n${ticketPrompt}\n\`\`\`\n`, 'utf-8');

  const domainDir = path.join(ROOT_DIR, 'src', 'features', targetDomain);
  const testExt = (targetDomain === 'a2ui' || ticketPrompt.includes('.tsx') || ticketPrompt.includes('React')) ? 'tsx' : 'ts';
  const transientTestFile = `src/__tests__/transient_${ticketId}.test.${testExt}`;
  const transientTestFullPath = path.join(ROOT_DIR, transientTestFile);

  ['ts', 'tsx'].forEach((ext) => {
    const files = execSync(`ls ${path.join(ROOT_DIR, 'src', '__tests__', `transient_*.test.${ext}`)} 2>/dev/null || true`, { encoding: 'utf-8' }).split('\n').filter(Boolean);
    files.forEach((f) => { if (fs.existsSync(f)) fs.unlinkSync(f); });
  });

  const syncDomainBarrel = () => {
    if (isMaint) return;
    const barrelPath = path.join(domainDir, 'index.ts');
    if (!fs.existsSync(barrelPath) || !fs.existsSync(domainDir)) return;
    let barrelContent = fs.readFileSync(barrelPath, 'utf-8');
    const walk = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) return e.name === '__tests__' ? [] : walk(full);
      if ((e.name.endsWith('.ts') || e.name.endsWith('.tsx')) && e.name !== 'index.ts' && !e.name.includes('.test.')) {
        return [path.relative(domainDir, full).replace(/\.(ts|tsx)$/, '').replace(/\\/g, '/')];
      }
      return [];
    });
    for (const mod of walk(domainDir)) {
      if (!barrelContent.includes(`./${mod}`)) barrelContent = barrelContent.trim() + `\nexport * from './${mod}';\n`;
    }
    fs.writeFileSync(barrelPath, barrelContent, 'utf-8');
  };

  const recentTickets = fs.existsSync(TICKETS_PATH) ? getCompactTicketWindow(fs.readFileSync(TICKETS_PATH, 'utf-8'), 5) : '';
  const startAnchor = `BILJETT: ${ticketId}\nDOMÄN: ${targetDomain}\n${recentTickets}\nREPOTOPOGRAFI:\n${getFeatureIndexText()}\nKONTRAKT:\n${ticketPrompt}`;

  const planContract = await exekveraFas1Sweep(ai, MODEL_NAME, ticketPrompt, systemInstruction, startAnchor, isMaint, appendCycleLog);

  console.log('\n### FAS 2: KÄLLKODSEXEKVERING\n');
  const codeSaved = { value: false };
  const modifiedFiles: string[] = [];
  const createdModules: string[] = [];
  const executeFas2Tools = createFas2ToolExecutor(isMaint, targetDomain, modifiedFiles, createdModules, codeSaved, ticketPrompt, ticketPath);
  const fas2Prompt = `Genomför samtliga källkodsändringar i kontraktet. Använd 'apply_patch' på befintliga filer och 'save_code' endast för nya filer.\nBYGGKONTRAKT:\n${planContract}`;

  await korFas2Loop(
    ai,
    MODEL_NAME,
    isMaint,
    targetDomain,
    `BILJETTKONTRAKT:\n${ticketPrompt}\n\nBYGGKONTRAKT:\n${planContract}`,
    systemInstruction,
    codegenTools,
    executeFas2Tools,
    fas2Prompt,
    () => isFas2Complete(codeSaved, ticketPath, isMaint, targetDomain, modifiedFiles),
    () => getFas2FollowupPrompt(ticketPath, isMaint, targetDomain, modifiedFiles),
    transientTestFile,
    transientTestFullPath,
    syncDomainBarrel,
    modifiedFiles
  );

  if (!isMaint) {
    execSync(`node scripts/drivers/ts.js --check-alibi --file ${transientTestFile}`, { stdio: 'inherit', cwd: ROOT_DIR });
    konsolideraTest(targetDomain, ticketId, testExt, createdModules, transientTestFullPath);
    synkaDomanBarrel(targetDomain, createdModules);
    uppdateraFeatureIndex(targetDomain, createdModules);
  }

  uppdateraBiljettstatus(ticketId);
  execSync('pnpm verify', { stdio: 'inherit', cwd: ROOT_DIR });
  if (!isMaint) saneraSkordadLegacy(ticketPath);

  if (!process.argv.includes('--kritik-iter')) {
    const cycleSummary = fs.existsSync(CYCLE_LOG_PATH) ? fs.readFileSync(CYCLE_LOG_PATH, 'utf-8').slice(-4000) : ticketId;
    const kritik: any = await hanteraKonstruktivKritik(ai, MODEL_NAME, ticketId, cycleSummary, systemInstruction);
    if (kritik?.harStorSkillnad) {
      execSync(`npx tsx scripts/run-planera-live.ts ${ticketId} --kritik-iter=1 --omvandelse=0`, { stdio: 'inherit', cwd: ROOT_DIR });
      process.exit(0);
    }
  }

  if (isMaint) {
    await hanteraTrepunktsbesiktning(ticketId, ai, systemInstruction);
  }

  genomforGitCommitPush(isMaint, ticketId, targetDomain);
}

main().catch((err) => {
  dumpCrashDiff();
  console.error('\n💥 Byggfel:', err);
  process.exit(1);
});
