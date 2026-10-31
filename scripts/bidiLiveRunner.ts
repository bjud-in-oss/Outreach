import fs from 'fs';
import path from 'path';
import { runLiveSession } from '../src/features/gemini_live_swarm/session/geminiLiveSession.js';

async function main() {
  const payloadPath = process.argv[2];
  if (!payloadPath || !fs.existsSync(payloadPath)) {
    console.error('❌ bidiLiveRunner: Ange en giltig sökväg till en payload-JSON.');
    process.exit(1);
  }

  const payload = JSON.parse(fs.readFileSync(payloadPath, 'utf-8'));
  const { agentRole, promptInfo, anchorData, instruction, outFile, tools } = payload;

  const fullPrompt = `${instruction}\n\nDU ÄR NU I ROLLEN: ${agentRole}\n\nUPPGIFT:\n${promptInfo}\n\nKONTEXT/ANKARE:\n${anchorData}`;

  try {
    const response = await runLiveSession(fullPrompt, tools || []);
    fs.writeFileSync(outFile, response, 'utf-8');
    process.exit(0);
  } catch (err: any) {
    console.error('❌ bidiLiveRunner kraschade:', err.message);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
