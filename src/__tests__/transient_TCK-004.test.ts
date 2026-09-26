import fs from 'node:fs';
import path from 'node:path';

export function runTransientTCK004Tests(): { name: string; passed: boolean; error?: string }[] {
  const results = [];
  const rootDir = process.cwd();

  // Test 1: Wayfinder skill manifest finns och är formaterad
  try {
    const skillPath = path.join(rootDir, '.agents', 'skills', 'wayfinder', 'SKILL.md');
    const exists = fs.existsSync(skillPath);
    if (!exists) throw new Error('Wayfinder SKILL.md hittades inte');
    const content = fs.readFileSync(skillPath, 'utf8');
    const hasFrontmatter = content.includes('name: wayfinder') && content.includes('description:');
    const hasBeslut = content.includes('Besluts-tickets');
    results.push({
      name: 'Wayfinder skill manifest finns med giltigt YAML-frontmatter och regler',
      passed: exists && hasFrontmatter && hasBeslut,
    });
  } catch (err: any) {
    results.push({
      name: 'Wayfinder skill manifest finns med giltigt YAML-frontmatter och regler',
      passed: false,
      error: err.message,
    });
  }

  // Test 2: README.md innehåller uppdaterade pnpm-kommandon och SI v10.0-rutiner
  try {
    const readmePath = path.join(rootDir, 'README.md');
    const content = fs.readFileSync(readmePath, 'utf8');
    const hasPnpmPlanera = content.includes('pnpm planera');
    const hasPnpmGenomfor = content.includes('pnpm genomfor');
    const hasTokenGate = content.includes('Token Gate');
    const hasWayfinder = content.includes('/wayfinder');
    results.push({
      name: 'README.md dokumenterar pnpm-skript, Token Gate och Wayfinder-integrering',
      passed: hasPnpmPlanera && hasPnpmGenomfor && hasTokenGate && hasWayfinder,
    });
  } catch (err: any) {
    results.push({
      name: 'README.md dokumenterar pnpm-skript, Token Gate och Wayfinder-integrering',
      passed: false,
      error: err.message,
    });
  }

  // Test 3: Token Gate godkännande är etablerat i APPROVAL.md
  try {
    const approvalPath = path.join(rootDir, 'doc', 'LAST_CYCLE', 'APPROVAL.md');
    const exists = fs.existsSync(approvalPath);
    if (!exists) throw new Error('APPROVAL.md saknas');
    const content = fs.readFileSync(approvalPath, 'utf8');
    const hasToken = content.includes('WAYFINDER-README-TCK004-TOKEN');
    results.push({
      name: 'Token Gate godkännande verifierat i APPROVAL.md',
      passed: exists && hasToken,
    });
  } catch (err: any) {
    results.push({
      name: 'Token Gate godkännande verifierat i APPROVAL.md',
      passed: false,
      error: err.message,
    });
  }

  return results;
}
