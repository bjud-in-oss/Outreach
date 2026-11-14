# TCK-MAINT-068: Modulär critiqueTriage.ts med auto-initierad Papperskorg och fullständig s-diff/städning i fas3Consolidation.ts

**Måldomän:** `scripts`
**Målfiler:** `scripts/lib/critiqueTriage.ts`, `scripts/__tests__/scriptLibs.test.ts`, `scripts/lib/fas3Consolidation.ts`
**Mekanisk Acceptans:**
1. Ny modul `scripts/lib/critiqueTriage.ts` (< 145 rader) exporterar `omprioriteraBatchForbattringar(improvementsPath, obsoletePatterns?)` (auto-initierar rubriker `## 2.`, `## 3.`, `## 4.`, **tömmer `## 4. Papperskorg` allra först**, flyttar inaktuella poster dit och sorterar aktiva poster `HOG -> MEDEL -> LAG`) och `hanteraKonstruktivKritik`.
2. `scripts/__tests__/scriptLibs.test.ts` (< 165 rader) lägger till enhetstest i `os.tmpdir()` för `omprioriteraBatchForbattringar`.
3. `scripts/lib/fas3Consolidation.ts` (< 200 rader) kör `execSync('git add -N src/ scripts/ 2>/dev/null || true', { cwd: ROOT_DIR })` före `git diff` i `hanteraTrepunktsbesiktning`, och i `s`-grenen kör `execSync('git reset HEAD -- src/ scripts/ 2>/dev/null || true && git checkout -- src/ scripts/ package.json vite.config.ts 2>/dev/null || true && git clean -fd src/ scripts/', { cwd: ROOT_DIR })`.
4. `uppdateraBiljettstatus` i `scripts/lib/fas3Consolidation.ts` ersätter både `[ ] **${ticketId}** (READY)` och `[ ] **${ticketId}**` så att statusraden blir rent `[x] **${ticketId}** (VERIFIED)` utan kvardröjande `(READY)`.
5. `pnpm verify` passerar med exit 0.
