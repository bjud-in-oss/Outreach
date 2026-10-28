/**
 * scripts/run-planera-live.ts
 * 
 * OUTREACH COORDINATION ENGINE (v10.4)
 * Sammanhållet orkestreringsskript för `pnpm bygg [TCK-XXX]`
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import * as readline from 'readline';
import { GoogleGenAI } from '@google/genai';
import { BidiLiveSession } from './bidiLiveRunner.ts';

const ROOT_DIR = process.cwd();
const CYCLE_LOG_DIR = path.join(ROOT_DIR, 'doc', 'LAST_CYCLE');
const CYCLE_LOG_PATH = path.join(CYCLE_LOG_DIR, 'CYCLE_LOG.md');
const SI_PATH = path.join(ROOT_DIR, 'doc', 'SI_v10.4.md');

const MODEL_NAME = process.env.LIVE_MODEL || process.env.GEMINI_MODEL || 'gemini-3.8-live';
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error('❌ KRITISKT FEL: GEMINI_API_KEY saknas i miljövariablerna.');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY, apiVersion: 'v1alpha' });

if (!fs.existsSync(CYCLE_LOG_DIR)) {
  fs.mkdirSync(CYCLE_LOG_DIR, { recursive: true });
}

function executeReadTool(name: string, args: Record<string, any>): string {
  try {
    switch (name) {
      case 'read_file': {
        const targetPath = path.resolve(ROOT_DIR, args.file_path);
        if (!fs.existsSync(targetPath)) return `FEL: Filen ${args.file_path} finns inte.`;
        return fs.readFileSync(targetPath, 'utf-8');
      }
      case 'list_dir': {
        const targetPath = path.resolve(ROOT_DIR, args.dir_path || '.');
        if (!fs.existsSync(targetPath)) return `FEL: Katalogen ${args.dir_path} finns inte.`;
        return fs.readdirSync(targetPath).join('\n');
      }
      case 'search_code': {
        const query = args.query;
        try {
          return execSync(`git grep -n -I -e "${query}" -- src/ .agents/`, {
            cwd: ROOT_DIR,
            encoding: 'utf-8',
          });
        } catch {
          return `Inga träffar för sökningen: ${query}`;
        }
      }
      default:
        return `FEL: Okänt läsverktyg '${name}'.`;
    }
  } catch (error: any) {
    return `Verktygsfel (${name}): ${error.message}`;
  }
}

const READ_TOOL_DECLARATIONS = [
  {
    name: 'read_file',
    behavior: 'NON_BLOCKING',
    description: 'Läser innehållet i en specificerad fil ur repot.',
    parameters: {
      type: 'OBJECT',
      properties: {
        file_path: { type: 'STRING', description: 'Relativ sökväg till filen i repot.' },
      },
      required: ['file_path'],
    },
  },
  {
    name: 'list_dir',
    behavior: 'NON_BLOCKING',
    description: 'Listar filer i en specificerad katalog.',
    parameters: {
      type: 'OBJECT',
      properties: {
        dir_path: { type: 'STRING', description: 'Relativ sökväg till katalogen (t.ex. src/features).' },
      },
    },
  },
  {
    name: 'search_code',
    behavior: 'NON_BLOCKING',
    description: 'Söker efter en sträng i repots källkod.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: { type: 'STRING', description: 'Söksträng eller regex.' },
      },
      required: ['query'],
    },
  },
];

const SAVE_CODE_TOOL = {
  name: 'save_code',
  behavior: 'NON_BLOCKING',
  description: 'Anropas för att spara en källkodsfil eller testfil till repot.',
  parameters: {
    type: 'OBJECT',
    properties: {
      file_path: { type: 'STRING', description: 'Relativ sökväg (t.ex. src/features/telemetry/ping.ts eller src/features/telemetry/index.ts).' },
      code: { type: 'STRING', description: 'Den fullständiga källkoden som ska skrivas till filen.' },
    },
    required: ['file_path', 'code'],
  },
};

function appendToCycleLog(content: string) {
  fs.appendFileSync(CYCLE_LOG_PATH, content + '\n', 'utf-8');
  console.log(content);
}

function initCycleLog(ticketId: string, promptText: string) {
  if (fs.existsSync(CYCLE_LOG_PATH)) {
    fs.rmSync(CYCLE_LOG_PATH);
  }
  const header = [
    `# BYGGCYKEL LOGG: ${ticketId}`,
    `**Starttid:** ${new Date().toISOString()}`,
    `**Modell:** ${MODEL_NAME}`,
    `**Syfte:** Verifiera och genomföra bygguppdrag i Outreach Coordination Engine v10.4`,
    `\n---\n### INITIAL PROMPT\n\`\`\`\n${promptText.trim()}\n\`\`\`\n`,
  ].join('\n');
  fs.writeFileSync(CYCLE_LOG_PATH, header, 'utf-8');
}

function resolveTargetTicket(): { ticketId: string; content: string } {
  const argTicket = process.argv.slice(2).find((arg) => arg.startsWith('TCK-'));
  if (argTicket) {
    const ticketFile = path.join(ROOT_DIR, 'doc', '.TICKETS', `${argTicket}.md`);
    if (fs.existsSync(ticketFile)) {
      return { ticketId: argTicket, content: fs.readFileSync(ticketFile, 'utf-8') };
    }
  }

  const promptFile = path.join(ROOT_DIR, 'PROMPT.md');
  if (fs.existsSync(promptFile)) {
    const raw = fs.readFileSync(promptFile, 'utf-8');
    const match = raw.match(/TCK-[A-Z0-9_-]+/);
    const ticketId = match ? match[0] : 'TCK-CUSTOM';
    return { ticketId, content: raw };
  }

  throw new Error('Hittade varken explicit TCK-argument eller PROMPT.md.');
}

let activeMacroSession: BidiLiveSession | null = null;

async function runMacroTurn(
  instruction: string,
  systemInstruction: string,
  withTools = false
): Promise<string> {
  if (!activeMacroSession) {
    activeMacroSession = new BidiLiveSession({
      ai,
      model: MODEL_NAME,
      systemInstruction: `${systemInstruction}\n\nDu agerar som kraften: Att förlikas. Du är Makro-värd och leder sammanvägningen.`,
      tools: withTools ? READ_TOOL_DECLARATIONS : undefined,
      executeTool: withTools ? executeReadTool : undefined,
    });
    await activeMacroSession.connect();
  }
  return await activeMacroSession.send(instruction);
}

function closeMacroSession(): void {
  if (activeMacroSession) {
    activeMacroSession.close();
    activeMacroSession = null;
  }
}

async function runMicroChannel(
  kraft: 'Att följa' | 'Att vända om',
  instruction: string,
  contextAnchor: string,
  systemInstruction: string,
  withTools = false
): Promise<string> {
  const session = new BidiLiveSession({
    ai,
    model: MODEL_NAME,
    systemInstruction: `${systemInstruction}\n\nDu agerar som kraften: ${kraft}. Håll dig strikt till din roll och dina uppgifter.`,
    tools: withTools ? READ_TOOL_DECLARATIONS : undefined,
    executeTool: withTools ? executeReadTool : undefined,
  });
  try {
    await session.connect();
    const prompt = `[MIKROKANAL: ${kraft.toUpperCase()}]\n\nANKARE & KONTEXT:\n${contextAnchor}\n\nUPPDRAG:\n${instruction}`;
    return await session.send(prompt);
  } finally {
    session.close();
  }
}

async function main() {
  const { ticketId, content: ticketPrompt } = resolveTargetTicket();
  const systemInstruction = fs.readFileSync(SI_PATH, 'utf-8');

  const domainMatch = ticketPrompt.match(/src\/features\/([a-zA-Z0-9_-]+)/);
  const targetDomain = domainMatch ? domainMatch[1] : 'telemetry';

  console.log(`\n🚀 OUTREACH COORDINATION ENGINE v10.4 – STARTAR BYGG: ${ticketId}`);
  console.log(`📌 Aktiv Live-modell: ${MODEL_NAME}`);
  console.log(`🎯 Måldomän: src/features/${targetDomain}/`);
  initCycleLog(ticketId, ticketPrompt);

  const startAnchor = `BILJETT: ${ticketId}\nMÅLDOMÄN: src/features/${targetDomain}/\nPROMPT:\n${ticketPrompt}`;

  // --------------------------------------------------------------------------
  // FAS 0: PREMISSVALIDERING & DÖRRVAKT
  // --------------------------------------------------------------------------
  appendToCycleLog(`\n### FAS 0: PREMISSVALIDERING & DÖRRVAKT`);

  const fas0_1a = await runMicroChannel(
    'Att följa',
    'Steg 1a: Förstå Intention & Mänsklig Nytta. Identifiera det invarianta ytterkontraktet (funktioner och typer) och förankra mänskligt värde.',
    startAnchor,
    systemInstruction
  );
  appendToCycleLog(`\n#### 1a Att följa: Intention & Nytta\n${fas0_1a}`);

  const fas0_0a = await runMicroChannel(
    'Att vända om',
    'Steg 0a: Kontraktsaudit. Granska strikt mot: 1. Max 1 FSD under src/features/, 2. API-skills i .agents/skills/, 3. Krav på destruktiv sanering.',
    `${startAnchor}\n1a-ANALYS:\n${fas0_1a}`,
    systemInstruction
  );
  appendToCycleLog(`\n#### 0a Att vända om: Kontraktsaudit\n${fas0_0a}`);

  const fas0_0b = await runMacroTurn(
    `Steg 0b: Vägval & Förlikningsport.\nBedöm kontraktsgranskningen:\n${fas0_0a}\n` +
      `Om fler än 1 FSD berörs eller API-kontrakt bryts: deklarera AVBROTT.\n` +
      `Annars deklarera: VÄG 2 GODKÄND och förbered Fas 1. Svara med formatet: STATUS: [GODKÄND|AVBRUTEN].`,
    systemInstruction
  );
  appendToCycleLog(`\n#### 0b Att förlikas: Vägval\n${fas0_0b}`);

  if (fas0_0b.includes('STATUS: AVBRUTEN')) {
    console.error(`\n⛔ FAS 0 AVBRÖT BYGGET: Kontraktsbrott upptäckt.`);
    process.exit(1);
  }

  if (process.argv.includes('--fas0-only')) {
    console.log('\n🏁 [FAS 0-ONLY LÄGE]: Dörrvakt godkänd. Avslutar körningen.');
    process.exit(0);
  }

  // --------------------------------------------------------------------------
  // FAS 1: LINJÄRT PLANERINGSSVEP
  // --------------------------------------------------------------------------
  appendToCycleLog(`\n### FAS 1: LINJÄRT PLANERINGSSVEP (MIKRO-OSCILLATION)`);

  const steg1b = await runMicroChannel(
    'Att följa',
    'Steg 1b: Kartlägg berörd FSD-domän och systemgränser via Feature-Index.',
    startAnchor,
    systemInstruction,
    true
  );
  appendToCycleLog(`\n#### 1b Att följa: Domängränser\n${steg1b}`);

  const steg2a = await runMicroChannel(
    'Att följa',
    'Steg 2a: Avgränsa Tillstånd & Biverkningar (State i GROW-riskanalys).',
    `${startAnchor}\nDOMÄN:\n${steg1b}`,
    systemInstruction
  );
  appendToCycleLog(`\n#### 2a Att följa: Tillstånd & Biverkningar\n${steg2a}`);

  const steg2b = await runMicroChannel(
    'Att följa',
    `Steg 2b: Formulera 3 ortogonala alternativ med skilda arkitektoniska avvägningar enligt reverse-direction.\n` +
      `OBS: Biljettens funktionella ytterkontrakt (t.ex. export function emitPing i src/features/${targetDomain}/index.ts) är en låst invariant. Alternativen får ENDAST utforska inre modulstruktur och felhantering, aldrig ändra funktionens signatur.`,
    `${startAnchor}\nTILLSTÅND:\n${steg2a}`,
    systemInstruction
  );
  appendToCycleLog(`\n#### 2b Att följa: 3 Ortogonala Alternativ\n${steg2b}`);

  const steg2c = await runMicroChannel(
    'Att vända om',
    'Steg 2c: Utvärdera Resiliens & Felhantering enligt check-alignment. Förkasta tysta catch-block.',
    `${startAnchor}\nALTERNATIV:\n${steg2b}`,
    systemInstruction
  );
  appendToCycleLog(`\n#### 2c Att vända om: Resiliensgranskning\n${steg2c}`);

  const steg2d = await runMacroTurn(
    `Steg 2d: Syntetisk Vägvägning. Väg spänningsfältet mellan alternativen och granskningen.\nLås det vinnande kontraktet och slå fast MÄTTNAD: JA.\n\nAlternativ:\n${steg2b}\n\nGranskning:\n${steg2c}`,
    systemInstruction
  );
  appendToCycleLog(`\n#### 2d Att förlikas: Vägvägning & Mättnad\n${steg2d}`);

  const transientTestFile = `src/__tests__/transient_${ticketId}.test.ts`;
  const transientTestFullPath = path.join(ROOT_DIR, transientTestFile);

  const steg3a = await runMicroChannel(
    'Att följa',
    `Steg 3a: Skriv Transient Testspecifikation.\nInkludera obligatoriskt Körtidsankare (eventBus.emit / eventBus.subscribe) och Fail-First-deklaration.`,
    `${startAnchor}\nKONTRAKT:\n${steg2d}`,
    systemInstruction
  );
  appendToCycleLog(`\n#### 3a Att följa: Transient Testspecifikation\n${steg3a}`);

  // Etablera det fysiska testet på disken i Steg 3a om det inte redan existerar
  if (!fs.existsSync(transientTestFullPath)) {
    const testBoilerplate = [
      "import { describe, it, expect } from 'vitest';",
      `import { emitPing } from '../features/${targetDomain}';`,
      "import { getGlobalSwarmEventBus } from '../shared/bus/swarmEventBus';",
      "",
      `describe('${ticketId}: Telemetry Ping', () => {`,
      "  it('sänder en typad PingEvent via EventBus med emit som körtidsankare', () => {",
      "    const eventBus = getGlobalSwarmEventBus();",
      "    let receivedEnvelope: any = null;",
      "    const unsubscribe = eventBus.subscribe('telemetry:ping', (envelope) => {",
      "      receivedEnvelope = envelope;",
      "    });",
      "",
      "    // Körtidsankare: verifiera händelsebussen i körtid och utför emission",
      "    expect(typeof eventBus.emit).toBe('function');",
      "    const result = emitPing();",
      "",
      "    expect(result.success).toBe(true);",
      "    expect(receivedEnvelope).toBeDefined();",
      "    expect(receivedEnvelope.type).toBe('telemetry:ping');",
      "    unsubscribe();",
      "  });",
      "});",
      ""
    ].join('\n');
    fs.mkdirSync(path.dirname(transientTestFullPath), { recursive: true });
    fs.writeFileSync(transientTestFullPath, testBoilerplate, 'utf-8');
    console.log(`   📝 Fysiskt körtidstest etablerat på disken: ${transientTestFile}`);
  }

  const steg3b = await runMicroChannel(
    'Att följa',
    `Steg 3b: Skriv exakt Källkodsspecifikation, inklusive Barrel Audit av index.ts.\nLäs testfilen '${transientTestFile}' med read_file för att matcha dess faktiska typer och importer.`,
    `${startAnchor}\nKONTRAKT:\n${steg2d}\nTEST:\n${steg3a}`,
    systemInstruction,
    true
  );
  appendToCycleLog(`\n#### 3b Att följa: Källkodsspecifikation\n${steg3b}`);

  const steg2e = await runMicroChannel(
    'Att vända om',
    'Steg 2e: Operativt Delta. Deklarera destruktiv sanering och omankring av historiska tester.',
    `${startAnchor}\nKODSPEC:\n${steg3b}`,
    systemInstruction
  );
  appendToCycleLog(`\n#### 2e Att vända om: Operativt Delta & Sanering\n${steg2e}`);

  const steg3c = await runMacroTurn(
    `Steg 3c: Slutgiltigt Byggkontrakt & Portvärdering.\nSammanställ byggkontraktet utifrån 3a, 3b och 2e.\nDeklarera: human_decision_required: false.`,
    systemInstruction
  );
  appendToCycleLog(`\n#### 3c Att förlikas: Slutgiltigt Byggkontrakt\n${steg3c}`);

  // --------------------------------------------------------------------------
  // TOKEN GATE & KRISTALLISERINGSPUNKT
  // --------------------------------------------------------------------------
  if (steg3c.includes('human_decision_required: true')) {
    console.log('\n⏸️ TOKEN GATE: Manuellt beslut krävs av användaren.');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    await new Promise<void>((resolve) => {
      rl.question('Godkänner du byggkontraktet och vill fortsätta till Fas 2? (y/n): ', (ans) => {
        rl.close();
        if (ans.trim().toLowerCase() !== 'y') {
          console.log('🛑 Bygget avbröts vid Token Gate.');
          process.exit(0);
        }
        resolve();
      });
    });
  }

  closeMacroSession();
  console.log('\n🧹 Planeringskontext stängd och renad. Öppnar Fas 2...');

  // --------------------------------------------------------------------------
  // FAS 2: KÄLLKODSEXEKVERING & TDD (ISOLERAD SESSION MED VERKLIGT VERKTYG)
  // --------------------------------------------------------------------------
  appendToCycleLog(`\n### FAS 2: KÄLLKODSEXEKVERING & TDD`);

  console.log('\n🔒 Verifierar Gate 3a: AST-kontroll mot alibi-tester...');
  try {
    execSync(`node scripts/drivers/ts.js --check-alibi --file ${transientTestFile}`, { stdio: 'inherit', cwd: ROOT_DIR });
  } catch {
    console.error('❌ GATE 3a UNDERKÄND: Alibimönster upptäckta i testfilen.');
    process.exit(1);
  }

  console.log('🔴 Gate 3a Fail-First: Verifierar att testet fallerar rött (exit 1) mot befintlig kod...');
  let testFailedAsExpected = false;
  try {
    execSync('pnpm test:transient', { stdio: 'pipe', cwd: ROOT_DIR });
  } catch (err: any) {
    if (err.status === 1) {
      testFailedAsExpected = true;
      console.log('✅ Godkänt Fail-First: Testet fallerade rött (exit 1) på ett funktionellt anrop.');
    }
  }

  if (!testFailedAsExpected) {
    console.error('❌ GATE 3a UNDERKÄND: Transient-testet måste fallera med exit-kod 1 innan kod får skrivas.');
    process.exit(1);
  }

  const actualTestCode = fs.readFileSync(transientTestFullPath, 'utf-8');

  console.log('\n⚡ Exekverar källkodsgenerering via Bidi Live WebSocket...');
  const writtenFiles: string[] = [];

  function executeSaveCodeTool(name: string, args: Record<string, any>): string {
    if (name === 'save_code') {
      const relPath = args.file_path || args.filename;
      const code = args.code;
      if (!relPath || typeof code !== 'string') {
        return 'FEL: file_path och code är obligatoriska parametrar.';
      }

      const normalized = relPath.replace(/\\/g, '/');
      const allowedPrefix = `src/features/${targetDomain}/`;
      const isAllowed = normalized.startsWith(allowedPrefix) || normalized.startsWith('src/__tests__/transient_');

      if (!isAllowed) {
        console.warn(`\n   ⚠️ [SPÄRRAD FILSKRIVNING]: Otillåten sökväg: ${normalized}`);
        return `FEL: Strikt FSD-isolering! Du får endast spara filer under '${allowedPrefix}'. Du har INTE behörighet att skriva i src/shared/ eller andra mappar.`;
      }

      const fullPath = path.resolve(ROOT_DIR, normalized);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, code, 'utf-8');
      writtenFiles.push(normalized);
      console.log(`\n   💾 [SPARAD KOD]: ${normalized} (${code.length} tecken)`);
      return `Filen ${normalized} sparades framgångsrikt.`;
    }
    return `FEL: Okänt verktyg ${name}`;
  }

  const codeSession = new BidiLiveSession({
    ai,
    model: MODEL_NAME,
    systemInstruction: `${systemInstruction}\n\nDu är i Fas 2 (Källkodsexekvering). Ditt uppdrag är att: 1. Berätta kort i tal vad du gör. 2. Anropa verktyget save_code för varje fil (källkod och barrel index.ts under src/features/${targetDomain}/) så att det aktiva transienta testet passerar grönt. Skriv ren TypeScript utan tomma catch-block och utan alibin.`,
    tools: [SAVE_CODE_TOOL],
    executeTool: executeSaveCodeTool,
  });

  const implementationPrompt = [
    `BYGGKONTRAKT FRÅN FAS 1 (3c):\n${steg3c}`,
    `DETTA ÄR DET TRANSIENTA TESTET SOM SKALL GÖRAS GRÖNT (${transientTestFile}):`,
    '```typescript',
    actualTestCode,
    '```',
    `OBLIGATORISKA ARKITEKTURREGLER FÖR ATT GÖRA TESTET GRÖNT:`,
    `1. IMPLEMENTERA EXAKT DET TESTET FÖRVÄNTAR SIG:`,
    `   - Testet importerar 'emitPing' från '../features/${targetDomain}'.`,
    `   - Alltså MÅSTE filen 'src/features/${targetDomain}/index.ts' exportera funktionen 'emitPing'.`,
    `   - 'emitPing()' måste anropa eventBus.emit('telemetry:ping', ...) på den globala bussen 'getGlobalSwarmEventBus()' från '../../shared/bus/swarmEventBus' och returnera { success: true, ... }.`,
    `2. STRIKT FSD-ISOLERING:`,
    `   - Spara ENDAST filer under 'src/features/${targetDomain}/' (t.ex. 'src/features/${targetDomain}/ping.ts' och 'src/features/${targetDomain}/index.ts').`,
    `   - Rör ALDRIG filer i 'src/shared/'.`,
    `3. SPARA MED VERKTYGET:`,
    `   - Anropa save_code({ file_path, code }) för varje fil du skapar.`,
  ].join('\n\n');

  try {
    await codeSession.connect();
    await codeSession.send(implementationPrompt, 120000);
  } finally {
    codeSession.close();
  }

  if (writtenFiles.length === 0) {
    console.error('\n❌ FAS 2 UNDERKÄND: Modellen genererade inga filer via save_code. Bygget fallerar rött.');
    process.exit(1);
  }

  console.log(`\n✅ Modellen genererade ${writtenFiles.length} filer via save_code: ${writtenFiles.join(', ')}`);

  console.log('\n🔒 Verifierar Gate 2c: AST-kontroll mot tysta catch-block...');
  try {
    execSync(`node scripts/drivers/ts.js --check-catch-blocks --feature ${targetDomain}`, { stdio: 'inherit', cwd: ROOT_DIR });
  } catch {
    console.error('❌ GATE 2c UNDERKÄND: Tomma eller tysta catch-block utan felpropagering hittades i källkoden.');
    process.exit(1);
  }

  console.log('\n🟢 Kör transient-testet mot den nyskapade källkoden...');
  try {
    execSync('pnpm test:transient', { stdio: 'inherit', cwd: ROOT_DIR });
    console.log('✅ Transient-testet passerade grönt!');
  } catch {
    console.error('❌ Transient-testet underkändes mot den genererade källkoden.');
    process.exit(1);
  }

  // --------------------------------------------------------------------------
  // FAS 3: REFLEKTION & TEATER
  // --------------------------------------------------------------------------
  appendToCycleLog(`\n### FAS 3: REFLEKTION & TEATER`);
  console.log('\n🎭 Öppnar Fas 3: Reflektion och debriefing...');

  const fas3Session = new BidiLiveSession({
    ai,
    model: MODEL_NAME,
    systemInstruction: `${systemInstruction}\n\nDu leder Fas 3 som Att förlikas. Sammanfatta bygget och reflektera kort över mänsklig nytta och stabilitet.`,
  });

  try {
    await fas3Session.connect();
    const debrief = await fas3Session.send(`Bygget för ${ticketId} är slutfört med grönt test. Ge en kort teater-reflektion.`);
    appendToCycleLog(`\n#### 3d Att förlikas: Teater & Reflektion\n${debrief}`);
  } finally {
    fas3Session.close();
  }

  console.log(`\n🎉 Hela livscykeln för ${ticketId} slutfördes deterministiskt!`);
}

main().catch((err) => {
  console.error('\n💥 Ohanterat fel under byggcykeln:', err);
  process.exit(1);
});
