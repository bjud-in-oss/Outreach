import { execSync } from 'child_process';
import * as path from 'path';

function runCheck(command: string, name: string) {
  console.log(`\n🔍 [MAINT]: Kör ${name}...`);
  try {
    execSync(command, { stdio: 'inherit', cwd: process.cwd() });
  } catch (err: any) {
    console.error(`❌ [MAINT]: ${name} fallerade.`);
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
