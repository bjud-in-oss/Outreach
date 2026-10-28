/**
 * scripts/run-tests.js
 * 
 * OUTREACH COORDINATION ENGINE (v10.4)
 * Renodlad regressionsmotor: Delegerar helt till deklarativ vitest.config.ts.
 */

import { execSync } from 'child_process';

console.log('🧪 [REGRESSIONSSVIT]: Exekverar permanenta domäntester via Vitest...');

try {
  execSync('npx vitest run --passWithNoTests', {
    stdio: 'inherit',
    cwd: process.cwd(),
  });
  console.log('✅ [REGRESSIONSSVIT]: Samtliga domäntester godkända.');
} catch (error) {
  console.error('❌ [REGRESSIONSSVIT]: Minst ett domäntest underkändes.');
  process.exit(1);
}
