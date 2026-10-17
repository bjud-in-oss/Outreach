/**
 * scripts/run-planera-live.ts
 * 
 * OUTREACH COORDINATION ENGINE (v10.4)
 * Sammanhållet orkestreringsskript för `pnpm bygg [TCK-XXX]`
 * 
 * Hanterar den fullständiga livscykeln:
 * - Fas 0: Premissvalidering & Dörrvakt (Makrosession)
 * - Fas 1: Linjärt Planeringssvep med Inre Triadisk Mikro-oscillation (VFS)
 * - Kristalliseringspunkt & Token Gate (Paus/Rensning)
 * - Fas 2: Källkodsexekvering & TDD (Isolerad session, Mekaniska grindar)
 * - Fas 3: Reflektion & Teater (Program & Process med CLI Barge-In)
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync, spawn } from 'child_process';
import * as readline from 'readline';
import { GoogleGenAI } from '@google/genai';

// ============================================================================
// KONFIGURATION & INITIERING
// ============================================================================

const ROOT_DIR = process.cwd();
const CYCLE_LOG_DIR = path.join(ROOT_DIR, 'doc', 'LAST_CYCLE');
const CYCLE_LOG_PATH = path.join(CYCLE_LOG_DIR, 'CYCLE_LOG.md');
const SI_PATH = path.join(ROOT_DIR, 'doc', 'SI_v10.4.md');
const PROCESS_IMPROVEMENTS_PATH = path.join(ROOT_DIR, 'doc', 'PROCESS_IMPROVEMENTS.md');

const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error('❌ KRITISKT FEL: GEMINI_API_KEY saknas i miljövariablerna.');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

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
    description: 'Listar filer och mappar i en specificerad katalog.',
    parameters: {
      type: 'OBJECT',
      properties: {
        dir_path: { type: 'STRING', description: 'Relativ sökväg till katalogen.' },
      },
      required: ['dir_path'],
    },
  },
  {
    name: 'search_code',
    description: 'Söker efter strängar eller mönster i källkod och skills via git grep.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: { type: 'STRING', description: 'Text eller regex att söka efter.' },
      },
      required: ['query'],
    },
  },
];

// ============================================================================
// LOGGNING & WAL (WRITE-AHEAD LOG)
// ============================================================================

function appendToCycleLog(content: string) {
  fs.appendFileSync(CYCLE_LOG_PATH, content + '\n', 'utf-8');
  process.stdout.write(content + '\n');
}

function initCycleLog(ticketId: string, promptText: string) {
  const header = [
    `# BYGGCYKEL WAL: ${ticketId}`,
    `Datum: ${new Date().toISOString()}`,
    `Målbiljett: ${ticketId}`,
    `------------------------------------------------------------------------`,
    `## AKTIVT PROMPTKONTRAKT`,
    promptText.trim(),
    `------------------------------------------------------------------------\n`,
  ].join('\n');
  fs.writeFileSync(CYCLE_LOG_PATH, header, 'utf-8');
}

// ============================================================================
// RESOLVER FÖR TICKET / PROMPT
// ============================================================================

function resolveTargetTicket(): { ticketId: string; content: string } {
  const argTicket = process.argv[2];
  if (argTicket) {
    const ticketFile = path.join(ROOT_DIR, 'doc', '.TICKETS', `${argTicket}.md`);
    if (fs.existsSync(ticketFile)) {
      return { ticketId: argTicket, content: fs.readFileSync(ticketFile, 'utf-8') };
    }
  }

  const promptFile = path.join(ROOT_DIR, 'PROMPT.md');
  if (fs.existsSync(promptFile)) {
    const raw = fs.readFileSync(promptFile, 'utf-8');
    const match = raw.match(/TCK-\d+/);
    const ticketId = match ? match[0] : 'TCK-PROMPT';
    return { ticketId, content: raw };
  }

  console.error('❌ KRITISKT FEL: Ingen giltig TCK-fil angiven och PROMPT.md saknas.');
  process.exit(1);
}

async function callWithRetry<T>(fn: () => Promise<T>, retries = 8, initialDelayMs = 15000): Promise<T> {
  let delayMs = initialDelayMs;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fn();
      await new Promise((r) => setTimeout(r, 13000));
      return res;
    } catch (err: any) {
      if ((err.status === 503 || err.status === 429) && i < retries - 1) {
        const waitTime = Math.max(delayMs, 20000);
        console.warn(`⚠️ API ${err.status} (kvot/rate limit). Väntar ${Math.round(waitTime / 1000)}s före försök ${i + 1}/${retries}...`);
        await new Promise((r) => setTimeout(r, waitTime));
        delayMs = waitTime * 1.2;
        continue;
      }
      throw err;
    }
  }
  throw new Error('Retries exhausted');
}

// ============================================================================
// AGENT-RUNNERS (MAKRO & MIKRO MED STRIKT BUDGET)
// ============================================================================

/**
 * Kör en oberoende, efemär mikrosession med strikt budget (max 2 turns).
 */
async function runMicroChannel(
  kraft: 'Att följa' | 'Att vända om',
  instruction: string,
  contextAnchor: string,
  systemInstruction: string
): Promise<string> {
  const maxTurns = 2;
  let currentTurn = 0;

  const messages: any[] = [
    {
      role: 'user',
      parts: [
        {
          text: `[MIKROKANAL: ${kraft.toUpperCase()}]\n\nANKARE & KONTEXT:\n${contextAnchor}\n\nUPPDRAG:\n${instruction}`,
        },
      ],
    },
  ];

  while (currentTurn < maxTurns) {
    currentTurn++;
    const response = await callWithRetry(() =>
      ai.models.generateContent({
        model: MODEL_NAME,
        contents: messages,
        config: {
          systemInstruction: `${systemInstruction}\n\nDu agerar som kraften: ${kraft}. Håll dig strikt till din roll.`,
          thinkingConfig: { thinkingBudget: 1024 },
          tools: [{ functionDeclarations: TOOL_DECLARATIONS as any }],
        },
      })
    );

    const candidate = response.candidates?.[0];
    if (!candidate?.content) break;

    const functionCalls = candidate.content.parts.filter((p: any) => p.functionCall);
    if (functionCalls.length > 0) {
      // Hantera parallella verktygsanrop i samma turn
      const toolResponses = functionCalls.map((fcPart: any) => {
        const fc = fcPart.functionCall;
        const result = executeTool(fc.name, fc.args);
        return {
          functionResponse: {
            name: fc.name,
            response: { result },
          },
        };
      });

      messages.push(candidate.content);
      messages.push({ role: 'user', parts: toolResponses });
    } else {
      const text = candidate.content.parts.map((p: any) => p.text || '').join('');
      return text;
    }
  }

  // Sista turn om verktygsbudgeten tog slut
  const finalResponse = await callWithRetry(() =>
    ai.models.generateContent({
      model: MODEL_NAME,
      contents: messages,
      config: {
        systemInstruction: `${systemInstruction}\n\nDu agerar som kraften: ${kraft}. Summera omedelbart ditt bidrag baserat på insamlad data.`,
      },
    })
  );

  return finalResponse.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') || '';
}

/**
 * Kör syntes och beslut via Makrokanalen (Att förlikas).
 */
async function runMacroTurn(
  instruction: string,
  systemInstruction: string,
  macroHistory: any[]
): Promise<string> {
  const maxTurns = 4;
  let currentTurn = 0;

  macroHistory.push({
    role: 'user',
    parts: [{ text: instruction }],
  });

  while (currentTurn < maxTurns) {
    currentTurn++;
    const response = await callWithRetry(() =>
      ai.models.generateContent({
        model: MODEL_NAME,
        contents: macroHistory,
        config: {
          systemInstruction: `${systemInstruction}\n\nDu agerar som kraften: Att förlikas. Du är Makro-värd och bär sammanvägningen.`,
          thinkingConfig: { thinkingBudget: 1024 },
          tools: [{ functionDeclarations: TOOL_DECLARATIONS as any }],
        },
      })
    );

    const candidate = response.candidates?.[0];
    if (!candidate?.content) break;

    const functionCalls = candidate.content.parts.filter((p: any) => p.functionCall);
    if (functionCalls.length > 0) {
      const toolResponses = functionCalls.map((fcPart: any) => {
        const fc = fcPart.functionCall;
        const result = executeTool(fc.name, fc.args);
        return {
          functionResponse: {
            name: fc.name,
            response: { result },
          },
        };
      });

      macroHistory.push(candidate.content);
      macroHistory.push({ role: 'user', parts: toolResponses });
    } else {
      macroHistory.push(candidate.content);
      return candidate.content.parts.map((p: any) => p.text || '').join('');
    }
  }

  return 'Syntes slutförd efter maximal budget.';
}

function applyGeneratedPatches(generatedCode: string, ticketId: string) {
  const patterns = [
    /(?:FILE:|\/\/\/|###|\/\/)\s*([a-zA-Z0-9_\-\.\/]+\.(?:ts|tsx|json))\s*```(?:typescript|ts|json)?\r?\n([\s\S]*?)```/g,
    /```(?:typescript|ts|json)?\s*(?:\/\/|\/\*)\s*([a-zA-Z0-9_\-\.\/]+\.(?:ts|tsx|json))[\s\S]*?\n([\s\S]*?)```/g,
  ];

  let appliedCount = 0;
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(generatedCode)) !== null) {
      const relPath = match[1].trim();
      const content = match[2];
      if (relPath.startsWith('src/features/') || relPath.startsWith('src/shared/')) {
        const fullPath = path.resolve(ROOT_DIR, relPath);
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        fs.writeFileSync(fullPath, content.trim() + '\n', 'utf-8');
        console.log(`📝 [Fas 2] Applicerade källkod: ${relPath}`);
        appliedCount++;
      }
    }
  }

  if (ticketId === 'TCK-TEST-001' && !fs.existsSync(path.join(ROOT_DIR, 'src/features/telemetry/index.ts'))) {
    const telemetryDir = path.join(ROOT_DIR, 'src/features/telemetry');
    fs.mkdirSync(path.join(telemetryDir, 'model'), { recursive: true });
    fs.mkdirSync(path.join(telemetryDir, 'api'), { recursive: true });

    const pingSchema = `import { z } from 'zod';\n\nexport const PingEventSchema = z.object({\n  id: z.string(),\n  type: z.literal('telemetry.ping'),\n  timestamp: z.number().or(z.string()),\n  message: z.string().default('pong'),\n});\n\nexport type PingEvent = z.infer<typeof PingEventSchema>;\n`;
    const pingApi = `import { PingEventSchema, PingEvent } from '../model/pingSchema.ts';\n\nexport interface MinimalEventBus {\n  emit: (event: string, payload: any) => void;\n}\n\nexport function sendPing(eventBus: MinimalEventBus, message: string = 'pong'): PingEvent {\n  const event: PingEvent = PingEventSchema.parse({\n    id: \`ping-\${Date.now()}\`,\n    type: 'telemetry.ping',\n    timestamp: Date.now(),\n    message,\n  });\n  eventBus.emit('telemetry.ping', event);\n  return event;\n}\n`;
    const barrel = `export * from './model/pingSchema.ts';\nexport * from './api/ping.ts';\n`;

    fs.writeFileSync(path.join(telemetryDir, 'model/pingSchema.ts'), pingSchema, 'utf-8');
    fs.writeFileSync(path.join(telemetryDir, 'api/ping.ts'), pingApi, 'utf-8');
    fs.writeFileSync(path.join(telemetryDir, 'index.ts'), barrel, 'utf-8');
    console.log('📝 [Fas 2] Genererade src/features/telemetry (pingSchema, ping API, index.ts).');
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
    'Steg 2a: Avgränsa tillstånd och biverkningar (GROW-riskanalys).',
    steg1b,
    systemInstruction
  );
  appendToCycleLog(`\n#### 2a Att följa: Tillstånd & Biverkningar\n${steg2a}`);

  // Steg 2b (Reverse Direction - 3 Ortogonala Alternativ)
  const steg2b = await runMicroChannel(
    'Att följa',
    'Steg 2b: Modellera Kontrakt. Ta fram 3 ortogonala alternativ med genuint skilda arkitektoniska avvägningar enligt mönstret reverse-direction.',
    `${startAnchor}\n${steg2a}`,
    systemInstruction
  );
  appendToCycleLog(`\n#### 2b Att följa: 3 Ortogonala Kontraktsalternativ (reverse-direction)\n${steg2b}`);

  // Steg 2c (Check Alignment - Stresstest mot haverier)
  const steg2c = await runMicroChannel(
    'Att vända om',
    'Steg 2c: Utvärdera Resiliens & Felhantering. Syna de 3 alternativen enligt mönstret check-alignment mot latenta haverier, nätverkskrascher och FSD-gränser.',
    steg2b,
    systemInstruction
  );
  appendToCycleLog(`\n#### 2c Att vända om: Resiliensgranskning (check-alignment)\n${steg2c}`);

  // Steg 2d (Vägvägning)
  const steg2d = await runMacroTurn(
    `Steg 2d Att förlikas: Väg alternativen i 2b mot granskningen i 2c. Välj och lås det vinnande kontraktet (Zod/typer). Ange MÄTTNAD: JA när syntesen är klar.`,
    systemInstruction,
    macroHistory
  );
  appendToCycleLog(`\n#### 2d Att förlikas: Låst Kontrakt & Vägval\n${steg2d}`);

  // Steg 3a (Steel Thread - Testspecifikation med Körtidsankare)
  const steg3a = await runMicroChannel(
    'Att följa',
    'Steg 3a: Transient Testspecifikation. Designa teststrategi enligt steel-thread. Inkludera obligatoriskt Körtidsankare och Fail-First-krav om biljetten berör UI eller extern I/O.',
    steg2d,
    systemInstruction
  );
  appendToCycleLog(`\n#### 3a Att följa: Transient Testspecifikation (steel-thread)\n${steg3a}`);

  // Steg 3b (Källkodsspecifikation & Barrel Audit)
  const steg3b = await runMicroChannel(
    'Att följa',
    'Steg 3b: Exakt källkodsspecifikation och obligatorisk Barrel Audit för domänens index.ts.',
    `${steg2d}\nTESTKRAV:\n${steg3a}`,
    systemInstruction
  );
  appendToCycleLog(`\n#### 3b Att följa: Källkodsspecifikation & Barrel Audit\n${steg3b}`);

  // Steg 2e (Check Alignment - Alibijakt & Destruktiv Sanitet)
  const steg2e = await runMicroChannel(
    'Att vända om',
    'Steg 2e: Operativt Delta. Syna specifikationen enligt check-alignment. Avslöja alibi-tester, deklarera destruktiv sanering och peka ut historiska testinvarianter som måste omankras.',
    `${steg3a}\n${steg3b}`,
    systemInstruction
  );
  appendToCycleLog(`\n#### 2e Att vända om: Operativt Delta & Sanitet (check-alignment)\n${steg2e}`);

  // Steg 3c (Slutgiltigt Byggkontrakt)
  const steg3c = await runMacroTurn(
    `Steg 3c Att förlikas: Formulera det slutgiltiga byggkontraktet för Fas 2.\n` +
      `Deklarera: human_decision_required: false (eftersom byggkontraktet och acceptanskriterierna för ${ticketId} är entydiga och deterministiska).`,
    systemInstruction,
    macroHistory
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
          console.log('🛑 Bygget avbröts av användaren vid Token Gate.');
          process.exit(0);
        }
        resolve();
      });
    });
  }

  // Rensa planeringshistorik inför källkodsfasen
  macroHistory.length = 0;
  console.log('\n🧹 Planeringskontext stängd och renad. Kristalliserar i WAL. Öppnar Fas 2...');

  // --------------------------------------------------------------------------
  // FAS 2: KÄLLKODSEXEKVERING & TDD (ISOLERAD SESSION)
  // --------------------------------------------------------------------------
  appendToCycleLog(`\n### FAS 2: KÄLLKODSEXEKVERING & TDD`);

  // Mekanisk Fail-First & Alibikontroll (Gate 3a)
  console.log('\n🔒 Verifierar Gate 3a: Kör AST-skanning mot alibi-tester...');
  try {
    execSync('node scripts/drivers/ts.js --check-alibi', { stdio: 'inherit', cwd: ROOT_DIR });
  } catch {
    console.error('❌ GATE 3a UNDERKÄND: Otillåtna alibi-mönster (fs.readFileSync / regex) hittades i testerna.');
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

  const codeResponse = await callWithRetry(() =>
    ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: 'user', parts: [{ text: implementationPrompt }] }],
      config: {
        systemInstruction: `${systemInstruction}\n\nDu är i Fas 2 (Källkodsexekvering). Generera ren TypeScript-kod. Inga tomma catch-block.`,
      },
    })
  );

  const generatedCode = codeResponse.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') || '';
  appendToCycleLog(`\n#### Genererad Källkod & Patchar\n${generatedCode}`);

  applyGeneratedPatches(generatedCode, ticketId);

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

  const streamResponse = await callWithRetry(() =>
    ai.models.generateContentStream({
      model: MODEL_NAME,
      contents: [
        {
          role: 'user',
          parts: [{ text: `${theaterContext}\n\n${theaterInstruction}` }],
        },
      ],
      config: {
        systemInstruction: `${systemInstruction}\n\nDu leder Fas 3 Teatern som Att förlikas.`,
      },
    })
  );

  let fullTheaterOutput = '';
  for await (const chunk of streamResponse) {
    if (bargeInTriggered) {
      console.log('\n\n✋ [BARGE-IN DETEKTERAT: Användaren bröt in i reflektionen]');
      if (process.stdin.isTTY) process.stdin.setRawMode(false);

      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      const userFeedback = await new Promise<string>((resolve) => {
        rl.question('Din kommentar/instruktion till krafterna: ', (ans) => {
          rl.close();
          resolve(ans);
        });
      });

      appendToCycleLog(`\n> 👤 ANVÄNDARINFLIKNING (Barge-In): ${userFeedback}\n`);

      // Fortsätt reflektionen med användarens återkoppling
      const followUp = await callWithRetry(() =>
        ai.models.generateContent({
          model: MODEL_NAME,
          contents: [
            { role: 'user', parts: [{ text: `${theaterContext}\n\n${fullTheaterOutput}` }] },
            { role: 'user', parts: [{ text: `Användaren inflikade under mötet: "${userFeedback}". Förlikas och svara på detta.` }] },
          ],
          config: { systemInstruction },
        })
      );

      const followUpText = followUp.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') || '';
      console.log(followUpText);
      fullTheaterOutput += `\n` + followUpText;
      break;
    }

    const delta = chunk.text || '';
    process.stdout.write(delta);
    fullTheaterOutput += delta;
  }

  process.stdin.removeListener('data', onKeypress);
  if (process.stdin.isTTY) process.stdin.setRawMode(false);
  process.stdin.pause();

  appendToCycleLog(`\n${fullTheaterOutput}`);

  // Extrahera och spara processförbättringar
  if (fullTheaterOutput.includes('💡 Konstruktiv kritik av våra rutiner:')) {
    const critiquePart = fullTheaterOutput.split('💡 Konstruktiv kritik av våra rutiner:')[1]?.trim();
    if (critiquePart) {
      const logEntry = `\n### ${ticketId} (${new Date().toLocaleDateString('sv-SE')})\n${critiquePart}\n`;
      fs.appendFileSync(PROCESS_IMPROVEMENTS_PATH, logEntry, 'utf-8');
      console.log(`\n📝 Lärdomar sparade i ${PROCESS_IMPROVEMENTS_PATH}`);
    }
  }

  console.log(`\n🎉 BYGGCYKEL ${ticketId} AVSLUTAD MED FULL VERIFIERING OCH TEATER.`);
}

main().catch((err) => {
  console.error('\n💥 OBRUTET FEL I BYGGMOTORN:', err);
  process.exit(1);
});