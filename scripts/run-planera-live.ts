/**
 * scripts/run-planera-live.ts
 * 
 * OUTREACH COORDINATION ENGINE (v10.4)
 * Sammanhållet orkestreringsskript för `pnpm bygg [TCK-XXX]`
 * 
 * Hanterar den fullständiga livscykeln:
 * - Fas 0: Premissvalidering & Dörrvakt (Makrosession)
 * - Fas 1: Linjärt Planeringssvep med Inre Triadisk Mikro-oscillation (VFS)
 * - Omvändelse-Omväg (Process-Fail-Fast)
 * - Kristalliseringspunkt & Token Gate (Paus/Rensning)
 * - Fas 2: Källkodsexekvering & TDD (Isolerad session, Mekaniska grindar)
 * - Fas 3: Reflektion & Teater (Program & Process med CLI Barge-In)
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync, spawn } from 'child_process';
import * as readline from 'readline';
import { GoogleGenAI } from '@google/genai';
import { BidiLiveSession } from './bidiLiveRunner.ts';

// ============================================================================
// KONFIGURATION & INITIERING
// ============================================================================

const ROOT_DIR = process.cwd();
const CYCLE_LOG_DIR = path.join(ROOT_DIR, 'doc', 'LAST_CYCLE');
const CYCLE_LOG_PATH = path.join(CYCLE_LOG_DIR, 'CYCLE_LOG.md');
const SI_PATH = path.join(ROOT_DIR, 'doc', 'SI_v10.4.md');
const PROCESS_IMPROVEMENTS_PATH = path.join(ROOT_DIR, 'doc', 'PROCESS_IMPROVEMENTS.md');

// Lås till Bidi Live Extended Thinking med Unlimited RPD
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-3.8-live-extended-thinking';

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error('❌ KRITISKT FEL: GEMINI_API_KEY saknas i miljövariablerna.');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY, apiVersion: 'v1alpha' });

// Säkerställ katalogstruktur
if (!fs.existsSync(CYCLE_LOG_DIR)) {
  fs.mkdirSync(CYCLE_LOG_DIR, { recursive: true });
}

// ============================================================================
// VERKTYGSLÅDA (JIT & EXPLORATION BUDGET)
// ============================================================================

interface ToolCallResult {
  tool: string;
  output: string;
}

function executeTool(name: string, args: Record<string, any>): string {
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
            maxBuffer: 1024 * 1024,
          });
        } catch {
          return 'Inga träffar hittades.';
        }
      }
      default:
        return `FEL: Okänt verktyg ${name}`;
    }
  } catch (error: any) {
    return `Verktygsfel (${name}): ${error.message}`;
  }
}

// Deklarationer för Gemini API tool-calling
const TOOL_DECLARATIONS = [
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
    description: 'Söker efter en sträng i repots källkod och returnerar matchande rader med filnamn.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: { type: 'STRING', description: 'Söksträng eller regex.' },
      },
      required: ['query'],
    },
  },
];

// ============================================================================
// LOGGNING & WAL-HANTERING
// ============================================================================

function appendToCycleLog(content: string) {
  fs.appendFileSync(CYCLE_LOG_PATH, content + '\n', 'utf-8');
  console.log(content);
}

function initCycleLog(ticketId: string, promptText: string) {
  // Rensa gammal logg vid nytt bygge
  if (fs.existsSync(CYCLE_LOG_PATH)) {
    fs.rmSync(CYCLE_LOG_PATH);
  }
  const timestamp = new Date().toISOString();
  const header = `# WAL: ${ticketId}\n**Starttid:** ${timestamp}\n\n## Ursprunglig Prompt\n${promptText}\n\n---\n`;
  fs.writeFileSync(CYCLE_LOG_PATH, header, 'utf-8');
}

// ============================================================================
// PARSNING & DOMÄNHANTERING
// ============================================================================

function resolveTargetTicket(): { ticketId: string; content: string } {
  const arg = process.argv[2];
  let ticketId = arg;
  let ticketPath = '';

  if (!arg || arg.startsWith('--')) {
    // Om ingen TCK angavs, försök läsa PROMPT.md
    ticketPath = path.join(ROOT_DIR, 'PROMPT.md');
    if (!fs.existsSync(ticketPath)) {
      console.error('❌ FEL: Måste ange en TCK (t.ex. pnpm bygg TCK-001) eller tillhandahålla en PROMPT.md i roten.');
      process.exit(1);
    }
    ticketId = 'PROMPT_DRIVEN';
  } else {
    ticketPath = path.join(ROOT_DIR, `doc/.TICKETS/${ticketId}.md`);
    if (!fs.existsSync(ticketPath)) {
      console.error(`❌ FEL: Hittade inte biljetten ${ticketPath}`);
      process.exit(1);
    }
  }

  return { ticketId, content: fs.readFileSync(ticketPath, 'utf-8') };
}

async function callWithRetry<T>(fn: () => Promise<T>, maxAttempts = 4, delayMs = 2000): Promise<T> {
  let attempt = 0;
  while (attempt < maxAttempts) {
    try {
      return await fn();
    } catch (err: any) {
      attempt++;
      console.warn(`[NÄTVERK] Anrop misslyckades (försök ${attempt}/${maxAttempts}): ${err.message}`);
      if (err.status === 429) {
        console.warn(`[KVOT] Kvotgräns nådd. Väntar ${delayMs * attempt}ms...`);
        await new Promise((res) => setTimeout(res, delayMs * attempt));
      } else if (attempt >= maxAttempts) {
        throw err;
      } else {
        await new Promise((res) => setTimeout(res, delayMs));
      }
    }
  }
  throw new Error('Unreachable');
}

// ============================================================================
// BIDI LIVE WEBSOCKET ORKESTRERING (SI v10.4)
// ============================================================================

let activeMacroSession: BidiLiveSession | null = null;

async function runMacroTurn(
  instruction: string,
  systemInstruction: string,
  _macroHistory?: any[]
): Promise<string> {
    activeMacroSession = new BidiLiveSession({
      ai,
      model: MODEL_NAME,
      systemInstruction: `${systemInstruction}\n\nDu agerar som kraften: Att förlikas. Du är Makro-värd och bär sammanvägningen.`,
      tools: TOOL_DECLARATIONS,
      executeTool,
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
  systemInstruction: string
): Promise<string> {
  const session = new BidiLiveSession({
    ai,
    model: MODEL_NAME,
    systemInstruction: `${systemInstruction}\n\nDu agerar som kraften: ${kraft}. Håll dig strikt till din roll.`,
    tools: TOOL_DECLARATIONS,
    executeTool,
  });
  try {
    await session.connect();
    const prompt = `[MIKROKANAL: ${kraft.toUpperCase()}]\n\nANKARE & KONTEXT:\n${contextAnchor}\n\nUPPDRAG:\n${instruction}`;
    return await session.send(prompt);
  } finally {
    session.close();
  }
}

function applyGeneratedPatches(generatedCode: string, ticketId: string) {
  // Leta efter kodblock i markdown (```typescript ... ```)
  // Om API:et skapar flera filer, förväntar vi oss en kommentar i början av blocket typ: // File: src/features/...

  const blocks = generatedCode.split('```typescript');
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    const endIdx = block.indexOf('```');
    if (endIdx === -1) continue;

    const code = block.substring(0, endIdx).trim();
    const firstLine = code.split('\n')[0].trim();
    let filePath = '';

    if (firstLine.startsWith('// File:')) {
      filePath = firstLine.replace('// File:', '').trim();
    } else if (firstLine.startsWith('// src/')) {
      filePath = firstLine.replace('//', '').trim();
    } else {
      // Fallback: Dumpa till en godtycklig feature-fil (mycket primitivt)
      console.warn(`[KOD] Hittade inget filnamn i blocket, sparar till src/features/fallback_${ticketId}.ts`);
      filePath = `src/features/fallback_${ticketId}.ts`;
    }

    if (filePath) {
      const fullPath = path.join(ROOT_DIR, filePath);
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(fullPath, code, 'utf-8');
      console.log(`[SKRIVER] ${filePath}`);
    }
  }
}

// ============================================================================
// HUVUDFASERNAS EXEKVERING
// ============================================================================

async function main() {
  const { ticketId, content: ticketPrompt } = resolveTargetTicket();
  const systemInstruction = fs.readFileSync(SI_PATH, 'utf-8');

  console.log(`\n🚀 OUTREACH COORDINATION ENGINE v10.4 – STARTAR BYGG: ${ticketId}`);
  initCycleLog(ticketId, ticketPrompt);

  const macroHistory: any[] = [];
  const startAnchor = `BILJETT: ${ticketId}\nPROMPT:\n${ticketPrompt}`;

  // --------------------------------------------------------------------------
  // FAS 0: PREMISSVALIDERING & DÖRRVAKT
  // --------------------------------------------------------------------------
  appendToCycleLog(`\n### FAS 0: PREMISSVALIDERING & DÖRRVAKT`);

  const fas0_1a = await runMicroChannel(
    'Att följa',
    'Steg 1a: Förstå Intention & Mänsklig Nytta. Tolka avsedd funktion och värde.',
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
      `Om fler än 1 FSD berörs eller API-kontrakt bryts: deklarera AVBROTT och instruera klyvning.\n` +
      `Annars deklarera: VÄG 2 GODKÄND och förbered Fas 1. Svara med strukturen: STATUS: [GODKÄND|AVBRUTEN].`,
    systemInstruction,
    macroHistory
  );
  appendToCycleLog(`\n#### 0b Att förlikas: Vägval\n${fas0_0b}`);

  if (fas0_0b.includes('STATUS: AVBRUTEN')) {
    console.error(`\n⛔ FAS 0 AVBRÖT BYGGET: Kontraktsbrott upptäckt. Biljetten måste klyvas via decomposing-tickets.`);
    process.exit(1);
  }

  // --- NYTT: STÖD FÖR --fas0-only STAFETTEST ---
  if (process.argv.includes('--fas0-only')) {
    console.log('\n🏁 [FAS 0-ONLY LÄGE]: Dörrvakt godkänd. Avslutar stafetttest utan källkodsändringar.');
    const replyPath = path.join(ROOT_DIR, 'REPLY.md');
    const replyContent = [
      `# BYGGRAPPORT: ${ticketId} (FAS 0 STAFETTEST)`,
      `**Status:** GODKÄND DÖRRVAKT`,
      `**Tid:** ${new Date().toISOString()}`,
      `\n## Dörrvaktens bedömning (0b Att förlikas):\n${fas0_0b}`,
      `\n*Stafetten mellan 1a (Att följa), 0a (Att vända om) och 0b (Att förlikas) slutfördes framgångsrikt.*`,
    ].join('\n\n');
    fs.writeFileSync(replyPath, replyContent, 'utf-8');
    console.log(`\n📬 Resultat skrivet till ${replyPath}`);
    process.exit(0);
  }

  // --------------------------------------------------------------------------
  // FAS 1: LINJÄRT PLANERINGSSVEP MED INRE TRIADISK OSCILLATION
  // --------------------------------------------------------------------------
  appendToCycleLog(`\n### FAS 1: LINJÄRT PLANERINGSSVEP (MIKRO-OSCILLATION)`);

  // Steg 1b & 2a
  const steg1b = await runMicroChannel(
    'Att följa',
    'Steg 1b: Kartlägg berörd FSD-domän och systemgränser via Feature-Index.',
    startAnchor,
    systemInstruction
  );
  appendToCycleLog(`\n#### 1b Att följa: Domängränser\n${steg1b}`);

  const steg2a = await runMicroChannel(
    'Att följa',
    'Steg 2a: Avgränsa Tillstånd & Biverkningar (State i GROW-riskanalys).',
    `${startAnchor}\nDOMÄN:\n${steg1b}`,
    systemInstruction
  );
  appendToCycleLog(`\n#### 2a Att följa: Tillstånd & Biverkningar\n${steg2a}`);

  // Steg 2b, 2c, 2d (Modellera & Syntetisera)
  const steg2b = await runMicroChannel(
    'Att följa',
    'Steg 2b: Formulera 3 ortogonala alternativ med skilda arkitektoniska avvägningar enligt mönstret reverse-direction.',
    `${startAnchor}\nTILLSTÅND:\n${steg2a}`,
    systemInstruction
  );
  appendToCycleLog(`\n#### 2b Att följa: 3 Ortogonala Alternativ\n${steg2b}`);

  const steg2c = await runMicroChannel(
    'Att vända om',
    'Steg 2c: Utvärdera Resiliens & Felhantering. Granska alternativen enligt check-alignment mot haverier. Förkasta lösningar med tysta catch-block. Deklarera eventuellt process-skav.',
    `${startAnchor}\nALTERNATIV:\n${steg2b}`,
    systemInstruction
  );
  appendToCycleLog(`\n#### 2c Att vända om: Resiliens & Haverigranskning\n${steg2c}`);

  const steg2d = await runMacroTurn(
    `Steg 2d: Syntetisk Vägvägning. Väg spänningsfältet mellan alternativen och granskningen.\nLås det vinnande kontraktet och slå fast MÄTTNAD: JA.\n\nAlternativ:\n${steg2b}\n\nGranskning:\n${steg2c}`,
    systemInstruction,
    macroHistory
  );
  appendToCycleLog(`\n#### 2d Att förlikas: Vägvägning & Mättnad\n${steg2d}`);

  // Steg 3a, 3b, 2e, 3c (Test, Kod & Delta)
  const steg3a = await runMicroChannel(
    'Att följa',
    'Steg 3a: Skriv Transient Testspecifikation. Inkludera obligatoriskt Körtidsankare (steel-thread) och Fail-First-deklaration.',
    `${startAnchor}\nKONTRAKT:\n${steg2d}`,
    systemInstruction
  );
  appendToCycleLog(`\n#### 3a Att följa: Transient Testspecifikation\n${steg3a}`);

  const steg3b = await runMicroChannel(
    'Att följa',
    'Steg 3b: Skriv exakt Källkodsspecifikation, inklusive Barrel Audit av index.ts.',
    `${startAnchor}\nKONTRAKT:\n${steg2d}\nTEST:\n${steg3a}`,
    systemInstruction
  );
  appendToCycleLog(`\n#### 3b Att följa: Källkodsspecifikation\n${steg3b}`);

  const steg2e = await runMicroChannel(
    'Att vända om',
    'Steg 2e: Operativt Delta. Deklarera destruktiv sanering (filer/kod som ska raderas) och omankring av historiska tester. Deklarera eventuellt process-skav.',
    `${startAnchor}\nKODSPEC:\n${steg3b}`,
    systemInstruction
  );
  appendToCycleLog(`\n#### 2e Att vända om: Operativt Delta & Sanering\n${steg2e}`);

  const steg3c = await runMacroTurn(
    `Steg 3c: Slutgiltigt Byggkontrakt & Portvärdering.\nSammanställ byggkontraktet utifrån 3a, 3b och 2e.\n` +
      `Deklarera: human_decision_required: false (eftersom byggkontraktet och acceptanskriterierna för ${ticketId} är entydiga och deterministiska).`,
    systemInstruction,
    macroHistory
  );
  appendToCycleLog(`\n#### 3c Att förlikas: Slutgiltigt Byggkontrakt\n${steg3c}`);

  // --- NYTT: OMVÄNDELSE-OMVÄGEN (PROCESS-FAIL-FAST) ---
  // Kontrollera om Att vända om deklarerar processjustering
  if (steg2c.includes('PROCESS_REVISION_REQUIRED') || steg2e.includes('PROCESS_REVISION_REQUIRED')) {
    console.log('\n⚠️ PROCESS-FAIL-FAST: Att vända om fann skav i processen. Avbryter källkodsbygge och hoppar till Fas 3.');
    const replyPath = path.join(ROOT_DIR, 'REPLY.md');
    const processRevisionReport = [
      `# PROCESS-FAIL-FAST: OMVÄNDELSE KRÄVS (${ticketId})`,
      `**Status:** PAUSED_FOR_PROCESS_REVISION`,
      `**Tid:** ${new Date().toISOString()}`,
      `\n## Identifierat processfel från Att vända om:\n${steg2c}\n${steg2e}`,
      `\n*Bygget stoppades innan källkod ändrades. Justera styrdokument eller skript och starta om från Fas 0.*`,
    ].join('\n\n');
    fs.writeFileSync(replyPath, processRevisionReport, 'utf-8');
    process.exit(0);
  }

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
          console.log('🛑 Bygget avbröts av användaren vid Token Gate.');
          process.exit(0);
        }
        resolve();
      });
    });
  }

  // Rensa planeringshistorik inför källkodsfasen
  closeMacroSession();
  macroHistory.length = 0;
  console.log('\n🧹 Planeringskontext stängd och renad. Kristalliserar i WAL. Öppnar Fas 2...');

  // --------------------------------------------------------------------------
  // FAS 2: KÄLLKODSEXEKVERING & TDD (ISOLERAD SESSION)
  // --------------------------------------------------------------------------
  appendToCycleLog(`\n### FAS 2: KÄLLKODSEXEKVERING & TDD`);

// Mekanisk Fail-First & Alibikontroll (Gate 3a)
  console.log('\n🔒 Verifierar Gate 3a: Kör AST-skanning mot alibi-tester...');
  try {
    const transientTestFile = `src/__tests__/transient_${ticketId}.test.ts`;
    execSync(`node scripts/drivers/ts.js --check-alibi --file ${transientTestFile}`, { stdio: 'inherit', cwd: ROOT_DIR });
  } catch {
    console.error('❌ GATE 3a UNDERKÄND: Alibimönster upptäckta i den aktiva testfilen.');
    process.exit(1);
  }

  console.log('🔴 Gate 3a Fail-First: Verifierar att transient-testet fallerar rött (exit 1) mot befintlig kod...');
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
    console.error('❌ GATE 3a UNDERKÄND: Transient-testet måste fallera med exit-kod 1 mot befintlig kod innan implementering tillåts.');
    process.exit(1);
  }

  // Källkodsimplementation via dedikerad källkodsprompt
  console.log('\n⚡ Implementerar källkod och destruktiv sanering...');
  const implementationPrompt = [
    `BYGGKONTRAKT FRÅN 3c:\n${steg3c}`,
    `TESTSPECIFIKATION FRÅN 3a:\n${steg3a}`,
    `DESTRUKTIVT DELTA FRÅN 2e:\n${steg2e}`,
    `Skriv ut fullständiga patchar för källkod och transient-test. Håll FSD-isoleringen intakt.`,
  ].join('\n\n');

  const codeSession = new BidiLiveSession({
    ai,
    model: MODEL_NAME,
    systemInstruction: `${systemInstruction}\n\nDu är i Fas 2 (Källkodsexekvering). Generera ren TypeScript-kod. Inga tomma catch-block.`,
  });
  let generatedCode = '';
  try {
    await codeSession.connect();
    generatedCode = await codeSession.send(implementationPrompt, 120000);
  } finally {
    codeSession.close();
  }
  appendToCycleLog(`\n#### Genererad Källkod & Patchar\n${generatedCode}`);\n\n  applyGeneratedPatches(generatedCode, ticketId);

  // Resiliens & AST-kontroll (Gate 2c)
  console.log('\n🔒 Verifierar Gate 2c: AST-kontroll mot tysta catch-block...');
  try {
    execSync('node scripts/drivers/ts.js --check-catch-blocks', { stdio: 'inherit', cwd: ROOT_DIR });
  } catch {
    console.error('❌ GATE 2c UNDERKÄND: Tomma eller tysta catch-block utan felpropagering hittades i källkoden.');
    process.exit(1);
  }

  // Mekanisk Domänkontroll
  console.log('🔒 Verifierar FSD-domängräns via git status...');
  const gitStatus = execSync('git status --porcelain src/features/', { encoding: 'utf-8', cwd: ROOT_DIR });
  const touchedDomains = new Set(
    gitStatus
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => line.trim().split(/\s+/)[1])
      .filter((filePath) => filePath && filePath.startsWith('src/features/'))
      .map((filePath) => filePath.split('/')[2])
  );

  if (touchedDomains.size > 1) {
    console.error(`❌ DOMÄNSPÄRR UNDERKÄND: Fler än 1 FSD-domän modifierades (${Array.from(touchedDomains).join(', ')}).`);
    process.exit(1);
  }

  // Verifiera att transient-testet nu är grönt
  console.log('\n🟢 Kör transient-testet mot den nya källkoden...');
  try {
    execSync('pnpm test:transient', { stdio: 'inherit', cwd: ROOT_DIR });
    console.log('✅ Transient-testet passerade grönt!');
  } catch {
    console.error('❌ TESTFEL: Transient-testet fallerade mot den implementerade källkoden.');
    process.exit(1);
  }

  // Slutverifiering
  console.log('\n🔍 Kör pnpm verify (Regressionssvit och typkontroll)...');
  try {
    execSync('pnpm verify', { stdio: 'inherit', cwd: ROOT_DIR });
    console.log('✅ Hela systemet verifierat utan regressioner.');
  } catch {
    console.error('❌ VERIFIERINGSFEL: pnpm verify underkändes.');
    process.exit(1);
  }

  // --------------------------------------------------------------------------
  // FAS 3: REFLEKTION & TEATER (MED CLI BARGE-IN)
  // --------------------------------------------------------------------------
  appendToCycleLog(`\n### FAS 3: REFLEKTION & TEATER (PROGRAM & PROCESS)`);
  console.log('\n🎭 STARTAR FAS 3: TEATERN (Tryck [ENTER] för att avbryta och inflika)...');

  const diffStat = execSync('git diff --stat', { encoding: 'utf-8', cwd: ROOT_DIR });
  const theaterContext = [
    `TELEMETRI & DIFF:\n${diffStat}`,
    `CYKELLOGG:\n${fs.readFileSync(CYCLE_LOG_PATH, 'utf-8')}`,
  ].join('\n\n');

  // Konfigurera terminalens råläge för direkt Barge-In
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }
  process.stdin.resume();
  process.stdin.setEncoding('utf-8');

  let bargeInTriggered = false;
  const onKeypress = (chunk: string) => {
    if (chunk === '\r' || chunk === '\n') {
      bargeInTriggered = true;
    } else if (chunk === '\u0003') {
      process.exit(0); // Ctrl+C
    }
  };
  process.stdin.on('data', onKeypress);

  const theaterInstruction =
    `Du är Att förlikas och agerar värd för eftermötet. Utvärdera både programmet (hur koden främjar närhet och nytta) ` +
    `och processen (verktygsanrop, grindar och friktion). ` +
    `Bjud in de andra krafterna vid behov via taggen: <TALA kraft="följa|vända-om">fråga</TALA>. ` +
    `Avsluta med en explicit sektion: 💡 Konstruktiv kritik av våra rutiner: [Observation & Förslag].`;

  const theaterSession = new BidiLiveSession({
    ai,
    model: MODEL_NAME,
    systemInstruction: `${systemInstruction}\n\nDu leder Fas 3 Teatern som Att förlikas.`,
  });
  let fullTheaterOutput = '';
  try {
    await theaterSession.connect();
    fullTheaterOutput = await theaterSession.send(`${theaterContext}\n\n${theaterInstruction}`);
    console.log(fullTheaterOutput);
  } finally {
    theaterSession.close();
  }
  appendToCycleLog(`\n${fullTheaterOutput}`);\n\n  // Extrahera och spara processförbättringar
  if (fullTheaterOutput.includes('💡 Konstruktiv kritik av våra rutiner:')) {
    const critiquePart = fullTheaterOutput.split('💡 Konstruktiv kritik av våra rutiner:')[1]?.trim();
    if (critiquePart) {
      const logEntry = `\n### ${ticketId} (${new Date().toLocaleDateString('sv-SE')})\n${critiquePart}\n`;
      fs.appendFileSync(PROCESS_IMPROVEMENTS_PATH, logEntry, 'utf-8');
      console.log(`\n📝 Lärdomar sparade i ${PROCESS_IMPROVEMENTS_PATH}`);
    }
  }

  // --- NYTT: GENERERA SLUTGILTIG REPLY.MD ---
  const replyPath = path.join(ROOT_DIR, 'REPLY.md');
  const fullReport = [
    `# SLUTRAPPORT FÖR BYGGBILJETT: ${ticketId}`,
    `**Datum:** ${new Date().toISOString()}`,
    `**Status:** FULLT VERIFIERAD (GRÖN)`,
    `\n## Sammanfattning av bygget`,
    `Biljetten har planerats, prövats mot körtidsankare (Fail-First) och verifierats felfritt mot FSD- och AST-grindarna.`,
    `\n## Fas 3: Eftertanke & Teater`,
    fullTheaterOutput,
  ].join('\n\n');
  fs.writeFileSync(replyPath, fullReport, 'utf-8');
  console.log(`\n📬 Mänsklig slutrapport sparad i ${replyPath}`);

  console.log(`\n🎉 BYGGCYKEL ${ticketId} AVSLUTAD MED FULL VERIFIERING OCH TEATER.`);
}

main().catch((err) => {
  console.error('\n💥 OBRUTET FEL I BYGGMOTORN:', err);
  process.exit(1);
});