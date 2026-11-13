import { mutateSourceCodeAST } from './drivers/astMutator.js';
/**
 * scripts/run-planera-live.ts
 * 
 * OUTREACH COORDINATION ENGINE (v10.5)
 * Helautonom orkestreringsmotor med Action Loop, testkonsolidering,
 * dokumentationssynk, och en interaktiv mänsklig beslutsgrind för systemunderhåll.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { execSync } from 'child_process';
import { GoogleGenAI } from '@google/genai';
import { BidiLiveSession } from './bidiLiveRunner.js';
import { applySourcePatch } from './drivers/patchMutator.js';
import { execCaptured, dumpCrashDiff, restoreScriptsBackup } from './lib/shellAndBackup.js';
import { getRequiredFiles, buildRetryAnchor } from './lib/ticketAndAnchor.js';
import { getFeatureIndexText, getInstalledDependencies, appendCycleLog } from './lib/channelRunner.js';
import { saneraSkordadLegacy } from './lib/fas3Consolidation.js';

const ROOT_DIR = process.cwd();

const CYCLE_LOG_DIR = path.join(ROOT_DIR, 'doc', 'LAST_CYCLE');
const CYCLE_LOG_PATH = path.join(CYCLE_LOG_DIR, 'CYCLE_LOG.md');
const CRASH_DUMP_PATH = path.join(CYCLE_LOG_DIR, 'CRASH_DUMP.json');
const SI_PATH = path.join(ROOT_DIR, 'doc', 'SI_v10.5.md');
const FEATURE_INDEX_PATH = path.join(ROOT_DIR, 'doc', 'FEATURE_INDEX.json');
const TICKETS_PATH = path.join(ROOT_DIR, 'doc', 'TICKETS.md');
const PKG_PATH = path.join(ROOT_DIR, 'package.json');

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

interface ChannelOptions {
  requireMutation?: boolean;
  maxTurns?: number;
  onMutationCheck?: () => boolean;
  getFollowupPrompt?: () => string;
}

async function runMicroChannel(
  kraft: 'Att följa' | 'Att vända om' | 'Att förlikas',
  stepInstruction: string,
  startAnchor: string,
  si: string,
  tools: any[] = [],
  executeTool?: (name: string, args: any) => string,
  options: ChannelOptions = {}
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
      const followUp = options.getFollowupPrompt ? options.getFollowupPrompt() : `Du har genomfört inspektion. Slutför nu uppdraget omedelbart! Använd 'apply_patch' för att uppdatera befintliga filer, eller 'save_code' om du skapar en helt ny fil.`;
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
  const startTime = Date.now();
  const isMaintRun = process.argv.some(a => a.toUpperCase().includes("MAINT"));
  if (isMaintRun) {
    const backupDir = path.join(CYCLE_LOG_DIR, "scripts_backup");
    try {
      fs.rmSync(backupDir, { recursive: true, force: true });
      fs.mkdirSync(backupDir, { recursive: true });
      fs.cpSync(path.join(ROOT_DIR, "scripts"), backupDir, { recursive: true });
      console.log("🛡️ [MAINT-SÄKERHETSNÄT]: Säkerhetskopia av scripts/ skapad i doc/LAST_CYCLE/scripts_backup/\n");
    } catch (e: any) {
      console.warn("⚠️ [MAINT-SÄKERHETSNÄT]: Kunde inte skapa säkerhetskopia av scripts/:", e.message);
    }
  }
  const ticketArg = process.argv[2];
  let ticketId = ticketArg ? ticketArg.toUpperCase() : 'PROMPT';
  if (ticketId.endsWith('.MD')) ticketId = ticketId.replace('.MD', '');

  const isMaint = ticketId.startsWith('TCK-MAINT');

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

  try {
    execSync('node scripts/update-tickets.js', { cwd: ROOT_DIR });
  } catch (err) {
    console.warn('⚠️ Kunde inte köra scripts/update-tickets.js:', err);
  }

  const syncDomainBarrel = () => {
    if (isMaint) return;
    const barrelPath = path.join(ROOT_DIR, `src/features/${targetDomain}/index.ts`);
    if (!fs.existsSync(barrelPath)) return;
    const domainDir = path.join(ROOT_DIR, 'src', 'features', targetDomain);
    const getAllMods = (dir, baseDir) => {
      let results = [];
      for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, item.name);
        if (item.isDirectory()) {
          if (item.name !== '__tests__') results = results.concat(getAllMods(full, baseDir));
        } else if ((item.name.endsWith('.ts') || item.name.endsWith('.tsx')) && item.name !== 'index.ts') {
          if (item.name.includes('.test.') || item.name.includes('.spec.')) continue;
          results.push(path.relative(baseDir, full).replace(/\.(ts|tsx)$/, '').replace(/\\/g, '/'));
        }
      }
      return results;
    };
    const allMods = getAllMods(domainDir, domainDir);
    let barrelContent = fs.readFileSync(barrelPath, 'utf-8');
    let changed = false;
    for (const mod of allMods) {
      const exp = `export * from './${mod}';`;
      if (!barrelContent.includes(`./${mod}`)) {
        barrelContent = barrelContent.trim() + `\n${exp}\n`;
        console.log(`   🔗 [BARREL-UPDATE]: Exporterar ./${mod} i index.ts`);
        changed = true;
      }
    }
    if (changed) fs.writeFileSync(barrelPath, barrelContent, 'utf-8');
  };

  // ==========================================
  // DYNAMISK TESTEXTENSION & STARTSANERING
  // ==========================================
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

  fs.writeFileSync(CYCLE_LOG_PATH, `# BYGGCYKEL LOGG: ${ticketId}\n**Starttid:** ${new Date().toISOString()}\n**Modell:** ${MODEL_NAME}\n\n---\n### INITIAL PROMPT\n\`\`\`\n${ticketPrompt}\n\`\`\`\n`, 'utf-8');

  // ==========================================
  // FAS 0: PREMISSVALIDERING & DÖRRVAKT
  // ==========================================
  console.log('### FAS 0: PREMISSVALIDERING & DÖRRVAKT');
  const steg1a = await runMicroChannel('Att följa', 'Steg 1a: Förstå Intention & Mänsklig Nytta.', ticketPrompt, systemInstruction);
  appendCycleLog('1a Att följa: Intention & Nytta', steg1a);

  const steg0a = await runMicroChannel('Att vända om', 'Steg 0a: Kontraktsaudit.', `${ticketPrompt}\n\nINTENTION:\n${steg1a}`, systemInstruction);
  appendCycleLog('0a Att vända om: Kontraktsaudit', steg0a);

  const steg0b = await runMicroChannel('Att förlikas', 'Steg 0b: Vägval. Svara enbart "STATUS: GODKÄND" om godkänd.', steg0a, systemInstruction);
  appendCycleLog('0b Att förlikas: Vägval', steg0b);

  if (!steg0b.includes('GODKÄND')) {
    console.error('❌ Fas 0 underkändes av Att förlikas.');
    process.exit(1);
  }

  // ==========================================
  // FAS 1: LINJÄRT PLANERINGSSVEP
  // ==========================================
  console.log('\n### FAS 1: LINJÄRT PLANERINGSSVEP (MIKRO-OSCILLATION)');
  let busContract = '';
  const busPath = path.join(ROOT_DIR, 'src', 'shared', 'bus', 'swarmEventBus.ts');
  if (fs.existsSync(busPath)) {
    busContract = `\n\nDELAD INFRASTRUKTUR (SwarmEventBus API):\n${fs.readFileSync(busPath, 'utf-8')}`;
  }
  let crashDumpContext = '';
  if (fs.existsSync(CRASH_DUMP_PATH)) {
    try {
      const dump = fs.readFileSync(CRASH_DUMP_PATH, 'utf-8');
      crashDumpContext = `\n\n⚠️ TIDIGARE BYGGFÖRSÖK HAVERERADE I FAS 2 (OMVÄNDELSE AKTIVERAD):\n${dump}\nAnalysera felet ovan i Fas 1 och välj ett hållbart kontrakt som undviker detta haveri!`;
      fs.unlinkSync(CRASH_DUMP_PATH);
    } catch (err: any) {
      console.warn(`⚠️ [OMVÄNDELSE]: Kunde inte läsa kraschdump: ${err?.message || err}`);
    }
  }
  const startAnchor = `BILJETT: ${ticketId}\nDOMÄN: ${targetDomain}\nREPOTOPOGRAFI:\n${getFeatureIndexText()}\nKONTRAKT:\n${ticketPrompt}${busContract}${crashDumpContext}`;

  const inspectionTools = [
    {
      name: 'read_file',
      behavior: 'NON_BLOCKING',
      description: 'Läser fil i repot (stora filer trunkeras).',
      parameters: { type: 'OBJECT', properties: { file_path: { type: 'STRING' } }, required: ['file_path'] },
    },
    {
      name: 'list_files',
      behavior: 'NON_BLOCKING',
      description: 'Listar innehållet i en katalog.',
      parameters: { type: 'OBJECT', properties: { directory_path: { type: 'STRING' } }, required: ['directory_path'] },
    }
  ];

  const executeInspection = (name: string, args: any) => {
    if (name === 'read_file') {
      const full = path.resolve(ROOT_DIR, args.file_path);
      if (!fs.existsSync(full)) return `Filen ${args.file_path} finns inte.`;
      const content = fs.readFileSync(full, 'utf-8');
      return content;
    }
    if (name === 'list_files') {
      const rel = args.directory_path || '.';
      const full = path.resolve(ROOT_DIR, rel);
      if (!fs.existsSync(full)) return `Katalogen ${rel} finns inte.`;
      const entries = fs.readdirSync(full, { withFileTypes: true });
      return entries.map(e => `${e.isDirectory() ? '[DIR]' : '[FIL]'} ${e.name}`).join('\n');
    }
    return 'Okänt verktyg';
  };

  const steg1b = await runMicroChannel('Att följa', 'Steg 1b: Kartlägg domängränser via read_file och list_files.', startAnchor, systemInstruction, inspectionTools, executeInspection);
  appendCycleLog('1b Att följa: Domängränser', steg1b);

  const steg2b = await runMicroChannel('Att följa', 'Steg 2b: Formulera 3 ortogonala alternativ för lösning. REGLER: Introducera ALDRIG externa beroenden eller granndomäner (som SwarmEventBus) om inte biljetten uttryckligen efterfrågar distribuerad telemetri.', `${startAnchor}\n${steg1b}`, systemInstruction);
  appendCycleLog('2b Att följa: 3 Alternativ', steg2b);

  const steg2c = await runMicroChannel('Att vända om', 'Steg 2c: Resiliensgranskning av alternativen.', `${startAnchor}\n${steg2b}`, systemInstruction);
  appendCycleLog('2c Att vända om: Resiliensgranskning', steg2c);

  const steg2d = await runMicroChannel('Att förlikas', 'Steg 2d: Slå fast vinnande alternativ. Deklarera MÄTTNAD: JA.', steg2c, systemInstruction);
  appendCycleLog('2d Att förlikas: Mättnad', steg2d);

  // Steg 3a: Testspecifikation (Hoppas över för MAINT-biljetter som rör scripts/)
  let testSaved = false;
  const testGenTools = [
    ...inspectionTools,
    {
      name: 'save_code',
      behavior: 'NON_BLOCKING',
      description: 'Sparar transient testfil.',
      parameters: { type: 'OBJECT', properties: { file_path: { type: 'STRING' }, code: { type: 'STRING' } }, required: ['file_path', 'code'] },
    }
  ];

  const executeTestGen = (name: string, args: any) => {
    if (name === 'read_file' || name === 'list_files') return executeInspection(name, args);
    if (name === 'save_code') {
      fs.mkdirSync(path.dirname(transientTestFullPath), { recursive: true });
      fs.writeFileSync(transientTestFullPath, args.code, 'utf-8');
      testSaved = true;
      console.log(`\n   💾 [SPARAD TESTFIL]: ${transientTestFile} (${args.code.length} tecken)`);
      return `Testfil sparad till ${transientTestFile}`;
    }
    return 'Okänt verktyg';
  };

  let steg3c = steg2d;

  if (!isMaint) {
    const steg3a = await runMicroChannel(
      'Att följa',
      `      Steg 3a: Generera transient testspecifikation och spara till '${transientTestFile}' med save_code.
KRAV FÖR TDD OCH FAIL-FIRST:
1. EPISTEMISK LÄSNING: Anropa först 'read_file' på SAMTLIGA befintliga filer listade under **Målfiler:** i biljetten (samt 'list_files' vid behov) så att du ser deras exakta fält- och metodnamn. Gissa ALDRIG egenskaper, fältnamn eller props!
2. IMPORTERA FRÅN DOMÄNEN: Testet MÅSTE importera funktioner och typer från '../features/${targetDomain}/...' (t.ex. import { knackaPaPorten } from '../features/${targetDomain}/engine/pathRunner').
3. INGEN PRODUKTIONSKOD I TESTET: Implementera ALDRIG funktionerna eller klasserna inuti testfilen.
4. Testet MÅSTE fallera rött (exit 1) eftersom produktionskoden inte existerar än.
5. Anropa save_code i vända 1.
6. PUBLIK INGÅNGSPUNKT (INGA ISOLERADE HJÄLPFILS-ALIBIN): När en biljett skapar eller uppdaterar en hjälpmodul (t.ex. *Helper.ts) MÅSTE testet instansiera och anropa domänens publika ingångsklass/orkestrator (och verifiera beteendet genom den, inte enbart genom direkta anrop till hjälpfilen) så att inkopplingen mellan huvudklass och hjälpmodul bevisas ände-till-ände.
7. INGA SPIONER ELLER ALIBIN (GATE 3a): Använd ALDRIG vi.fn(), vi.spyOn(), jest.fn(), fs.readFileSync eller expect(true).toBe(true) i testet. Använd rena tillståndsvariabler (let anropad = false;) och minnesobjekt.`,
      `${startAnchor}\nKONTRAKT:\n${steg2d}`,
      systemInstruction,
      testGenTools,
      executeTestGen,
      { 
        requireMutation: true, 
        maxTurns: 5, 
        onMutationCheck: () => testSaved,
        getFollowupPrompt: () => `Du har inspekterat domänen. Spara nu den kompletta transienta testfilen till '${transientTestFile}' med verktyget 'save_code' omedelbart!`
      }
    );
    appendCycleLog('3a Att följa: Testspecifikation', steg3a);

    const steg3b = await runMicroChannel(
      'Att följa',
      `Steg 3b: Källkodsspecifikation inklusive domänexport.
KRAV FÖR EPISTEMISK ÖDMJUKHET (NOLL GISSNINGAR): 
1. Innan du specificerar koden, MÅSTE du anropa 'read_file' på den eller de filer du planerar att modifiera (t.ex. 'src/features/...').
2. Utgå EXAKT från filens nuvarande källkod. Hitta de exakta sökblocken (search_block) där ny kod ska in. Gissa ALDRIG befintliga props, imports eller kodstruktur!`,
      `${startAnchor}\nTEST:\n${steg3a}`,
      systemInstruction,
      inspectionTools,
      executeInspection
    );
    appendCycleLog('3b Att följa: Källkod', steg3b);

    // Bär ALLTID med hela startankaret och biljetten så att förlikaren aldrig blir minneslös
    const forlikasAnchor = `${startAnchor}\n\nGENERERAT TEST:\n${steg3a}\n\nKÄLLKODSSPECIFIKATION:\n${steg3b}`;
    steg3c = await runMicroChannel('Att förlikas', 'Steg 3c: Slutgiltigt byggkontrakt. Fastställ filer att skapa och bevara i index.ts.', forlikasAnchor, systemInstruction);
    appendCycleLog('3c Att förlikas: Slutgiltigt Byggkontrakt', steg3c);
  }

  // ==========================================
  // FAS 2: KÄLLKODSEXEKVERING
  // ==========================================
  console.log('\n### FAS 2: KÄLLKODSEXEKVERING\n');

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
        testSaved = false;
        const recoveryStartAnchor = `${startAnchor}\n\nBEFINTLIGT TEST:\n${fs.existsSync(transientTestFullPath) ? fs.readFileSync(transientTestFullPath, 'utf-8') : ''}`;
        const recoveryPrompt = `Gate 3a underkände testet!
FELLOGG:
${err.message || String(err)}
Åtgärda och spara till '${transientTestFile}'. Ta bort all import av 'vi' och ersätt varje vi.fn()/vi.spyOn() med vanliga variabler (let anropad = false;) utan tautologier.

KONTRAKT OCH BAKGRUND:
${startAnchor}`;
        await runMicroChannel('Att vända om', recoveryPrompt, recoveryStartAnchor, systemInstruction, testGenTools, executeTestGen, { requireMutation: true, maxTurns: 5, onMutationCheck: () => testSaved });
      }
    }

    console.log('\n🔴 Gate 3a Fail-First: Verifierar att testet fallerar rött (exit 1)...');
    let testFailedAsExpected = false;
    let failFirstOutput = '';
    try {
      syncDomainBarrel();
      execSync(`npx vitest run ${transientTestFile}`, { stdio: 'pipe', cwd: ROOT_DIR });
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
    if (failFirstOutput.includes('Failed to resolve import') && !failFirstOutput.includes(`../features/${targetDomain}`)) {
      console.error('❌ GATE 3a UNDERKÄND: Testet kraschar på trasiga externa importer!');
      console.error(failFirstOutput.slice(0, 1000));
      process.exit(1);
    }
    console.log('✅ Godkänt Fail-First: Testet fallerade rött av rätt orsak.');
  }

  console.log('\n⚡ Exekverar kodändringar via Bidi Live WebSocket...');
  let codeSaved = false;
  const createdModules: string[] = [];
  const modifiedFiles: string[] = [];

  const codegenTools = [
    ...inspectionTools,
    {
      name: 'save_code',
      behavior: 'NON_BLOCKING',
      description: 'Skapar en helt NY fil som inte existerar än. För befintliga filer, använd apply_patch för att inte radera historisk kod!',
      parameters: { type: 'OBJECT', properties: { file_path: { type: 'STRING' }, code: { type: 'STRING' } }, required: ['file_path', 'code'] },
    },
    {
      name: 'apply_patch',
      behavior: 'NON_BLOCKING',
      description: 'Gör en kirurgisk ändring i en BEFINTLIG fil via search & replace. Kräver 1-2 omgivande rader i search_block för att garantera unikhet.',
      parameters: {
        type: 'OBJECT',
        properties: {
          file_path: { type: 'STRING', description: 'Relativ sökväg till filen' },
          search_block: { type: 'STRING', description: 'Exakt kodblock som ska bytas ut (inkludera 1-2 rader omgivande kontext)' },
          replace_block: { type: 'STRING', description: 'Ny kod som ska ersätta search_block' },
        },
        required: ['file_path', 'search_block', 'replace_block'],
      },
    }
  ];

  const executeFas2Tools = (name: string, args: any) => {
    if (name === 'read_file' || name === 'list_files') return executeInspection(name, args);

    const rel = args.file_path;
    if (!isMaint && !rel.startsWith(`src/features/${targetDomain}/`)) {
      throw new Error(`Otillåten skrivning till ${rel}. Endast src/features/${targetDomain}/ är tillåtet.`);
    }
    const full = path.resolve(ROOT_DIR, rel);

    if (name === 'save_code') {
      if (fs.existsSync(full) && (rel.endsWith("model/types.ts") || rel.endsWith("index.ts") || rel.includes("contracts/"))) {
        const existingContent = fs.readFileSync(full, "utf-8");
        const existingExports = (existingContent.match(/export (?:interface|type|class|const|function) ([a-zA-Z0-9_]+)/g) || []);
        for (const exp of existingExports) {
          const id = exp.split(" ").pop();
          if (!args.code.includes(id)) {
            throw new Error(`AVVISAD TYPAMPUTATION: Din nya kod saknar tidigare deklarerad export "${id}". Använd apply_patch för att lägga till nya typer utan att radera historiska kontrakt!`);
          }
        }
      }
      // 🛑 SKYDD MOT KODAMPUTATION: Tillåt inte att en stor befintlig fil ersätts med en stubbe
      if (fs.existsSync(full)) {
        const existingContent = fs.readFileSync(full, 'utf-8');
        if (existingContent.length > 500 && args.code.length < existingContent.length * 0.4) {
          throw new Error(`AVVISAD TRUNKERING: '${rel}' har ${existingContent.length} tecken men din nya kod har bara ${args.code.length} tecken. Använd verktyget 'apply_patch' för att lägga till din funktion i filen utan att radera befintlig kod!`);
        }
      }

      fs.mkdirSync(path.dirname(full), { recursive: true });
      fs.writeFileSync(full, args.code, 'utf-8');
      codeSaved = true;
      if (!modifiedFiles.includes(rel)) modifiedFiles.push(rel);

      if (!isMaint && rel.startsWith(`src/features/${targetDomain}/`) && !rel.endsWith('index.ts') && !rel.includes('__tests__')) {
        const domainDir = path.join(ROOT_DIR, 'src', 'features', targetDomain);
        const base = path.relative(domainDir, full).replace(/\.(ts|tsx)$/, '').replace(/\\/g, '/');
        if (!createdModules.includes(base)) createdModules.push(base);
      }
      console.log(`\n   💾 [SPARAD FIL]: ${rel} (${args.code.length} tecken)`);
      return `Fil sparad till ${rel}`;
    }

    if (name === 'apply_patch') {
      if (!fs.existsSync(full)) {
        throw new Error(`Filen '${rel}' finns inte. Använd save_code för att skapa nya filer.`);
      }
      const existingContent = fs.readFileSync(full, 'utf-8');
      const patchedContent = applySourcePatch(existingContent, args.search_block, args.replace_block, rel);
      if (patchedContent === existingContent) {
        throw new Error("SEARCH_BLOCK_NOT_FOUND: Sökblocket hittades inte. Bygget kraschas mekaniskt för att undvika tomma tillstånd.");
      }
      fs.writeFileSync(full, patchedContent, 'utf-8');
      codeSaved = true;
      if (!modifiedFiles.includes(rel)) modifiedFiles.push(rel);

      console.log(`\n   🩹 [PATCH APPLICERAD]: ${rel} (Ny storlek: ${patchedContent.length} tecken)`);
      return `Patch applicerad framgångsrikt på ${rel}.`;
    }

    return 'Okänt verktyg';
  };

  const fas2Prompt = isMaint 
    ? `Fas 2: Skriv och tillämpa underhållskoden för att lösa biljetten ${ticketId}. Spara filerna med save_code!`
    : `Fas 2: KÄLLKODSEXEKVERING FÖR ${targetDomain.toUpperCase()}
UPPDRAG: Implementera källkoden under 'src/features/${targetDomain}/' för att uppfylla byggkontraktet och få testet grönt.

REGLER OCH DINA 3 TILLÅTNA HANDLINGSVÄGAR (ADR-013):
1. VÄG 1 (Lokal reparation): Rätta koden i befintlig fil via 'apply_patch' (inspektera alltid med 'read_file' först).
2. VÄG 2 (Modulär expansion): Skapa nya hjälpfiler under 'src/features/${targetDomain}/' och exportera via 'index.ts'.
3. VÄG 3 (Omvändelse / Metanoia):
   a) STATUS: HAVERERAT_KONTRAKT [orsak] (Vid tekniska/arkitektoniska omöjligheter - loopar till Fas 1)
   b) STATUS: FRIVILLIG_OMVÄNDELSE [orsak] (För att frivilligt sanera skuld - loopar till Fas 1)
   c) STATUS: FÖRLIKANDE_OMVÄNDELSE [orsak + fråga] (ADR-020: Om uppdraget strider mot systemets ideala kompass och skapar manipulation/övervakning. Stoppar bygget helt och bjuder in människan till förlikning i Mötesbryggan!)

TESTKOD SOM SKALL UPPFYLLAS:
\`\`\`typescript
${fs.existsSync(transientTestFullPath) ? fs.existsSync(transientTestFullPath) ? fs.readFileSync(transientTestFullPath, 'utf-8') : '' : ''}
\`\`\`
Anropa save_code och apply_patch för SAMTLIGA filer i byggkontraktet (inklusive engine, types och export i index.ts) innan du avslutar!`;

  const getRequiredFiles = (): string[] => {
    const ticketPrompt = fs.readFileSync(ticketPath, 'utf-8');
    const targetMatch = ticketPrompt.match(/\*\*Målfiler:\*\*\s*(.+)/);
    if (targetMatch) {
      const filesPart = targetMatch[1];
      const fileMatches = filesPart.match(/`([^`]+)`/g);
      if (fileMatches) {
        return fileMatches.map(m => m.replace(/`/g, ''));
      }
    }

    if (isMaint) {
      const scriptFiles = ticketPrompt.match(/scripts\/[a-zA-Z0-9_\-./]+\.(?:ts|js)/g) || [];
      const sharedFiles = ticketPrompt.match(/src\/shared\/[a-zA-Z0-9_\-./]+\.(?:ts|tsx)/g) || [];
      const rootFiles = ticketPrompt.match(/(?:vite\.config\.ts|package\.json|src\/App\.tsx)/g) || [];
      return Array.from(new Set([...scriptFiles, ...sharedFiles, ...rootFiles]));
    }
    const promptFiles = ticketPrompt.match(new RegExp(`src/features/${targetDomain}/[a-zA-Z0-9_/\\-]+\\.(ts|tsx)`, 'g')) || [];
    return Array.from(new Set(promptFiles)).filter(f => !f.includes('__tests__') && !f.endsWith('index.ts'));
  };

  const getMissingFiles = (): string[] => {
    return getRequiredFiles().filter(f => {
      const fullPath = path.join(ROOT_DIR, f);
      if (!fs.existsSync(fullPath)) return true;
      try {
        return fs.statSync(fullPath).size === 0;
      } catch (e: any) {
        return true;
      }
    });
  };

  const isFas2Complete = (): boolean => {
    if (!codeSaved) return false;
    const required = getRequiredFiles();
    const missing = getMissingFiles();
    return missing.length === 0 && required.every(f => modifiedFiles.includes(f));
  };

  const getFas2FollowupPrompt = (): string => {
    const missing = getMissingFiles();
    if (missing.length > 0) {
      return `⚠️ Följande källkodsfiler från kontraktet saknas fortfarande på disk:\n${missing.map(f => `- ${f}`).join('\n')}\nDu MÅSTE använda 'save_code' för att skapa och spara dessa filer innan bygget kan gå vidare!`;
    }
    const untouched = getRequiredFiles().filter(f => !modifiedFiles.includes(f));
    if (untouched.length > 0) {
       return `⚠️ Följande källkodsfiler från kontraktet har inte ändrats:\n${untouched.map(f => `- ${f}`).join('\n')}\nDu MÅSTE använda 'apply_patch' eller 'save_code' för att uppdatera dessa filer!`;
    }
    return `Du har genomfört inspektion. Slutför nu uppdraget omedelbart! Använd 'apply_patch' för att uppdatera befintliga filer, eller 'save_code' om du skapar en helt ny fil.`;
  };

  const fas2Anchor = `BILJETTKONTRAKT:\n${ticketPrompt}\n\nBYGGKONTRAKT (Fas 1):\n${steg3c}`;
  const fas2Response = await runMicroChannel('Att följa', fas2Prompt, fas2Anchor, systemInstruction, codegenTools, executeFas2Tools, {
    requireMutation: true,
    maxTurns: 5,
    onMutationCheck: isFas2Complete,
    getFollowupPrompt: getFas2FollowupPrompt
  });

  const isHaveri = fas2Response.includes('STATUS: HAVERERAT_KONTRAKT');
  const isFrivillig = fas2Response.includes('STATUS: FRIVILLIG_OMVÄNDELSE');
  const isForlikande = fas2Response.includes('STATUS: FÖRLIKANDE_OMVÄNDELSE');

  if ((isHaveri || isFrivillig || isForlikande) && !isMaint) {
    const triggerType = isForlikande ? 'FÖRLIKANDE_OMVÄNDELSE' : (isFrivillig ? 'FRIVILLIG_OMVÄNDELSE' : 'HAVERERAT_KONTRAKT');
    console.warn(`\n⚠️ [ADR-013/020 OMVÄNDELSE AKTIVERAD]: Typ: ${triggerType}`);
    
    if (!process.argv.includes('--omvandelse')) {
      console.log('🔄 Sanerar källkod...');
      try { execSync(`git checkout -- src/features/${targetDomain} 2>/dev/null || true`, { cwd: ROOT_DIR }); } catch (e: any) { console.warn('Git checkout failed', e?.message); }
      
      fs.writeFileSync(CRASH_DUMP_PATH, JSON.stringify({ ticket: ticketId, domain: targetDomain, trigger: triggerType, response: fas2Response }, null, 2), 'utf-8');
      
      if (triggerType === 'FÖRLIKANDE_OMVÄNDELSE') {
        console.error('\n⚖️ [KÖRTIDSRÅD]: Agenten avbryter för förlikning i Mötesbryggan.');
        process.exit(1);
      }
      
      try {
        console.log('🚀 Startar omplanering i Fas 1 via underprocess...');
        execSync(`npx tsx scripts/run-planera-live.ts ${ticketId} --omvandelse`, { stdio: 'inherit', cwd: ROOT_DIR });
        process.exit(0);
      } catch (err: any) {
        process.exit(err.status || 1);
      }
    } else {
      console.error('❌ Cykelspärr nådd.');
      process.exit(1);
    }
  }

  // 🛑 FAIL-FAST: Avbryt omedelbart om Fas 2 förbrukade sina vändor utan att spara eller patcha kod
  if (!codeSaved && !isMaint) {
    console.error('\n❌ FAS 2 MISSLYCKADES: Inga källkodsändringar utfördes under de tillåtna vändorna.');
    process.exit(1);
  }

  if (isMaint) {
    console.log('\n🛡️ [MAINT-VALIDERING]: Exekverar lokala kontroller för skriptdomänen...');
    let maintPassed = false;
    let maintAttempts = 0;
    while (!maintPassed && maintAttempts < 3) {
      maintAttempts++;
      try {
        console.log(`\n🔍 [MAINT]: Kör arkitekturkontroll (Försök ${maintAttempts}/3)...`);
        execCaptured('node scripts/verify-architecture.js');

        console.log(`\n🧪 [MAINT]: Kör skripttester (Försök ${maintAttempts}/3)...`);
        execCaptured(`npx vitest run scripts/__tests__/`);

        console.log(`\n🧪 [MAINT]: Kör full regressionssvit (Försök ${maintAttempts}/3)...`);
        execCaptured('pnpm test');
        execCaptured('npx esbuild scripts/run-planera-live.ts scripts/run-path.ts --bundle --platform=node --packages=external --outdir=/tmp/outreach-script-check');

        maintPassed = true;
        console.log('✅ [MAINT]: Lokala skriptkontroller godkända!');
      } catch (err: any) {
        console.warn(`\n⚠️ [MAINT SJÄLVRÄTTNING]: Kontrollerna fallerade i försök ${maintAttempts}/3.`);
        if (maintAttempts >= 3) {
          console.error('❌ [MAINT]: Maximalt antal självrättningsförsök uppnått för skriptunderhåll.');
          process.exit(1);
        }
        codeSaved = false;

        const errLog = err.stdout?.toString() || err.stderr?.toString() || err.message;
        
        const filesToInclude = Array.from(new Set([...modifiedFiles, ...getRequiredFiles(), 'src/features/path/model/types.ts']));
        let currentMaintSource = '';
        for (const relPath of filesToInclude) {
          const fullPath = path.resolve(ROOT_DIR, relPath);
          if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
            currentMaintSource += `\n--- ${relPath} ---\n` + fs.readFileSync(fullPath, 'utf-8');
          }
        }

        const maintRetryAnchor = buildRetryAnchor('', currentMaintSource, errLog);

        const maintRetryPrompt = `FAS 2 MAINT SJÄLVRÄTTNING (Försök ${maintAttempts}/3):
De lokala skriptkontrollerna fallerade!
FELLOGG:
${errLog}

VIKTIGA REGLER FÖR SJÄLVRÄTTNING:
1. Analysera felet ovan från 'verify-architecture.js' och 'vitest run scripts/__tests__/'.
2. Korrigera källkoden under 'scripts/' via 'save_code' eller 'apply_patch'!`;

        await runMicroChannel('Att vända om', maintRetryPrompt, maintRetryAnchor, systemInstruction, codegenTools, executeFas2Tools, { requireMutation: true, maxTurns: 5, onMutationCheck: isFas2Complete, getFollowupPrompt: getFas2FollowupPrompt });
      }
    }
  }
    
  if (!isMaint) {
    const barrelPath = path.join(ROOT_DIR, `src/features/${targetDomain}/index.ts`);
    if (fs.existsSync(barrelPath)) {
      let barrelContent = fs.readFileSync(barrelPath, 'utf-8');
      for (const mod of createdModules) {
        const exp = `export * from './${mod}';`;
        if (!barrelContent.includes(`./${mod}`)) {
          barrelContent = barrelContent.trim() + `\n${exp}\n`;
          console.log(`   🔗 [BARREL-UPDATE]: Exporterar ./${mod} i index.ts`);
        }
      }
      fs.writeFileSync(barrelPath, barrelContent, 'utf-8');
    }
  }

  if (!isMaint) {
    console.log('\n🟢 Kör transient-testet mot den nyskapade källkoden...');
    let testPassed = false;
    let attempts = 0;
    while (!testPassed && attempts < 3) {
      attempts++;
      syncDomainBarrel();
      try {
        console.log('\n🔒 Verifierar Gate 2c: AST-kontroll mot tysta catch-block...');
        const filesToScan = modifiedFiles.length > 0 ? modifiedFiles.join(' ') : `src/features/${targetDomain}`;
        execCaptured(`node scripts/drivers/ts.js --check-catch-blocks ${filesToScan}`);

        execCaptured(`npx vitest run ${transientTestFile}`);
        
        const domainTestsDir = path.join(ROOT_DIR, `src/features/${targetDomain}/__tests__`);
        if (fs.existsSync(domainTestsDir)) {
          const testFiles = fs.readdirSync(domainTestsDir).filter(f => f.endsWith(`.test.${testExt}`));
          if (testFiles.length > 0) execCaptured(`npx vitest run ${domainTestsDir}`);
        }

        testPassed = true;
      } catch (vitestErr: any) {
        const testLog = vitestErr.stdout?.toString() || vitestErr.stderr?.toString() || vitestErr.message;
        console.warn(`\n⚠️ [FAS 2 SJÄLVRÄTTNING]: Försök ${attempts}/3 fallerade.`);
        if (attempts >= 3) {
          console.error('❌ Maximalt antal självrättningsförsök uppnått i Fas 2.');
          const isOmvandelse = process.argv.includes('--omvandelse');
          
          if (!isOmvandelse && !isMaint) {
            console.log('\n🔄 [ADR-013 OMVÄNDELSESLINGA]: Sanerar källkod och startar om via ren underprocess...');
            try {
              execSync(`git checkout -- src/features/${targetDomain} 2>/dev/null || true`, { cwd: ROOT_DIR });
            } catch (err: any) {
              console.warn(`⚠️ [OMVÄNDELSE]: Kunde inte köra git checkout: ${err?.message || err}`);
            }
            
            const dumpData = { ticket: ticketId, domain: targetDomain, error: vitestErr?.message, log: testLog, time: new Date().toISOString() };
            fs.writeFileSync(CRASH_DUMP_PATH, JSON.stringify(dumpData, null, 2), 'utf-8');
            
            console.log('🚀 Startar isolerad underprocess för Fas 1 omplanering...\n');
            try {
              execSync(`npx tsx scripts/run-planera-live.ts ${ticketId} --omvandelse`, { stdio: 'inherit', cwd: ROOT_DIR });
              process.exit(0);
            } catch (subErr: any) {
              console.error('❌ Omvändelseslingan underkändes i andra försöket.');
              process.exit(subErr.status || 1);
            }
          } else {
            if (!isMaint) {
              try {
                execSync(`git checkout -- src/features/${targetDomain} 2>/dev/null || true`, { cwd: ROOT_DIR });
              } catch (err: any) {
                console.warn('Checkout vid cykelspärr misslyckades:', err?.message);
              }
            }
            console.error('❌ Cykelspärr nådd: Max 1 omvändelse tillåten per körning.');
            process.exit(1);
          }
        }
        codeSaved = false;

        // Samla ihop test och källkod så modellen slipper vara blind under självrättningen
        const testContent = fs.existsSync(transientTestFullPath) ? fs.readFileSync(transientTestFullPath, 'utf-8') : '';

        let currentSourceSummary = '';
        const filesToInclude = Array.from(new Set([...modifiedFiles, ...getRequiredFiles()]));
        for (const relPath of filesToInclude) {
          const fullPath = path.resolve(ROOT_DIR, relPath);
          if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
            currentSourceSummary += `\n--- ${relPath} ---\n` + fs.readFileSync(fullPath, 'utf-8');
          }
        }

        const retryPrompt = `FAS 2 SJÄLVRÄTTNING (Försök ${attempts}/3):
Vitest underkände transient-testet eller Gate 2c rapporterade brott!
FELLOGG:
${testLog}

VIKTIGA REGLER FÖR SJÄLVRÄTTNING:
1. TESTFILEN ÄR STRIKT SKRIVSKYDDAD OCH FÅR INTE ÄNDRAS. Att försöka spara till '${transientTestFile}' avvisas mekaniskt!
2. Använd UTESLUTANDE 'apply_patch' eller 'save_code' för att åtgärda källkoden under 'src/features/${targetDomain}/'!
3. Om du ser 'GATE 2c BROTT', åtgärda det tomma 'catch {}'-blocket på den angivna raden.
4. Analysera felet mot testet och din befintliga källkod nedan, korrigera källkoden och anropa save_code/apply_patch omedelbart.`;

        const retryAnchor = buildRetryAnchor(testContent, currentSourceSummary, testLog);

        await runMicroChannel('Att vända om', retryPrompt, retryAnchor, systemInstruction, codegenTools, executeFas2Tools, {
          requireMutation: true,
          maxTurns: 5,
          onMutationCheck: isFas2Complete,
          getFollowupPrompt: getFas2FollowupPrompt
        });
      }
    }
  }

  // ==========================================
  // FAS 3: SLUTKONSOLIDERING, SYNC & GIT-PUSH
  // ==========================================
  if (!isMaint) {
    console.log('🔒 Verifierar Gate 3a mot slutgiltig testfil inför konsolidering...');
    execSync(`node scripts/drivers/ts.js --check-alibi --file ${transientTestFile}`, { stdio: 'inherit', cwd: ROOT_DIR });
    console.log('\n📦 Fas 3: Konsoliderar godkänt test till domänens permanenta testsvit...');
    const permanentTestDir = path.join(ROOT_DIR, 'src', 'features', targetDomain, '__tests__');
    fs.mkdirSync(permanentTestDir, { recursive: true });

    const primaryModule = createdModules[0] || ticketId.toLowerCase();
    const permanentTestPath = path.join(permanentTestDir, `${path.basename(primaryModule)}.test.${testExt}`);
    fs.mkdirSync(path.dirname(permanentTestPath), { recursive: true });

    let transientTestContent = fs.existsSync(transientTestFullPath) ? fs.readFileSync(transientTestFullPath, 'utf-8') : '';
    transientTestContent = transientTestContent
      .replace(new RegExp(`'\\.\\./features/${targetDomain}'`, 'g'), "'..'")
      .replace(new RegExp(`"\\.\\./features/${targetDomain}"`, 'g'), '".."')
      .replace(new RegExp(`'\\.\\./features/${targetDomain}/`, 'g'), "'../")
      .replace(new RegExp(`"\\.\\./features/${targetDomain}/`, 'g'), '"../')
      .replace(/'\.\.\/features\//g, "'../../")
      .replace(/"\.\.\/features\//g, '"../../')
      .replace(/'\.\.\/shared\//g, "'../../../shared/")
      .replace(/"\.\.\/shared\//g, '"../../../shared/');

    fs.writeFileSync(permanentTestPath, transientTestContent, 'utf-8');
    fs.unlinkSync(transientTestFullPath);
    
    console.log('🗺️  Fas 3: Synkroniserar doc/FEATURE_INDEX.json...');
    try {
      let indexData: any = { features: {} };
      if (fs.existsSync(FEATURE_INDEX_PATH)) indexData = JSON.parse(fs.readFileSync(FEATURE_INDEX_PATH, 'utf-8'));
      if (!indexData.features[targetDomain]) indexData.features[targetDomain] = { files: [], exports: [] };
      for (const mod of createdModules) {
        if (!indexData.features[targetDomain].files.includes(`${mod}.ts`)) {
          indexData.features[targetDomain].files.push(`${mod}.ts`);
        }
      }
      fs.writeFileSync(FEATURE_INDEX_PATH, JSON.stringify(indexData, null, 2), 'utf-8');
    } catch (err: any) {
      console.warn(`⚠️ [FAS 3]: Kunde inte uppdatera FEATURE_INDEX.json: ${err?.message || err}`);
    }
  }

  console.log('📋 Fas 3: Uppdaterar biljettstatus i doc/TICKETS.md...');
  try {
    if (fs.existsSync(TICKETS_PATH)) {
      let ticketsContent = fs.readFileSync(TICKETS_PATH, 'utf-8');
      const ticketPattern = new RegExp(`\\[ \\] \\*\\*${ticketId}\\*\\*`, 'g');
      if (ticketPattern.test(ticketsContent)) {
        ticketsContent = ticketsContent.replace(ticketPattern, `[x] **${ticketId}** (VERIFIED)`);
        fs.writeFileSync(TICKETS_PATH, ticketsContent, 'utf-8');
      }
    }
  } catch (err: any) {
    console.warn(`⚠️ [FAS 3]: Kunde inte uppdatera TICKETS.md: ${err?.message || err}`);
  }

  execSync('pnpm verify', { stdio: 'inherit', cwd: ROOT_DIR });
  if (!isMaint) saneraSkordadLegacy(ticketPath);


  // --- DEN MÄNSKLIGA BESLUTSGRINDEN FÖR SYSTEMÄNDRINGAR ---
  if (isMaint) {
    console.log('\n🛡️ [SANDBOX]: Systemförändring (MAINT) detekterad. Genererar besiktningsrapport...');
    
    // Fråga modellen om en riskanalys över vad som nyss ändrades
    const diff = execSync('git diff --stat', { encoding: 'utf-8', cwd: ROOT_DIR });
    const diffContent = execSync('git diff', { encoding: 'utf-8', cwd: ROOT_DIR });
    
    // Starta en dedikerad interaktiv dialog med modellen för besiktningsrapporten
    const inspectionRunner = new BidiLiveSession({
      ai, model: MODEL_NAME, systemInstruction,
    });
    
    const inspectionPrompt = `Du har just utfört ett underhållsarbete (TCK-MAINT).\nHär är git diffen över vad du ändrat:\n\n${diffContent}\n\nGe mig en Trepunktsbesiktning enligt följande format (KORT och på svenska):\n\n**Möjlighet (Avsikt):** [Vad gör ändringen för nytta?]\n**Grindanalys (Faronivå):** [Markera 'FÖRHÖJD RISK: Grindändring' om du ändrat i verify-architecture.js eller ts.js. Annars 'LÅG RISK: Rutinunderhåll']\n**Ångerrätt:** [Ett n (nej) kasserar omedelbart denna ändring.]`;
    
    const inspectionReport = await inspectionRunner.send(inspectionPrompt);
    console.log('\n' + inspectionReport + '\n');
    console.log('--- GIT DIFF STAT ---');
    console.log(diff);
    
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    
    let decisionMade = false;
    while (!decisionMade) {
      const answer = await new Promise<string>(resolve => {
        rl.question('\n❓ [j = Godkänn kod] [s = Spara spec, återställ kod] [n = Kassera allt] [Valfri text = Fråga AI]: ', resolve);
      });
      
      const input = answer.trim().toLowerCase();
      if (input === 'j') {
        decisionMade = true;
      } else if (input === 's') {
        console.log('📝 Sparar specifikationen i doc/.TICKETS/ och återställer källkoden...');
        const specPath = path.join(ROOT_DIR, "doc", ".TICKETS", `${ticketId}.md`);
        const specContent = `# ${ticketId}: Planerad Systemförbättring\n\n## BESIKTNINGSRAPPORT\n${inspectionReport}\n\n## FÖRESLAGEN KOD-DIFF\n\`\`\`diff\n${diffContent}\`\`\`\n`;
        fs.writeFileSync(specPath, specContent, "utf-8");
        
        // Återställ källkoden men behåll biljettfilen
        execSync("git checkout -- src/ scripts/ package.json vite.config.ts 2>/dev/null || true", { cwd: ROOT_DIR });
        console.log(`✅ Källkoden återställd. Specifikationen är sparad i doc/.TICKETS/${ticketId}.md`);
        rl.close();
        inspectionRunner.close();
        process.exit(0);
      } else if (input === 'n') {
        console.log('🔄 Avbryter och rullar tillbaka alla ändringar...');
        execSync('git reset --hard && git clean -fd', { stdio: 'inherit', cwd: ROOT_DIR });
        console.log('✅ Systemet är intakt (allt kasserat).');
        rl.close();
        inspectionRunner.close();
        process.exit(0);
      } else if (input !== '') {
        // Skicka användarens följdfråga till modellen i samma tråd
        console.log('\n   🤔 Frågar modellen...');
        const reply = await inspectionRunner.send(`Människan ställer en fråga inför godkännandet: "${answer}". Svara kort och ärligt utifrån diffen.`);
        console.log('\n' + reply + '\n');
      }
    }
    rl.close();
    inspectionRunner.close();
  }

  try {
    console.log('\n📦 Genomför automatisk Git Commit & Push till GitHub...');
    execSync('git add doc/ src/ scripts/ package.json vite.config.ts', { cwd: ROOT_DIR });
    const commitMsg = isMaint 
      ? `chore(infra): ${ticketId} systemunderhåll autonomt applicerat och mänskligt verifierat` 
      : `feat(${targetDomain}): ${ticketId} autonomt byggd, konsoliderad och verifierad`;
    execSync(`git commit -m "${commitMsg}"`, { cwd: ROOT_DIR });
    
    const ghToken = process.env.GITHUB_TOKEN;
    if (ghToken) {
      const ghUser = process.env.GITHUB_USER || 'bjud-in-oss';
      const remoteUrl = `https://${ghUser}:${ghToken}@github.com/${ghUser}/Outreach.git`;
      execSync(`git push ${remoteUrl} main`, { stdio: 'inherit', cwd: ROOT_DIR });
      console.log('🚀 Kodbasen är synkad till GitHub via .env token!');
    } else {
      execSync('git push origin main', { stdio: 'inherit', cwd: ROOT_DIR });
    }
  } catch (gitErr: any) {
    console.warn('⚠️ Git push krävde manuell intervention:', gitErr.message);
  }
}

main().catch(err => {
  try {
    execSync("git add -N src/", { cwd: ROOT_DIR });
    const diff = execSync("git diff src/", { encoding: "utf-8", cwd: ROOT_DIR });
    fs.mkdirSync(path.join(ROOT_DIR, "doc", "LAST_CYCLE"), { recursive: true });
    fs.writeFileSync(path.join(ROOT_DIR, "doc", "LAST_CYCLE", "CRASH_DIFF.patch"), diff, "utf-8");
    console.log("\n📄 [KRASCH-DIFF SPARAD]: doc/LAST_CYCLE/CRASH_DIFF.patch");
  } catch (diffErr: any) {
    console.warn("⚠️ Kunde inte spara kraschdiff:", diffErr?.message || diffErr);
  }
  console.error("\n💥 Byggfel:", err);
  process.exit(1);
});
