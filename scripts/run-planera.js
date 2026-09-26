import fs from 'node:fs';

function runPlanera() {
  const targetTicket = process.argv[2];
  if (!targetTicket) {
    console.log('[PLANERA] Läser PROMPT.md och aktiverar decomposing-tickets...');
  } else {
    console.log(`[PLANERA] Exekverar Fas 1 för ${targetTicket}...`);
  }
}
runPlanera();