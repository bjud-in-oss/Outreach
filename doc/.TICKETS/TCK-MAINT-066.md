# TCK-MAINT-066: Delegerad maintValidation.ts (färsk barnprocess), smart extractCuratedRange-trunkering i buildRetryAnchor och verifierad backup

**Måldomän:** `scripts`
**Målfiler:** `scripts/lib/maintValidation.ts`, `scripts/lib/ticketAndAnchor.ts`, `scripts/lib/shellAndBackup.ts`, `scripts/run-planera-live.ts`
**Mekanisk Acceptans:**
1. Ny modul `scripts/lib/maintValidation.ts` (< 110 rader) bryter ut `MAINT`-valideringen (`verify-architecture.js`, `vitest run scripts/__tests__/`, `pnpm test`, `esbuild` och `tsc -p scripts/tsconfig.json --noEmit`) så att den alltid exekveras som en **färsk barnprocess** efter Fas 2 (aldrig stale kod i V8-minnet) och är så kompakt att den aldrig trunkeras vid självrättning.
2. `scripts/lib/ticketAndAnchor.ts` (< 195 rader) uppgraderar `buildRetryAnchor` till att använda befintliga `extractCuratedRange(content, startLine, endLine)` runt de felrader som nämns i `testLog` (samt filens nedersta 160 rader om inga specifika radnummer matchar) i stället för blind `.slice(0, ...)` som amputerar slutet av stora filer.
3. `scripts/lib/shellAndBackup.ts` (< 115 rader):
   - Exporterar `createVerifiedScriptsBackup()`: rensar ospårade filer (`git reset HEAD -- src/ scripts/ 2>/dev/null || true && git clean -fd src/ scripts/`) och validerar `verify-architecture.js` + `esbuild` *innan* `scripts/` kopieras till `doc/LAST_CYCLE/scripts_backup/`.
   - Utökar `restoreScriptsBackup()` med `git reset HEAD` + `git clean -fd src/ scripts/` och kapar `execCaptured`-terminalutdata till max 25 rader (full logg i `doc/LAST_CYCLE/LAST_ERROR.log`).
4. `scripts/run-planera-live.ts` (< 910 rader) anropar `createVerifiedScriptsBackup()`, delegerar `MAINT`-valideringen till `npx tsx scripts/lib/maintValidation.ts`, begränsar `MAINT`-självrättningens `filesToInclude` till `getRequiredFiles()` och filtrerar `currentSig` ur faktiska `❌`/`FAIL`/`Error:`/`error TS`/`RADGRÄNSBROTT`-rader.
5. `pnpm verify` passerar med exit 0.
