const fs = require('fs');
const file = 'scripts/run-planera-live.ts';
let code = fs.readFileSync(file, 'utf8');

// 1. Import BidiLiveSession
if (!code.includes('BidiLiveSession')) {
  code = code.replace(
    "import { GoogleGenAI } from '@google/genai';",
    "import { GoogleGenAI } from '@google/genai';\nimport { BidiLiveSession } from './bidiLiveRunner.ts';"
  );
}

// 2. apiVersion: 'v1alpha'
code = code.replace(/apiKey:\s*API_KEY/, "apiKey: API_KEY, apiVersion: 'v1alpha'");

// 3. Kanal-orkestrering
let p1 = code.indexOf("// KANAL-ORKESTRERING");
const b = code.lastIndexOf("// ===", p1);
if (b !== -1 && b > p1 - 100) p1 = b;
const p2 = code.indexOf("function applyGeneratedPatches(");

if (p1 === -1 || p2 === -1) {
  console.error("Kunde inte hitta kanal-blocket:", p1, p2);
  process.exit(1);
}

const repl = `// ===========================================================================
// BIDI LIVE WEBSOCKET ORKESTRERING (SI v10.4)
// ==========================================================================

let activeMacroSession: BidiLiveSession | null = null;

async function runMacroTurn(
  instruction: string,
  systemInstruction: string,
  _macroHistory?: any[]
): Promise<string> {
  if (!activeMacroSession) {
    activeMacroSession = new BidiLiveSession({
      ai,
      model: MODEL_NAME,
      systemInstruction: \`\${systemInstruction}\n\nDu agerar som kraften: Att förlikas. Du är Makro-värd och bär sammanvägningen.\`,
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
    activeMacroSession = new
  }
}

async function runMicroChannel(
  kraft: 'Att följa' | 'Att vända om',
  instruction: string,
  contextAnchor: string,
  systemInstruction: string:): Promise<string> {
  const session = new BidiLiveSession({
    ai,
    model: MODEL_NAME,
    systemInstruction: \`\${systemInstruction}\n\nDu är kraften: \${kraft}. Håll dig strikt till din roll.\`,
    tools: TOOL_DECLARATIONS,
    executeTool,
  });
  try {
    await session.connect();
    const prompt = \`[MIKROKANAL: \${kraft.toUpperCase()}]\n\nANKARE& KONTEXT:\n\${contextAnchor}\n\nUPPDRG[]\n\${instruction}`;
    return await session.send(prompt);
  } finally {
    session.close();
  }
}

`;

code = code.substring(0, p1) + repl + code.substring(p2);

// 4. Token Gate
code = code.replace("macroHistory.length = 0;", "closeMacroSession();\n  macroHistory.length = 0;");

// 5. Fas 2
const f2Start = code.indexOf("const codeResponse = await callWithRetry(");
const f2End = code.indexOf("applyGeneratedPatches(generatedCode, ticketId);");
if (f2Start !== -1 && f2End !== -1 && f2Start < f2End) {
  const f2 = `const codeSession = new BidiLiveSession({
    ai, model: MODEL_NAME,
    systemInstruction: \`\${systemInstruction}\n\nDu är i Fas 2 (Källkodsexekvering). Generera ren TypeScript-kod. Inga tomma catch-block.\`,
  });
  let generatedCode = '';
  try {
    await codeSession.connect();
    generatedCode = await codeSession.send(implementationPrompt, 120000);
  } finally { codeSession.close(); }
  appendToCycleLog(\`\n#### Genererad Källkod & Patchar\n\${generatedCode}\`);\n\n  `;
  code = code.substring(0, f2Start) + f2 + code.substring(f2End);
}

// 6. Fas 3
const f3Start = code.indexOf("const streamResponse = await callWithRetry(");
const f3EndAnchor = "// Extrahera och spara processförbättringar";
const f3End = code.indexOf(f3EndAnchor);
if (f3Start !== -1 && f3End !== -1 && f3Start < f3End) {
  const f3 = `const theaterSession = new BidiLiveSession({
    ai, model: MODEL_NAME,
    systemInstruction: \`\${systemInstruction}\n\nDu leder Fas 3 Teatern som Att förlikas.\`,
  });
  let fullTheaterOutput = '';
  try {
    await theaterSession.connect();
    fullTheaterOutput = await theaterSession.send(\`\${theaterContext}\n\n\${theaterInstruction}\`);
    console.log(fullTheaterOutput);
  } finally { theaterSession.close(); }
  appendToCycleLog(\`\n\${fullTheaterOutput}\`);\n\n  `;
  code = code.substring(0, f3Start) + f3 + code.substring(f3End);
}


fs.writeFileSync(file, code, 'utf8');
const rem = (code.match(/generateContent/g) || []).length;
console.log('✅ Patch slutförd! Återstående generateContent:', rem);
