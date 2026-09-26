import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { scanTypeScriptFiles, verifyContracts } from './drivers/ts.js';

const ROOT_DIR = process.cwd();
const LAST_CYCLE_DIR = path.join(ROOT_DIR, 'doc', 'LAST_CYCLE');

function runVerification() {
  console.log('🔍 [ARKITEKTURKONTROLL] Påbörjar arkitektur- och kontraktsvalidering...');
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
    const match = content.match(/\[(?:AKTIV|OPEN|IN PROGRESS)\]\s*[:|]?\s*(TCK-\d+)/i);
    if (!match) {
      issues.push('doc/TICKETS.md saknar aktiv ticket');
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
      if (!parsed.features || !parsed.features.google_drive_sync || !parsed.features.mcp_bridge) {
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

  // 4. Fas 2 validering: APPROVAL.md måste finnas och innehålla godkännandekod
  const approvalPath = path.join(LAST_CYCLE_DIR, 'APPROVAL.md');
  const requiredTokenPath = path.join(LAST_CYCLE_DIR, 'REQUIRED_TOKEN.txt');
  const validTokens = ['OUTREACH-COORD-TCK001-TOKEN', 'SWARM-TELEMETRY-TCK002-TOKEN'];
  if (fs.existsSync(requiredTokenPath)) {
    const reqTok = fs.readFileSync(requiredTokenPath, 'utf8').trim();
    if (reqTok) validTokens.push(reqTok);
  }

  if (fs.existsSync(approvalPath)) {
    const approvalContent = fs.readFileSync(approvalPath, 'utf8');
    const hasValidToken = validTokens.some(token => approvalContent.includes(token));
    if (!hasValidToken) {
      issues.push('APPROVAL.md innehåller felaktig eller saknad godkännandekod');
    } else {
      filesChecked.push('doc/LAST_CYCLE/APPROVAL.md');
    }
  } else {
    // Om APPROVAL inte finns, kontrollera att inga features finns
    const featuresDir = path.join(ROOT_DIR, 'src', 'features');
    if (fs.existsSync(featuresDir)) {
      const featureEntries = fs.readdirSync(featuresDir);
      if (featureEntries.length > 0) {
        issues.push(`Fas 1 regelöverträdelse: src/features/ får inte innehålla moduler utan APPROVAL.md`);
      }
    }
  }

  // Samla alla TS/TSX-filer för övergripande kontroll
  const tsFiles = scanTypeScriptFiles([path.join(ROOT_DIR, 'src')]);
  tsFiles.forEach(f => {
    const rel = path.relative(ROOT_DIR, f);
    if (!filesChecked.includes(rel)) filesChecked.push(rel);
  });

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

  const receiptPath = path.join(LAST_CYCLE_DIR, 'VERIFY_RECEIPT.json');
  fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2), 'utf8');

  if (!passed) {
    console.error('❌ [ARKITEKTURKONTROLL] Fel upptäcktes:');
    issues.forEach(err => console.error(`  - ${err}`));
    process.exit(1);
  }

  console.log(`✅ [ARKITEKTURKONTROLL] Verifiering GODKÄND! Kvitto sparat till doc/LAST_CYCLE/VERIFY_RECEIPT.json (Hash: ${receiptHash})`);
}

runVerification();
