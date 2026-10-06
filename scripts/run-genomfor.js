import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT_DIR = process.cwd();
const LAST_CYCLE_DIR = path.join(ROOT_DIR, 'doc', 'LAST_CYCLE');
const STATE_JSON_PATH = path.join(LAST_CYCLE_DIR, 'STATE.json');
const REQUIRED_TOKEN_PATH = path.join(LAST_CYCLE_DIR, 'REQUIRED_TOKEN.txt');
const APPROVAL_PATH = path.join(LAST_CYCLE_DIR, 'APPROVAL.md');

function runGenomfor() {
  const inputToken = process.argv[2];

  if (!fs.existsSync(REQUIRED_TOKEN_PATH)) {
    console.error('❌ [FEL] REQUIRED_TOKEN.txt saknas. Fas 1 (pnpm planera) har inte slutförts.');
    process.exit(1);
  }

  const requiredToken = fs.readFileSync(REQUIRED_TOKEN_PATH, 'utf-8').trim();

  if (!inputToken || inputToken !== requiredToken) {
    console.error(`❌ [FEL] Ogiltig eller saknad token.\n   Angiven: ${inputToken || '(ingen)'}\n   Krävs:   ${requiredToken}`);
    process.exit(1);
  }

  // Validera STATE.json och säkerställ att steg 3c är uppnått i HMAC-kedjan
  if (fs.existsSync(STATE_JSON_PATH)) {
    try {
      const state = JSON.parse(fs.readFileSync(STATE_JSON_PATH, 'utf8'));
      if (!state.completed_steps || !state.completed_steps.includes('3c')) {
        console.error('❌ [FEL] Tillståndskedjan i STATE.json är ofullständig. Steg 3c har inte uppnåtts.');
        process.exit(1);
      }
    } catch (e) {
      console.error(`❌ [FEL] STATE.json är ogiltig JSON: ${e.message}`);
      process.exit(1);
    }
  } else {
    console.error('❌ [FEL] STATE.json saknas under doc/LAST_CYCLE/. Ingen giltig planeringscykel hittades.');
    process.exit(1);
  }

  // 1. Skapa eller uppdatera APPROVAL.md
  let existingApprovals = '';
  if (fs.existsSync(APPROVAL_PATH)) {
    existingApprovals = fs.readFileSync(APPROVAL_PATH, 'utf-8');
  }

  const newEntry = `APPROVED: ${inputToken}\nDATE: ${new Date().toISOString()}`;
  const fullApproval = existingApprovals.includes(inputToken)
    ? existingApprovals
    : (existingApprovals ? existingApprovals.trim() + '\n' + newEntry : newEntry);

  fs.writeFileSync(APPROVAL_PATH, fullApproval, 'utf8');
  console.log('🔓 [GENOMFÖR v10.2] Token och tillståndskedja verifierade. Redigering under src/ upplåst!');

  // 2. Automatiskt Git-flöde vid tillgänglig PAT
  const pat = process.env.GIT_PAT;
  if (pat) {
    try {
      console.log('🚀 [GIT] Exekverar automatisk commit och push till GitHub...');
      execSync('git add .', { stdio: 'inherit' });
      execSync(`git commit -m "feat: slutförd ticket (${inputToken})"`, { stdio: 'inherit' });
      execSync(`git push https://${pat}@github.com/bjud-in-oss/Outreach.git main --force`, { stdio: 'inherit' });
      console.log('✅ [GIT] Push till bjud-in-oss/Outreach slutförd!');
    } catch (err) {
      console.error('⚠️ [GIT FEL] Automatisk push misslyckades:', err.message);
    }
  } else {
    console.log('ℹ️ [GIT] Ingen GIT_PAT hittades i miljön. Hoppar över automatisk push.');
  }
}

runGenomfor();