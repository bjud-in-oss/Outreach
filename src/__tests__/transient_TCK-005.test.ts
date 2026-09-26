import fs from 'node:fs';
import path from 'node:path';

export function runTransientTCK005Tests(): { name: string; passed: boolean; error?: string }[] {
  const results = [];
  const rootDir = process.cwd();

  // Test 1: Globala systembeslut i doc/DECISIONS.md
  try {
    const centralDecisionsPath = path.join(rootDir, 'doc', 'DECISIONS.md');
    const exists = fs.existsSync(centralDecisionsPath);
    if (!exists) throw new Error('doc/DECISIONS.md hittades inte');
    const content = fs.readFileSync(centralDecisionsPath, 'utf8');
    const hasAdr4 = content.includes('ADR-004') && content.includes('Decentraliserad Domänarkitektur');
    const hasAdr5 = content.includes('ADR-005') && content.includes('Token Gate Säkerhetsspärr');
    results.push({
      name: 'doc/DECISIONS.md konsoliderar ADR-004 och ADR-005',
      passed: exists && hasAdr4 && hasAdr5,
    });
  } catch (err: any) {
    results.push({
      name: 'doc/DECISIONS.md konsoliderar ADR-004 och ADR-005',
      passed: false,
      error: err.message,
    });
  }

  // Test 2: gemini_live_swarm lokala beslut
  try {
    const p = path.join(rootDir, 'src', 'features', 'gemini_live_swarm', 'doc', 'DECISIONS.md');
    const exists = fs.existsSync(p);
    if (!exists) throw new Error('src/features/gemini_live_swarm/doc/DECISIONS.md hittades inte');
    const content = fs.readFileSync(p, 'utf8');
    const valid =
      content.includes('ADR-SWARM-001') &&
      content.includes('ADR-SWARM-002') &&
      content.includes('ADR-SWARM-003');
    results.push({
      name: 'gemini_live_swarm dokumenterar ADR-SWARM-001..003 lokalt',
      passed: exists && valid,
    });
  } catch (err: any) {
    results.push({
      name: 'gemini_live_swarm dokumenterar ADR-SWARM-001..003 lokalt',
      passed: false,
      error: err.message,
    });
  }

  // Test 3: google_drive_sync lokala beslut
  try {
    const p = path.join(rootDir, 'src', 'features', 'google_drive_sync', 'doc', 'DECISIONS.md');
    const exists = fs.existsSync(p);
    if (!exists) throw new Error('src/features/google_drive_sync/doc/DECISIONS.md hittades inte');
    const content = fs.readFileSync(p, 'utf8');
    const valid = content.includes('ADR-DRIVE-001') && content.includes('ADR-DRIVE-002');
    results.push({
      name: 'google_drive_sync dokumenterar ADR-DRIVE-001..002 lokalt',
      passed: exists && valid,
    });
  } catch (err: any) {
    results.push({
      name: 'google_drive_sync dokumenterar ADR-DRIVE-001..002 lokalt',
      passed: false,
      error: err.message,
    });
  }

  // Test 4: mcp_bridge lokala beslut
  try {
    const p = path.join(rootDir, 'src', 'features', 'mcp_bridge', 'doc', 'DECISIONS.md');
    const exists = fs.existsSync(p);
    if (!exists) throw new Error('src/features/mcp_bridge/doc/DECISIONS.md hittades inte');
    const content = fs.readFileSync(p, 'utf8');
    const valid = content.includes('ADR-MCP-001') && content.includes('ADR-MCP-002');
    results.push({
      name: 'mcp_bridge dokumenterar ADR-MCP-001..002 lokalt',
      passed: exists && valid,
    });
  } catch (err: any) {
    results.push({
      name: 'mcp_bridge dokumenterar ADR-MCP-001..002 lokalt',
      passed: false,
      error: err.message,
    });
  }

  // Test 5: wal_logger lokala beslut
  try {
    const p = path.join(rootDir, 'src', 'features', 'wal_logger', 'doc', 'DECISIONS.md');
    const exists = fs.existsSync(p);
    if (!exists) throw new Error('src/features/wal_logger/doc/DECISIONS.md hittades inte');
    const content = fs.readFileSync(p, 'utf8');
    const valid = content.includes('ADR-WAL-001') && content.includes('ADR-WAL-002');
    results.push({
      name: 'wal_logger dokumenterar ADR-WAL-001..002 lokalt',
      passed: exists && valid,
    });
  } catch (err: any) {
    results.push({
      name: 'wal_logger dokumenterar ADR-WAL-001..002 lokalt',
      passed: false,
      error: err.message,
    });
  }

  // Test 6: APPROVAL.md bekräftar token
  try {
    const approvalPath = path.join(rootDir, 'doc', 'LAST_CYCLE', 'APPROVAL.md');
    const exists = fs.existsSync(approvalPath);
    if (!exists) throw new Error('APPROVAL.md saknas');
    const content = fs.readFileSync(approvalPath, 'utf8');
    const hasToken = content.includes('TCK-005-DECISIONS-STD-TOKEN');
    results.push({
      name: 'Token Gate godkännande verifierat för TCK-005',
      passed: exists && hasToken,
    });
  } catch (err: any) {
    results.push({
      name: 'Token Gate godkännande verifierat för TCK-005',
      passed: false,
      error: err.message,
    });
  }

  return results;
}
