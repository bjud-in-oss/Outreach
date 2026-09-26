import fs from 'node:fs';

function runGenomfor() {
  const inputToken = process.argv[2];
  const requiredToken = fs.readFileSync('doc/LAST_CYCLE/REQUIRED_TOKEN.txt', 'utf-8').trim();

  if (!inputToken || inputToken !== requiredToken) {
    console.error(`[FEL] Ogiltig token. Angiven: ${inputToken}, Krävs: ${requiredToken}`);
    process.exit(1);
  }

  fs.writeFileSync('doc/LAST_CYCLE/APPROVAL.md', `APPROVED: ${inputToken}\nDATE: ${new Date().toISOString()}`);
  console.log('[GENOMFÖR] Token verifierad. Redigering av src/ upplåst.');
}
runGenomfor();