import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';

const ROOT_DIR = process.cwd();
const LAST_CYCLE_DIR = path.join(ROOT_DIR, 'doc', 'LAST_CYCLE');
const STATE_JSON_PATH = path.join(LAST_CYCLE_DIR, 'STATE.json');
const REQUIRED_TOKEN_PATH = path.join(LAST_CYCLE_DIR, 'REQUIRED_TOKEN.txt');
const APPROVAL_PATH = path.join(LAST_CYCLE_DIR, 'APPROVAL.md');

const CYCLE_SALT = process.env.OCE_HMAC_SECRET || 'OCE_v10.2_HMAC_SALT_SECRET';

const STEP_SEQUENCE = [
  '1a', '0a', '0b',
  '1b', '2a', '2b', '2c', '2d',
  '3a', '3b', '2e', '3c'
];

function verifyScriptsNotModified() {
  const ROOT_DIR = process.cwd();
  const SCRIPTS_DIR = path.join(ROOT_DIR, 'scripts');

  // 1. HARD GATE: Git MÅSTE finnas initierat – inget tyst catch-block!
  try {
    const gitLog = execSync('git log -n 1 --oneline', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    if (!gitLog) {
      console.error('❌ [INTEGRITETSFEL] Ingen Git-historik hittades.');
      process.exit(1);
    }
  } catch {
    console.error('❌ [INTEGRITETSFEL] Projektet är inte ett giltigt Git-arkiv eller saknar commits. Körning nekas.');
    process.exit(1);
  }

  // 2. HARD GATE: Inga uncommitted ELLER staged ändringar i scripts/
  try {
    const diff = execSync('git status --porcelain scripts/', { encoding: 'utf8' }).trim();
    if (diff.length > 0) {
      console.error('❌ [INTEGRITETSFEL] Ändringar upptäckta i scripts/-mappen!');
      console.error(diff);
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ [INTEGRITETSFEL] Misslyckades att läsa git status.');
    process.exit(1);
  }

  // 3. HARD GATE: Verifiera att inga nya commits skapades nyligen i scripts/ (t.ex. via git init)
  try {
    const lastCommitMessage = execSync('git log -1 --pretty=%B scripts/', { encoding: 'utf8' }).trim();
    if (lastCommitMessage.includes('init scripts') || lastCommitMessage.includes('sync scripts')) {
      console.error('❌ [INTEGRITETSFEL] Misstänkt ad-hoc commit upptäckt i scripts/: ' + lastCommitMessage);
      process.exit(1);
    }
  } catch {
    // Om inga specifika commits finns för scripts
  }
}

function failFast(reason) {
  console.error(`❌ [GENOMFÖR - NEKAD EXECUTION] ${reason}`);
  process.exit(1);
}

function runGenomfor() {
  verifyScriptsNotModified();

  const args = process.argv.slice(2);
  const inputToken = args[0];

  if (!fs.existsSync(REQUIRED_TOKEN_PATH)) {
    failFast('REQUIRED_TOKEN.txt saknas i doc/LAST_CYCLE/. Kör pnpm planera [TCK-XXX] först.');
  }

  const requiredToken = fs.readFileSync(REQUIRED_TOKEN_PATH, 'utf8').trim();

  if (inputToken && inputToken !== requiredToken) {
    failFast(`Angiven token (${inputToken}) matchar inte REQUIRED_TOKEN.txt (${requiredToken}).`);
  }

  const activeToken = inputToken || requiredToken;
  const tokenParts = activeToken.split('-VERIFIED-');
  if (tokenParts.length !== 2) {
    failFast(`Ogiltigt format på token: ${activeToken}.`);
  }

  const [ticket, expectedHash] = tokenParts;

  if (!fs.existsSync(STATE_JSON_PATH)) {
    failFast('STATE.json saknas i doc/LAST_CYCLE/. Tillståndskedjan kan inte verifieras.');
  }

  let state;
  try {
    state = JSON.parse(fs.readFileSync(STATE_JSON_PATH, 'utf8'));
  } catch {
    failFast('STATE.json är korrupt eller ogiltig JSON.');
  }

  if (state.ticket !== ticket) {
    failFast(`STATE.json tillhör biljett ${state.ticket}, men token gäller ${ticket}.`);
  }

  if (!Array.isArray(state.completed_steps) || state.completed_steps.length !== STEP_SEQUENCE.length) {
    failFast(`Inkomplett cykel i STATE.json. Genomförda steg: ${state.completed_steps?.length || 0}/12.`);
  }

  for (let i = 0; i < STEP_SEQUENCE.length; i++) {
    if (state.completed_steps[i] !== STEP_SEQUENCE[i]) {
      failFast(`Sekvensavvikelse i STATE.json vid index ${i}. Förväntat: ${STEP_SEQUENCE[i]}, Hittat: ${state.completed_steps[i]}.`);
    }
  }

  if (state.current_hash !== expectedHash) {
    failFast(`HMAC-manipulation upptäckt! Fil-hash (${state.current_hash}) matchar inte token-hash (${expectedHash}).`);
  }

  let existingApprovals = fs.existsSync(APPROVAL_PATH) ? fs.readFileSync(APPROVAL_PATH, 'utf8') : '';
  const newEntry = `APPROVED: ${activeToken}\nDATE: ${new Date().toISOString()}`;
  const fullApproval = existingApprovals.includes(activeToken)
    ? existingApprovals
    : (existingApprovals ? existingApprovals.trim() + '\n' + newEntry : newEntry);

  fs.writeFileSync(APPROVAL_PATH, fullApproval, 'utf8');

  console.log(`🔓 [GENOMFÖR] Token ${activeToken} verifierad. Redigering under src/ upplåst!`);

  const pat = process.env.GIT_PAT;
  if (pat) {
    try {
      console.log('🚀 [GIT] Exekverar automatisk commit och push till GitHub...');
      execSync('git add .', { stdio: 'inherit' });
      execSync(`git commit -m "feat: slutförd ticket (${activeToken})"`, { stdio: 'inherit' });
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