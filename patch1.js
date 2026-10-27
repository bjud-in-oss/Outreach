const fs = require('fs');
const file = 'scripts/run-planera-live.ts';
let code = fs.readFileSync(file, 'utf8');

// 1. Importera BidiLiveSession
if (!code.includes('BidiLiveSession')) {
  code = code.replace(
    "import { GoogleGenAI } from '@google/genai';",
    "import { GoogleGenAI } from '@google/genai';\nimport { BidiLiveSession } from './bidiLiveRunner.ts';"
  );
}

// 2. Lås SDK till apiVersion: v1alpha
code = code.replace(
  /new GoogleGenAI\(\{\s*apiKey:\s*API_KEY\s*\}\)/,
  "new GoogleGenAI({ apiKey: API_KEY, apiVersion: 'v1alpha' })"
);

// 3. Ersätt kanalorkestreringen
let p1 = code.indexOf("// KANAL-ORKESTRERING");
const b = code.lastIndexOf("// ===", p1);
if (b !== -1 && b > p1 - 100) p1 = b;
const p2 = code.indexOf("function applyGeneratedPatches(");

const repl = `// ============================================================================
// BIDI LIVE WEBSOCKET ORKESTRERING (SI v10.4)
// ============================================================================

let activeMacroSession: BidiLiveSession | null = null;

async function runMacroTurn(instruction: string, systemInstruction: string, _macroHistory?: any[]): Promise<string> {
  if (!activeMacroSession) {
    activeMacroSession = new BidiLiveSession({
      ai,
      model: MODEL_NAME,
      systemInstruction: \`\${systemInstruction}\\n\\nDu agerar som kraften: Att förlikas. Du är Makro-värd och bär sammanvägningen.\`,
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
    systemInstruction: \`\${systemInstruction}\\n\\nDu agerar som kraften: \${kraft}. Håll dig strikt till din roll.\`,
    tools: TOOL_DECLARATIONS,
    executeTool,
  });
  try {
    await session.connect();
    const prompt = \`[MIKROKANAL: \${kraft.toUpperCase()}]\\n\\nANKARE & KONTEXT:\\n\${contextAnchor}\\n\\nUPPDRAG:\\n\${instruction}\`;
    return await session.send(prompt);
  } finally {
    session.close();
  }
}

`;

code = code.substring(0, p1) + repl + code.substring(p2);
fs.writeFileSync(file, code, 'utf8');
console.log('✅ Steg 1 slutfört: Kanaler kopplade till Bidi Live WebSockets.');
