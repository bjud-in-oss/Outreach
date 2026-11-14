import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

function runCheck(command: string, name: string) {
  console.log(`\n🔍 [MAINT]: Kör ${name}...`);
  try {
    execSync(command, { stdio: 'pipe', cwd: process.cwd(), encoding: 'utf-8' });
  } catch (err: any) {
    const output = err.stdout || '';
    const stderr = err.stderr || '';
    const fullLog = output + stderr;
    
    console.error(`❌ [MAINT]: ${name} fallerade.`);
    
    const errorPatterns = /Error|FAIL|Transform failed|SyntaxError|TypeError|AssertionError|error TS|RADGRÄNSBROTT|✘|File:/;
    const lines = fullLog.split('\n');
    let importantLines: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      if (errorPatterns.test(lines[i])) {
        const start = Math.max(0, i - 3);
        const end = Math.min(lines.length - 1, i + 3);
        for (let j = start; j <= end; j++) {
          if (!importantLines.includes(lines[j])) {
            importantLines.push(lines[j]);
          }
        }
      }
    }
    
    const truncatedImportant = importantLines.slice(0, 25);
    
    if (truncatedImportant.length > 0) {
      console.error('\n--- RELEVANTA FELUTSKRIFTER (ÖVERST) ---');
      console.error(truncatedImportant.join('\n'));
      console.error('----------------------------------------\n');
    }
    
    console.error('--- FULLSTÄNDIG UTGÅNG ---');
    console.error(fullLog);
    console.error('--------------------------');
    
    process.exit(1);
  }
}

async function main() {
  // 1. Arkitekturkontroll
  runCheck('node scripts/verify-architecture.js', 'arkitekturkontroll');

  // 2. Skripttester
  runCheck('npx vitest run scripts/__tests__/', 'skripttester');

  // 3. Regressionssvit
  runCheck('pnpm test', 'full regressionssvit');

  // 4. Esbuild
  runCheck('npx esbuild scripts/run-planera-live.ts scripts/run-path.ts --bundle --platform=node --packages=external --outdir=/tmp/outreach-script-check', 'esbuild-buntning');

  // 5. Typkontroll (tsc)
  runCheck('npx tsc -p scripts/tsconfig.json --noEmit 2>&1 | grep "^scripts/" && exit 1 || true', 'typkontroll för signaturfel');

  console.log('\n✅ [MAINT]: Alla lokala skriptkontroller godkända i separat process!');
}

main().catch(err => {
  console.error('\n💥 [MAINT-VALIDERING] Kritiskt fel:', err);
  process.exit(1);
});
