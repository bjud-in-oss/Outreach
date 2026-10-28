/**
 * scripts/run-planera-live.ts
 * 
 * OUTREACH COORDINATION ENGINE (v10.4)
 * Helautonom, agnostisk orkestreringsmotor med Action Loop,
 * automatisk testkonsolidering och mekanisk dokumentationssynkronisering.
 */

import * as fs from 'fs';
import * as path from 'path';
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
    return `TILLGÄNGLIGA PAKET I PROJEKTET (Importera ALDRIG paket utanför denna lista! För övrigt, använd Node.js inbyggda API:er som crypto):\n${[...deps, ...devDeps].join(', ')}`;
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

  console.log(`\n🚀 OUTREACH COORDINATION ENGINE v10.4 – STARTAR BYGG: ${ticketId}`);
  console.log(`📌 Aktiv Live-modell: ${MODEL_NAME}`);

  let ticketPath = path.join(ROOT_DIR, 'PROMPT.md');
  if (ticketId !== 'PROMPT') ticketPath = path.join(ROOT_DIR, 'doc', '.TICKETS', `${ticketId}.md`);

  if (!fs.existsSync(ticketPath)) {
    console.error(`❌ Biljettfil saknas: ${ticketPath}`);
    process.exit(1);
  }

  const ticketPrompt = fs.readFileSync(ticketPath, 'utf-8');

  let targetDomain = 'telemetry';
  const domainMatch = ticketPrompt.match(/src\/features\/([a-zA-Z0-9_-]+)/);
  if (domainMatch) targetDomain = domainMatch[1];
  console.log(`🎯 Måldomän: src/features/${targetDomain}/\n`);

  // ==========================================
  // GENERISK GIT-BASERAD STARTSANERING
  // ==========================================
  const transientTestFile = `src/__tests__/transient_${ticketId}.test.ts`;
  const transientTestFullPath = path.join(ROOT_DIR, transientTestFile);
  if (fs.existsSync(transientTestFullPath)) {
    console.log(`🧹 [STARTSANERING]: Tar bort transient testfil från tidigare cykel: ${transientTestFile}`);
    fs.unlinkSync(transientTestFullPath);
  }

  try {
    const gitStatus = execSync(`git status --porcelain src/features/${targetDomain}`, { encoding: 'utf-8', cwd: ROOT_DIR });
    const untracked = gitStatus.split('\n')
      .filter(l => l.startsWith('?? '))
      .map(l => l.substring(3).trim());
    for (const f of untracked) {
      const full = path.resolve(ROOT_DIR, f);
      if (fs.existsSync(full)) {
        console.log(`🧹 [STARTSANERING]: Tar bort okommittat utkast: ${f}`);
        fs.unlinkSync(full);
      }
    }
  } catch {}

  fs.writeFileSync(CYCLE_LOG_PATH, `# BYGGCYKEL LOGG: ${ticketId}\n**Starttid:** ${new Date().toISOString()}\n**Modell:** ${MODEL_NAME}\n\n---\n### INITIAL PROMPT\n\`\`\`\n${ticketPrompt}\n\`\`\`\n`, 'utf-8');

  // ==========================================
  // FAS 0: PREMISSVALIDERING & DÖRRVAKT
  // ==========================================
  console.log('### FAS 0: PREMISSVALIDERING & DÖRRVAKT');
  const hasCodeBlock = ticketPrompt.includes('```typescript') || ticketPrompt.includes('```ts');
  const hasExportFunction = ticketPrompt.includes('export function');
  if (!hasCodeBlock || !hasExportFunction) {
    console.error(`❌ [DÖRRVAKTS-SPÄRR]: Biljetten ${ticketId} saknar 'export function' i ett typat kodblock.`);
    process.exit(1);
  }

  const steg1a = await runMicroChannel('Att följa', 'Steg 1a: Förstå Intention & Mänsklig Nytta.', ticketPrompt, systemInstruction);
  appendCycleLog('1a Att följa: Intention & Nytta', steg1a);

  const steg0a = await runMicroChannel('Att vända om', 'Steg 0a: Kontraktsaudit mot FSD och API-skills.', `${ticketPrompt}\n\nINTENTION:\n${steg1a}`, systemInstruction);
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
  const startAnchor = `BILJETT: ${ticketId}\nDOMÄN: src/features/${targetDomain}/\nREPOTOPOGRAFI:\n${getFeatureIndexText()}\nKONTRAKT:\n${ticketPrompt}`;

  const inspectionTools = [
    {
      name: 'read_file',
      behavior: 'NON_BLOCKING',
      description: 'Läser fil i repot (stora filer trunkeras säkert).',
      parameters: { type: 'OBJECT', properties: { file_path: { type: 'STRING' } }, required: ['file_path'] },
    },
    {
      name: 'list_files',
      behavior: 'NON_BLOCKING',
      description: 'Listar innehållet i en katalog i repot.',
      parameters: { type: 'OBJECT', properties: { directory_path: { type: 'STRING' } }, required: ['directory_path'] },
    }
  ];

  const executeInspection = (name: string, args: any) => {
    if (name === 'read_file') {
      const full = path.resolve(ROOT_DIR, args.file_path);
      if (!fs.existsSync(full)) return `Filen ${args.file_path} finns inte.`;
      const content = fs.readFileSync(full, 'utf-8');
      const lines = content.split('\n');
      if (lines.length > 100) {
        return lines.slice(0, 100).join('\n') + `\n\n... [TRUNKERAD: Visar rad 1-100 av ${lines.length}]`;
      }
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

  const steg2a = await runMicroChannel('Att följa', 'Steg 2a: Avgränsa tillstånd och biverkningar.', `${startAnchor}\n${steg1b}`, systemInstruction);
  appendCycleLog('2a Att följa: Tillstånd & Biverkningar', steg2a);

  const steg2b = await runMicroChannel('Att följa', 'Steg 2b: Formulera 3 ortogonala alternativ för inre felresiliens.', `${startAnchor}\n${steg2a}`, systemInstruction);
  appendCycleLog('2b Att följa: 3 Ortogonala Alternativ', steg2b);

  const steg2c = await runMicroChannel('Att vända om', 'Steg 2c: Resiliensgranskning av alternativen.', `${startAnchor}\n${steg2b}`, systemInstruction);
  appendCycleLog('2c Att vända om: Resiliensgranskning', steg2c);

  const steg2d = await runMicroChannel('Att förlikas', 'Steg 2d: Syntetisk vägvägning. Slå fast vinnande alternativ och deklarera MÄTTNAD: JA.', steg2c, systemInstruction);
  appendCycleLog('2d Att förlikas: Vägvägning & Mättnad', steg2d);

  // Steg 3a: Autonom testgenerering
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

  const steg3a = await runMicroChannel(
    'Att följa',
    `Steg 3a: Generera transient testspecifikation och spara den till '${transientTestFile}' med save_code.\nKRAV:\n1. Undersök måldomänen och shared med read_file för att verifiera anropsmönster och körtidsankare.\n2. Använd ALDRIG syntetiska alibi-spioner (vi.spyOn/vi.fn).\n3. Testet MÅSTE fallera rött (Fail-First) mot befintlig kod!\n4. Du MÅSTE anropa save_code innan du är klar.`,
    `${startAnchor}\nKONTRAKT:\n${steg2d}`,
    systemInstruction,
    testGenTools,
    executeTestGen,
    { requireMutation: true, maxTurns: 3, onMutationCheck: () => testSaved }
  );
  appendCycleLog('3a Att följa: Transient Testspecifikation', steg3a);

  const steg3b = await runMicroChannel('Att följa', 'Steg 3b: Källkodsspecifikation.', `${startAnchor}\nTEST:\n${steg3a}`, systemInstruction, inspectionTools, executeInspection);
  appendCycleLog('3b Att följa: Källkodsspecifikation', steg3b);

  const steg2e = await runMicroChannel('Att vända om', 'Steg 2e: Operativt delta och destruktiv sanering.', steg3b, systemInstruction);
  appendCycleLog('2e Att vända om: Operativt Delta & Sanering', steg2e);

  const steg3c = await runMicroChannel('Att förlikas', 'Steg 3c: Slutgiltigt byggkontrakt. human_decision_required: false.', steg2e, systemInstruction);
  appendCycleLog('3c Att förlikas: Slutgiltigt Byggkontrakt', steg3c);

  // ==========================================
  // FAS 2: KÄLLKODSEXEKVERING & TDD
  // ==========================================
  console.log('\n### FAS 2: KÄLLKODSEXEKVERING & TDD\n');

  // Gate 3a AST-validering
  let gate3aPassed = false;
  let gate3aAttempts = 0;
  while (!gate3aPassed && gate3aAttempts < 3) {
    gate3aAttempts++;
    try {
      console.log(`🔒 Verifierar Gate 3a (Försök ${gate3aAttempts}/3): AST-kontroll mot alibi-tester...`);
      execSync(`node scripts/drivers/ts.js --check-alibi --file ${transientTestFile}`, { stdio: 'inherit', cwd: ROOT_DIR });
      gate3aPassed = true;
    } catch (err: any) {
      if (gate3aAttempts >= 3) {
        console.error('❌ Gate 3a underkändes 3 gånger i rad.');
        process.exit(1);
      }
      console.log('🔄 Skickar Gate 3a-felet till modellen för autonom självrättning av testet...');
      testSaved = false;
      await runMicroChannel(
        'Att vända om',
        `Gate 3a underkände testet!\nFELLOGG:\n${err.message || String(err)}\nÅtgärda testet och spara till '${transientTestFile}' med save_code.`,
        `BEFINTLIGT TEST:\n${fs.readFileSync(transientTestFullPath, 'utf-8')}`,
        systemInstruction,
        testGenTools,
        executeTestGen,
        { requireMutation: true, maxTurns: 3, onMutationCheck: () => testSaved }
      );
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
  console.log('✅ Godkänt Fail-First: Testet fallerade rött på funktionell exekvering.');

  console.log('\n⚡ Exekverar källkodsgenerering via Bidi Live WebSocket...');
  let codeSaved = false;
  const createdModules: string[] = [];

  const codegenTools = [
    ...inspectionTools,
    {
      name: 'save_code',
      behavior: 'NON_BLOCKING',
      description: 'Sparar källkod under domänen eller den transienta testfilen.',
      parameters: { type: 'OBJECT', properties: { file_path: { type: 'STRING' }, code: { type: 'STRING' } }, required: ['file_path', 'code'] },
    }
  ];

  const executeFas2Tools = (name: string, args: any) => {
    if (name === 'read_file' || name === 'list_files') return executeInspection(name, args);
    if (name === 'save_code') {
      const rel = args.file_path;
      const isDomainCode = rel.startsWith(`src/features/${targetDomain}/`);
      const isTransientTest = rel === transientTestFile;
      if (!isDomainCode && !isTransientTest) {
        throw new Error(`Otillåten skrivning till ${rel}. Endast src/features/${targetDomain}/ och ${transientTestFile} är tillåtna.`);
      }
      const full = path.resolve(ROOT_DIR, rel);
      fs.mkdirSync(path.dirname(full), { recursive: true });
      fs.writeFileSync(full, args.code, 'utf-8');
      codeSaved = true;

      if (isDomainCode && !rel.endsWith('index.ts')) {
        const base = path.basename(rel, '.ts');
        if (!createdModules.includes(base)) createdModules.push(base);
      }

      console.log(`\n   💾 [SPARAD FIL]: ${rel} (${args.code.length} tecken)`);
      return `Fil sparad till ${rel}`;
    }
    return 'Okänt verktyg';
  };

  await runMicroChannel(
    'Att följa',
    `Fas 2: Skriv källkoden under 'src/features/${targetDomain}/' med save_code för att uppfylla byggkontraktet och transient-testet.\nLäs 'src/features/${targetDomain}/index.ts' först för att bevara tidigare exporter.\nDu MÅSTE spara källkoden med save_code innan du avslutar!`,
    `BYGGKONTRAKT:\n${steg3c}\nTESTFIL:\n${fs.readFileSync(transientTestFullPath, 'utf-8')}`,
    systemInstruction,
    codegenTools,
    executeFas2Tools,
    { requireMutation: true, maxTurns: 3, onMutationCheck: () => codeSaved }
  );

  // Dynamisk och generisk barrelexport
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

  console.log('\n🔒 Verifierar Gate 2c: AST-kontroll mot tysta catch-block...');
  execSync('node scripts/drivers/ts.js --check-catch-blocks', { stdio: 'inherit', cwd: ROOT_DIR });

  // Autonom och objektiv självläkningsloop
  console.log('\n🟢 Kör transient-testet mot den nyskapade källkoden...');
  let testPassed = false;
  let attempts = 0;
  const MAX_ATTEMPTS = 3;

  while (!testPassed && attempts < MAX_ATTEMPTS) {
    attempts++;
    try {
      execSync(`npx vitest run ${transientTestFile}`, { stdio: 'inherit', cwd: ROOT_DIR });
      testPassed = true;
    } catch (vitestErr: any) {
      console.warn(`\n⚠️ [FAS 2 SJÄLVRÄTTNING]: Försök ${attempts}/${MAX_ATTEMPTS} fallerade.`);
      if (attempts >= MAX_ATTEMPTS) {
        console.error('❌ Maximalt antal självrättningsförsök uppnått.');
        process.exit(1);
      }

      console.log('🔄 Skickar felloggen till modellen för autonom självrättning...');
      const testLog = vitestErr.stdout?.toString() || vitestErr.stderr?.toString() || vitestErr.message;
      let patchSaved = false;
      
      const executePatchTools = (name: string, args: any) => {
        const res = executeFas2Tools(name, args);
        if (name === 'save_code') patchSaved = true;
        return res;
      };

      await runMicroChannel(
        'Att vända om',
        `Vitest underkände transient-testet vid körtid!\nFELLOGG FRÅN TESTMOTORN:\n${testLog}\n\nUppdrag: Analysera felet objektivt utifrån felloggen. Använd read_file och save_code för att åtgärda felkällan under src/features/${targetDomain}/ eller i testfilen.\nDu MÅSTE spara en rättad fil med save_code innan du är klar!`,
        `AKTUELLT TEST:\n${fs.readFileSync(transientTestFullPath, 'utf-8')}\n\nFELLOGG:\n${testLog}`,
        systemInstruction,
        codegenTools,
        executePatchTools,
        { requireMutation: true, maxTurns: 3, onMutationCheck: () => patchSaved }
      );
    }
  }

  // ==========================================
  // FAS 3: SLUTKONSOLIDERING, SYNC & GIT-PUSH
  // ==========================================
  console.log('\n📦 Fas 3: Konsoliderar godkänt test till domänens permanenta testsvit...');
  const permanentTestDir = path.join(ROOT_DIR, 'src', 'features', targetDomain, '__tests__');
  fs.mkdirSync(permanentTestDir, { recursive: true });

  const primaryModule = createdModules[0] || ticketId.toLowerCase();
  const permanentTestPath = path.join(permanentTestDir, `${primaryModule}.test.ts`);

  let transientTestContent = fs.readFileSync(transientTestFullPath, 'utf-8');
  // Justera relativa sökvägar från src/__tests__/ till src/features/[targetDomain]/__tests__/
  transientTestContent = transientTestContent
    .replace(new RegExp(`'\\.\\./features/${targetDomain}/`, 'g'), "'../")
    .replace(new RegExp(`"\\.\\./features/${targetDomain}/`, 'g'), '"../')
    .replace(/'\.\.\/shared\//g, "'../../../shared/")
    .replace(/"\.\.\/shared\//g, '"../../../shared/');

  fs.writeFileSync(permanentTestPath, transientTestContent, 'utf-8');
  fs.unlinkSync(transientTestFullPath);
  console.log(`✅ [KONSOLIDERING]: Testet flyttat till ${path.relative(ROOT_DIR, permanentTestPath)} och transient fil städad.`);

  // Mekanisk uppdatering av FEATURE_INDEX.json
  console.log('🗺️  Fas 3: Synkroniserar doc/FEATURE_INDEX.json...');
  try {
    let indexData: any = { features: {} };
    if (fs.existsSync(FEATURE_INDEX_PATH)) {
      indexData = JSON.parse(fs.readFileSync(FEATURE_INDEX_PATH, 'utf-8'));
    }
    if (!indexData.features[targetDomain]) {
      indexData.features[targetDomain] = { files: [], exports: [] };
    }
    for (const mod of createdModules) {
      const fileName = `${mod}.ts`;
      if (!indexData.features[targetDomain].files.includes(fileName)) {
        indexData.features[targetDomain].files.push(fileName);
      }
    }
    fs.writeFileSync(FEATURE_INDEX_PATH, JSON.stringify(indexData, null, 2), 'utf-8');
  } catch (err: any) {
    console.warn('⚠️ Kunde inte uppdatera FEATURE_INDEX.json:', err.message);
  }

  // Mekanisk uppdatering av doc/TICKETS.md
  console.log('📋 Fas 3: Uppdaterar biljettstatus i doc/TICKETS.md...');
  try {
    if (fs.existsSync(TICKETS_PATH)) {
      let ticketsContent = fs.readFileSync(TICKETS_PATH, 'utf-8');
      const ticketPattern = new RegExp(`\\[ \\] \\*\\*${ticketId}\\*\\*`, 'g');
      if (ticketPattern.test(ticketsContent)) {
        ticketsContent = ticketsContent.replace(ticketPattern, `[x] **${ticketId}** (VERIFIED)`);
        fs.writeFileSync(TICKETS_PATH, ticketsContent, 'utf-8');
        console.log(`✅ [BOKFÖRING]: ${ticketId} markerad som [x] VERIFIED i TICKETS.md`);
      }
    }
  } catch (err: any) {
    console.warn('⚠️ Kunde inte uppdatera TICKETS.md:', err.message);
  }

  console.log('\n🔍 Slutverifiering: Kör hela projektets arkitektur- och regressionskontroll...');
  execSync('pnpm verify', { stdio: 'inherit', cwd: ROOT_DIR });

  console.log('\n🎉 ALLA TESTER OCH ARKITEKTURKONTROLLER GRÖNA!');

  try {
    console.log('\n📦 Genomför automatisk Git Commit & Push till GitHub...');
    execSync('git add doc/ src/ scripts/ package.json', { cwd: ROOT_DIR });
    execSync(`git commit -m "feat(${targetDomain}): ${ticketId} autonomt byggd, konsoliderad och verifierad"`, { cwd: ROOT_DIR });
    execSync('git push origin main', { stdio: 'inherit', cwd: ROOT_DIR });
    console.log('🚀 Kodbasen är synkad till GitHub!');
  } catch (gitErr: any) {
    console.warn('⚠️ Git push hoppades över eller krävde autentisering:', gitErr.message);
  }
}

main().catch(err => {
  console.error('\n💥 Byggfel:', err);
  process.exit(1);
});
