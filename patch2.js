const fs = require('fs');
const file = 'scripts/run-planera-live.ts';
let code = fs.readFileSync(file, 'utf8');

// 1. Stäng makrosessionen vid Intent Gate
if (!code.includes('closeMacroSession();')) {
  code = code.replace(
    'macroHistory.length = 0;',
    'closeMacroSession();\n  macroHistory.length = 0;'
  );
}

// 2. Fas 2 Live
const f2Start = code.indexOf("const codeResponse = await callWithRetry(");
const f2End = code.indexOf("applyGeneratedPatches(generatedCode, ticketId);");
if (f2Start !== -1 && f2End !== -1 && f2Start < f2End) {
  const f2Repl = `const codeSession = new BidiLiveSession({
    ai,
    model: MODEL_NAME,
    systemInstruction: \`\${systemInstruction}\\n\\nDu är i Fas 2 (Källkodsexekvering). Generera ren TypeScript-kod. Inga tomma catch-block.\`,
  });
  let generatedCode = '';
  try {
    await codeSession.connect();
    generatedCode = await codeSession.send(implementationPrompt, 120000);
  } finally {
    codeSession.close();
  }
  appendToCycleLog(\`\\n#### Genererad Källkod & Patchar\\n\${generatedCode}\`);\n\n  `;
  code = code.substring(0, f2Start) + f2Repl + code.substring(f2End);
}

// 3. Fas 3 Live
const f3Start = code.indexOf("const streamResponse = await callWithRetry(");
const f3Target = "appendToCycleLog(`\\n${fullTheaterOutput}`);";
const f3End = code.indexOf(f3Target);
if (f3Start !== -1 && f3End !== -1 && f3Start < f3End) {
  const f3Repl = `const theaterSession = new BidiLiveSession({
    ai,
    model: MODEL_NAME,
    systemInstruction: \`\${systemInstruction}\\n\\nDu leder Fas 3 Teatern som Att förlikas.\`,
  });
  let fullTheaterOutput = '';
  try {
    await theaterSession.connect();
    fullTheaterOutput = await theaterSession.send(\`\${theaterContext}\\n\\n\${theaterInstruction}\`);
    console.log(fullTheaterOutput);
  } finally {
    theaterSession.close();
  }
  appendToCycleLog(\`\\n\${fullTheaterOutput}\`);`;
  code = code.substring(0, f3Start) + f3Repl + code.substring(f3End + f3Target.length);
}

fs.writeFileSync(file, code, 'utf8');
const rem = (code.match(/generateContent/g) || []).length;
console.log('✅ Steg 2 slutfört! Återstående generateContent i hela filen:', rem);
