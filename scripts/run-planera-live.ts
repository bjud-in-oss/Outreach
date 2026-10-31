import { mutateSourceCodeAST } from './drivers/astMutator.js';
/**
 * scripts/run-planera-live.ts
 * 
 * OUTREACH COORDINATION ENGINE (v10.4)
 * Helautonom orkestreringsmotor med Action Loop, testkonsolidering,
 * dokumentationssynk, och en interaktiv mänsklig beslutsgrind för systemunderhåll.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { execSync } from 'child_process';
import { GoogleGenAI } from '@google/genai';
import { BidiLiveSession } from './bidiLiveRunner.ts';

const ROOT_DIR = process.cwd();
const CYCLE_LOG_DIR = path.join(ROOT_DIR, 'doc', 'LAST_CYCLE');
const CYCLE_LOG_PATH = path.join(CYCLE_LOG_DIR, 'CYCLE_LOG.md');
const SI_PATH = path.join(ROOT_DIR, 'doc', 'SI_v10.4.md');
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

let systemInstruction = 'Du är motorn i Outreach Coordination Engine v10.4.';
if (fs.existsSync(SI_PATH)) systemInstruction = fs.readFileSync(SI_PATH, 'utf-8');

function getFeatureIndexText(): string {
  if (fs.existsSync(FEATURE_INDEX_PATH)) return fs.readFileSync(FEATURE_INDEX_PATH, 'utf-8');
  return '';
}

function getInstalledDependencies(): string {
  if (!fs.existsSync(PKG_PATH)) return '';
  try {
    const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf-8'));
    const deps = Object.keys(pkg.dependencies || {});
    const devDeps = Object.keys(pkg.devDependencies || {});
    return `TILLGÄNGLIGA PAKET I PROJEKTET (Importera ALDRIG externa paket utanför denna lista! För övrigt, använd Node.js inbyggda API:er):\n${[...deps, ...devDeps].join(', ')}`;
  } catch {
    return '';
  }
}

function appendCycleLog(header: string, content: string) {
  fs.appendFileSync(CYCLE_LOG_PATH, `\n\n#### ${header}\n${content.trim()}\n`, 'utf-8');
}

interface ChannelOptions {
  requireMutation?: boolean;
  maxTurns?: number;
  onMutationCheck?: () => boolean;
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
      console.log(`\n   🔁 [ACTION LOOP]: Ingen fil sparad ännu. Fortsätter mikrokanalen (vända ${turn}/${maxTurns})...`);
      response = await runner.send(
        `Du har genomfört inspektion. Slutför nu uppdraget omedelbart genom att spara den nödvändiga koden med verktyget save_code!`
      );
    }

    runner.close();
    return response;
  } catch (err: any) {
    runner.close();
    throw err;
  }
}

async function main() {
  const ticketArg = process.argv[2];
  let ticketId = ticketArg ? ticketArg.toUpperCase() : 'PROMPT';
  if (ticketId.endsWith('.MD')) ticketId = ticketId.replace('.MD', '');

  const isMaint = ticketId.startsWith('TCK-MAINT');

  console.log(`\n🚀 OUTREACH COORDINATION ENGINE v10.4 – STARTAR BYGG: ${ticketId}`);
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

  // ==========================================
  // GENERISK GIT-BASERAD STARTSANERING
  // ==========================================
  const transientTestFile = `src/__tests__/transient_${ticketId}.test.ts`;
  const transientTestFullPath = path.join(ROOT_DIR, transientTestFile);
  if (fs.existsSync(transientTestFullPath)) {
    console.log(`🧹 [STARTSANERING]: Tar bort transient testfil från tidigare cykel: ${transientTestFile}`);
    fs.unlinkSync(transientTestFullPath);
  }

  if (!isMaint) {
    try {
      const gitStatus = execSync(`git status --porcelain src/features/${targetDomain}`, { encoding: 'utf-8', cwd: ROOT_DIR });
      const untracked = gitStatus.split('\n').filter(l => l.startsWith('?? ')).map(l => l.substring(3).trim());
      for (const f of untracked) {
        const full = path.resolve(ROOT_DIR, f);
        if (fs.existsSync(full)) {
          console.log(`🧹 [STARTSANERING]: Tar bort okommittat utkast: ${f}`);
          fs.unlinkSync(full);
        }
      }
    } catch {}
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
  const startAnchor = `BILJETT: ${ticketId}\nDOMÄN: ${targetDomain}\nREPOTOPOGRAFI:\n${getFeatureIndexText()}\nKONTRAKT:\n${ticketPrompt}${busContract}`;

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
      const lines = content.split('\n');
      if (lines.length > 200) return lines.slice(0, 200).join('\n') + `\n\n... [TRUNKERAD: Visar rad 1-200 av ${lines.length}]`;
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

  const steg2b = await runMicroChannel('Att följa', 'Steg 2b: Formulera 3 ortogonala alternativ för lösning.', `${startAnchor}\n${steg1b}`, systemInstruction);
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
      `Steg 3a: Generera transient testspecifikation och spara den till '${transientTestFile}' med save_code.
KRAV:
1. Använd ALDRIG syntetiska alibi-spioner.
2. Testet MÅSTE fallera rött (Fail-First) mot befintlig kod!
3. Om testet använder delad infrastruktur (t.ex. SwarmEventBus), anropa FÖRST 'read_file' på 'src/shared/bus/swarmEventBus.ts' för att kontrollera exakta metodnamn. Gissa ALDRIG API-metoder!
4. Anropa save_code innan du är klar.`,
      `${startAnchor}\nKONTRAKT:\n${steg2d}`,
      systemInstruction,
      testGenTools,
      executeTestGen,
      { requireMutation: true, maxTurns: 3, onMutationCheck: () => testSaved }
    );
    appendCycleLog('3a Att följa: Testspecifikation', steg3a);

    const steg3b = await runMicroChannel('Att följa', 'Steg 3b: Källkodsspecifikation inklusive domänexport.', `${startAnchor}\nTEST:\n${steg3a}`, systemInstruction, inspectionTools, executeInspection);
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
        execSync(`node scripts/drivers/ts.js --check-alibi --file ${transientTestFile}`, { stdio: 'inherit', cwd: ROOT_DIR });
        gate3aPassed = true;
      } catch (err: any) {
        if (gate3aAttempts >= 3) {
          console.error('❌ Gate 3a underkändes 3 gånger i rad.');
          process.exit(1);
        }
        testSaved = false;
        await runMicroChannel('Att vända om', `Gate 3a underkände testet!\nFELLOGG:\n${err.message || String(err)}\nÅtgärda och spara till '${transientTestFile}'.`, `BEFINTLIGT TEST:\n${fs.readFileSync(transientTestFullPath, 'utf-8')}`, systemInstruction, testGenTools, executeTestGen, { requireMutation: true, maxTurns: 3, onMutationCheck: () => testSaved });
      }
    }

    console.log('\n🔴 Gate 3a Fail-First: Verifierar att testet fallerar rött (exit 1)...');
    let testFailedAsExpected = false;
    try {
      execSync(`npx vitest run ${transientTestFile}`, { stdio: 'pipe', cwd: ROOT_DIR });
    } catch (err: any) {
      testFailedAsExpected = true;
    }
    if (!testFailedAsExpected) {
      console.error('❌ GATE 3a UNDERKÄND: Transient-testet måste fallera med exit-kod 1 innan kod får skrivas.');
      process.exit(1);
    }
    console.log('✅ Godkänt Fail-First: Testet fallerade rött.');
  }

  console.log('\n⚡ Exekverar kodändringar via Bidi Live WebSocket...');
  let codeSaved = false;
  const createdModules: string[] = [];

  const codegenTools = [
    {
      name: 'save_code',
      behavior: 'NON_BLOCKING',
      description: 'Sparar kod till repot.',
      parameters: { type: 'OBJECT', properties: { file_path: { type: 'STRING' }, code: { type: 'STRING' } }, required: ['file_path', 'code'] },
    }
  ];

  const executeFas2Tools = (name: string, args: any) => {
    if (name === 'read_file' || name === 'list_files') return executeInspection(name, args);
    if (name === 'save_code') {
      const rel = args.file_path;
      if (!isMaint && !rel.startsWith(`src/features/${targetDomain}/`)) {
        throw new Error(`Otillåten skrivning till ${rel}. Endast src/features/${targetDomain}/ är tillåtet.`);
      }
      const full = path.resolve(ROOT_DIR, rel);
      fs.mkdirSync(path.dirname(full), { recursive: true });
      fs.writeFileSync(full, args.code, 'utf-8');
      codeSaved = true;

      if (!isMaint && rel.startsWith(`src/features/${targetDomain}/`) && !rel.endsWith('index.ts')) {
        const base = path.basename(rel, '.ts');
        if (!createdModules.includes(base)) createdModules.push(base);
      }
      console.log(`\n   💾 [SPARAD FIL]: ${rel} (${args.code.length} tecken)`);
      return `Fil sparad till ${rel}`;
    }
    return 'Okänt verktyg';
  };

  const fas2Prompt = isMaint 
    ? `Fas 2: Skriv och tillämpa underhållskoden för att lösa biljetten ${ticketId}. Spara filerna med save_code!`
    : `Fas 2: KÄLLKODSEXEKVERING FÖR ${targetDomain.toUpperCase()}
UPPDRAG: Implementera källkoden under 'src/features/${targetDomain}/' för att uppfylla byggkontraktet och få testet grönt.

REGLER OCH DINA 4 TILLÅTNA STRATEGIER:
1. TESTFILEN ÄR FÖRBJUDEN ATT RÖRA: Alla anrop mot 'src/__tests__/' avvisas mekaniskt!
2. MODULÄR DESIGN: Skapa specifika källkodsfiler (t.ex. ping.ts) och exportera dem via 'index.ts'. Du får ALDRIG radera befintliga re-exporter (t.ex. heartbeat) i index.ts!
3. FULL KONTRAKTSEFTERLEVNAD: Källkoden MÅSTE använda Zod-scheman och returnera de typer som kontraktet föreskriver.
4. BEVARA BEFINTLIG KOD: Om du uppdaterar en befintlig källkodsfil (som promptBarHelper.ts) via save_code får du ALDRIG radera befintliga funktioner. Läs filen eller inkludera all befintlig kod tillsammans med ditt nya tillägg!

TESTKOD SOM SKALL UPPFYLLAS:
\`\`\`typescript
${fs.existsSync(transientTestFullPath) ? fs.readFileSync(transientTestFullPath, 'utf-8') : ''}
\`\`\`
Anropa save_code för att spara dina källkodsfiler omedelbart!`;

  const fas2Anchor = `BILJETTKONTRAKT:\n${ticketPrompt}\n\nBYGGKONTRAKT (Fas 1):\n${steg3c}`;
  await runMicroChannel('Att följa', fas2Prompt, fas2Anchor, systemInstruction, codegenTools, executeFas2Tools, { requireMutation: true, maxTurns: 3, onMutationCheck: () => codeSaved });
    
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

  console.log('\n🔒 Verifierar Gate 2c: AST-kontroll mot tysta catch-block...');
  const filesToScan = createdModules.length > 0 
    ? createdModules.map(m => `src/features/${targetDomain}/${m}.ts`).filter(p => fs.existsSync(path.resolve(ROOT_DIR, p))).join(' ')
    : `src/features/${targetDomain}`;

  execSync(`node scripts/drivers/ts.js --check-catch-blocks ${filesToScan || `src/features/${targetDomain}`}`, { stdio: 'inherit', cwd: ROOT_DIR });

  if (!isMaint) {
    console.log('\n🟢 Kör transient-testet mot den nyskapade källkoden...');
    let testPassed = false;
    let attempts = 0;
    while (!testPassed && attempts < 3) {
      attempts++;
      try {
        execSync(`npx vitest run ${transientTestFile}`, { stdio: 'inherit', cwd: ROOT_DIR });
        testPassed = true;
      } catch (vitestErr: any) {
        console.warn(`\n⚠️ [FAS 2 SJÄLVRÄTTNING]: Försök ${attempts}/3 fallerade.`);
        if (attempts >= 3) {
          console.error('❌ Maximalt antal självrättningsförsök uppnått.');
          process.exit(1);
        }
        const testLog = vitestErr.stdout?.toString() || vitestErr.stderr?.toString() || vitestErr.message;
        let patchSaved = false;

        // Samla ihop test och källkod så modellen slipper vara blind under självrättningen
        const testContent = fs.existsSync(transientTestFullPath) ? fs.readFileSync(transientTestFullPath, 'utf-8') : '';
        const domainDir = path.join(ROOT_DIR, 'src', 'features', targetDomain);
        let currentSourceSummary = '';
        if (fs.existsSync(domainDir)) {
          const files = fs.readdirSync(domainDir).filter(f => f.endsWith('.ts'));
          for (const f of files) {
            currentSourceSummary += `\n--- src/features/${targetDomain}/${f} ---\n` + fs.readFileSync(path.join(domainDir, f), 'utf-8');
          }
        }

        const retryPrompt = `FAS 2 SJÄLVRÄTTNING (Försök ${attempts}/3):
Vitest underkände transient-testet!
FELLOGG:
${testLog}

VIKTIGA REGLER FÖR SJÄLVRÄTTNING:
1. TESTFILEN ÄR STRIKT SKRIVSKYDDAD OCH FÅR INTE ÄNDRAS. Att försöka spara till '${transientTestFile}' avvisas mekaniskt!
2. Du MÅSTE åtgärda felet genom att skriva och spara om källkoden under 'src/features/${targetDomain}/' via save_code!
3. Analysera felet mot testet och din befintliga källkod nedan, korrigera källkoden och anropa save_code omedelbart.`;

        const retryAnchor = `TESTKOD (OFÖRÄNDERLIG LAG):\n${testContent}\n\nBEFINTLIG KÄLLKOD:\n${currentSourceSummary}\n\nFELLOGG:\n${testLog}`;

        await runMicroChannel('Att vända om', retryPrompt, retryAnchor, systemInstruction, codegenTools, executeFas2Tools, { requireMutation: true, maxTurns: 3, onMutationCheck: () => patchSaved });
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
    const permanentTestPath = path.join(permanentTestDir, `${primaryModule}.test.ts`);

    let transientTestContent = fs.readFileSync(transientTestFullPath, 'utf-8');
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
    } catch {}
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
  } catch {}

  console.log('\n🔍 Slutverifiering: Kör hela projektets arkitektur- och regressionskontroll...');
  execSync('pnpm verify', { stdio: 'inherit', cwd: ROOT_DIR });
  console.log('\n🎉 ALLA TESTER OCH ARKITEKTURKONTROLLER GRÖNA!');

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
  console.error('\n💥 Byggfel:', err);
  process.exit(1);
});
