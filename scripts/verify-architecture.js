import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { scanTypeScriptFiles, verifyContracts, checkAstMetrics, checkNoProductionMocks } from './drivers/ts.js';

const ROOT_DIR = process.cwd();
const LAST_CYCLE_DIR = path.join(ROOT_DIR, 'doc', 'LAST_CYCLE');
const STATE_JSON_PATH = path.join(LAST_CYCLE_DIR, 'STATE.json');
const APPROVAL_PATH = path.join(LAST_CYCLE_DIR, 'APPROVAL.md');
const REQUIRED_TOKEN_PATH = path.join(LAST_CYCLE_DIR, 'REQUIRED_TOKEN.txt');

function runVerification() {
  console.log('🔍 [ARKITEKTURKONTROLL v10.2] Påbörjar validering av kontrakt, FSD och HMAC-tillstånd...');
  const issues = [];
  const filesChecked = [];

  // 1. Verifiera doc/TICKETS.md
  let activeTicketMatch = 'TCK-001';
  const ticketsPath = path.join(ROOT_DIR, 'doc', 'TICKETS.md');
  if (!fs.existsSync(ticketsPath)) {
    issues.push('Kritiskt: doc/TICKETS.md saknas');
  } else {
    filesChecked.push('doc/TICKETS.md');
    const content = fs.readFileSync(ticketsPath, 'utf8');
    const match = content.match(/\[(?:AKTIV|OPEN|IN PROGRESS)\]\s*[:|]?\s*(TCK-\d+[a-z]?)/i);
    if (!match) {
      const verifiedMatch = content.match(/\[VERIFIERAD\]\s*[:|]?\s*(TCK-\d+[a-z]?)/i);
      activeTicketMatch = verifiedMatch ? verifiedMatch[1] : activeTicketMatch;
    } else {
      activeTicketMatch = match[1];
    }
  }

  // 2. Verifiera doc/FEATURE_INDEX.json
  const featureIndexPath = path.join(ROOT_DIR, 'doc', 'FEATURE_INDEX.json');
  if (!fs.existsSync(featureIndexPath)) {
    issues.push('Kritiskt: doc/FEATURE_INDEX.json saknas');
  } else {
    filesChecked.push('doc/FEATURE_INDEX.json');
    try {
      const parsed = JSON.parse(fs.readFileSync(featureIndexPath, 'utf8'));
      if (!parsed.features) {
        issues.push('doc/FEATURE_INDEX.json saknar obligatoriska feature-deklarationer');
      }
    } catch (e) {
      issues.push(`doc/FEATURE_INDEX.json ogiltig JSON: ${e.message}`);
    }
  }

  // 3. Verifiera src/shared/contracts/envelope.ts
  const envelopePath = path.join(ROOT_DIR, 'src', 'shared', 'contracts', 'envelope.ts');
  const contractCheck = verifyContracts(envelopePath);
  if (!contractCheck.valid) {
    issues.push(contractCheck.error);
  } else {
    filesChecked.push('src/shared/contracts/envelope.ts');
  }

  // 4. Tillståndsvalidering (STATE.json)
  if (fs.existsSync(STATE_JSON_PATH)) {
    filesChecked.push('doc/LAST_CYCLE/STATE.json');
    try {
      const state = JSON.parse(fs.readFileSync(STATE_JSON_PATH, 'utf8'));
      if (!state.completed_steps.includes('3c')) {
        issues.push('Tillståndsfel: CYCLE_LOG saknar fullbordat steg 3c i STATE.json');
      }
    } catch (e) {
      issues.push(`STATE.json ogiltig JSON: ${e.message}`);
    }
  }

  // 5. Fas 2 validering: APPROVAL.md & REQUIRED_TOKEN.txt
  if (fs.existsSync(APPROVAL_PATH)) {
    filesChecked.push('doc/LAST_CYCLE/APPROVAL.md');
    const approvalContent = fs.readFileSync(APPROVAL_PATH, 'utf8');
    let requiredToken = fs.existsSync(REQUIRED_TOKEN_PATH) ? fs.readFileSync(REQUIRED_TOKEN_PATH, 'utf8').trim() : '';

    if (!requiredToken || !approvalContent.includes(requiredToken)) {
      issues.push('APPROVAL.md innehåller felaktig eller icke-matchande godkännandekod i förhållande till REQUIRED_TOKEN.txt');
    }
  } else {
    const featuresDir = path.join(ROOT_DIR, 'src', 'features');
    if (fs.existsSync(featuresDir) && fs.readdirSync(featuresDir).length > 0) {
      issues.push('Fas 1 överträdelse: src/features/ får inte ändras utan godkänd APPROVAL.md');
    }
  }

  // 6. AST- och strukturmått (Max 250 rader per fil etc.)
  const tsFiles = scanTypeScriptFiles([path.join(ROOT_DIR, 'src')]);
  tsFiles.forEach(f => {
    const rel = path.relative(ROOT_DIR, f);
    if (!filesChecked.includes(rel)) filesChecked.push(rel);

    const content = fs.readFileSync(f, 'utf8');
    const astRes = checkAstMetrics(rel, content);
    if (!astRes.valid) {
      issues.push(`AST/Strukturöverträdelse: ${astRes.error}`);
    }

    if (rel.startsWith(path.join('src', 'features')) || rel.startsWith('src/features/')) {
      const mockCheck = checkNoProductionMocks(rel, content);
      if (!mockCheck.valid) {
        issues.push(`Miljöspärr (Förbud mot produktionsmockar): ${mockCheck.error}`);
      }
    }
  });

  // 7. Generera VERIFY_RECEIPT.json
  if (!fs.existsSync(LAST_CYCLE_DIR)) {
    fs.mkdirSync(LAST_CYCLE_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString();
  const hashData = filesChecked.map(f => {
    const full = path.join(ROOT_DIR, f);
    return fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : '';
  }).join('---') + timestamp;

  const receiptHash = crypto.createHash('sha256').update(hashData).digest('hex').substring(0, 8);
  const passed = issues.length === 0;

  const receipt = {
    receipt_hash: receiptHash,
    status: passed ? 'PASSED' : 'FAILED',
    verified_at: timestamp,
    files_checked: filesChecked,
    active_ticket: activeTicketMatch,
    issues: issues
  };

  fs.writeFileSync(path.join(LAST_CYCLE_DIR, 'VERIFY_RECEIPT.json'), JSON.stringify(receipt, null, 2), 'utf8');

  if (!passed) {
    console.error('❌ [ARKITEKTURKONTROLL v10.2] Fel upptäcktes:');
    issues.forEach(err => console.error(`  - ${err}`));
    process.exit(1);
  }

  console.log(`✅ [ARKITEKTURKONTROLL v10.2] Verifiering GODKÄND! Kvitto sparat till doc/LAST_CYCLE/VERIFY_RECEIPT.json (Hash: ${receiptHash})`);
}

runVerification();