import fs from 'node:fs';
import { execSync } from 'node:child_process';

function runGenomfor() {
  const inputToken = process.argv[2];
  const requiredToken = fs.readFileSync('doc/LAST_CYCLE/REQUIRED_TOKEN.txt', 'utf-8').trim();

  if (!inputToken || inputToken !== requiredToken) {
    console.error(`[FEL] Ogiltig token. Angiven: ${inputToken}, Krävs: ${requiredToken}`);
    process.exit(1);
  }

  // 1. Skapa eller uppdatera godkännande
  let existingApprovals = '';
  if (fs.existsSync('doc/LAST_CYCLE/APPROVAL.md')) {
    existingApprovals = fs.readFileSync('doc/LAST_CYCLE/APPROVAL.md', 'utf-8');
  }
  const newEntry = `APPROVED: ${inputToken}\nDATE: ${new Date().toISOString()}`;
  const fullApproval = existingApprovals.includes(inputToken)
    ? existingApprovals
    : (existingApprovals ? existingApprovals.trim() + '\n' + newEntry : newEntry);
  fs.writeFileSync('doc/LAST_CYCLE/APPROVAL.md', fullApproval);
  console.log('[GENOMFÖR] Token verifierad. Redigering fri.');

  // 2. Automatiskt Git-flöde vid tillgänglig PAT
  const pat = process.env.GIT_PAT;
  if (pat) {
    try {
      console.log('[GIT] Exekverar automatisk commit och push till GitHub...');
      execSync('git add .', { stdio: 'inherit' });
      execSync(`git commit -m "feat: slutförd ticket (${inputToken})"`, { stdio: 'inherit' });
      execSync(`git push https://${pat}@github.com/bjud-in-oss/Outreach.git main --force`, { stdio: 'inherit' });
      console.log('[GIT] Push till bjud-in-oss/Outreach slutförd!');
    } catch (err) {
      console.error('[GIT FEL] Automatisk push misslyckades:', err.message);
    }
  } else {
    console.log('[GIT] Ingen GIT_PAT hittades i miljön. Hoppar över automatisk push.');
  }
}

runGenomfor();