# TCK-MAINT-076: Slutför Strangler Fig — tunn run-planera-live.ts (< 220 rader), 250-raderstak i sizeGate.js, scriptKind-AST-spärr i fas2Tooling.ts och esbuild över scripts/lib/*.ts

**Måldomän:** `scripts`
**Målfiler:** `scripts/run-planera-live.ts`, `scripts/lib/sizeGate.js`, `scripts/lib/fas2Tooling.ts`, `scripts/lib/maintValidation.ts`
**Förutsättning:** `TCK-MAINT-077` måste vara `VERIFIED`.
**Mekanisk Acceptans:**
1. `scripts/run-planera-live.ts` (**strikt < 220 rader**, skrivs om rent med `save_code`) agerar tunn CLI-orkestrerare som importerar `exekveraFas1Sweep` (`./lib/fas1Sweep.js`), `korFas2Loop` (`./lib/fas2Loop.js`), `codegenTools` + `createFas2ToolExecutor` + `isFas2Complete` + `getFas2FollowupPrompt` (`./lib/fas2Tooling.js`), `konsolideraTest` + `synkaDomanBarrel` + `uppdateraFeatureIndex` + `uppdateraBiljettstatus` + `hanteraTrepunktsbesiktning` + `genomforGitCommitPush` + `saneraSkordadLegacy` (`./lib/fas3Consolidation.js`), `hanteraKonstruktivKritik` (`./lib/critiqueTriage.js`), `createVerifiedScriptsBackup` + `restoreScriptsBackup` + `dumpCrashDiff` (`./lib/shellAndBackup.js`), nollställer omvändelseräknaren (`--omvandelse=0`) före `--kritik-iter=1` och anropar `dumpCrashDiff()` i `main().catch`.
2. `scripts/lib/sizeGate.js` (< 95 rader, **100 % ren JavaScript utan TypeScript-typer som `: string` eller `: number`**) ändrar `LEGACY_SCRIPT_CAPS` till `{ 'bidiLiveRunner.ts': 345 }` (tar enbart bort `'run-planera-live.ts': 1000` så att **250 rader** gäller för `run-planera-live.ts` och alla nya moduler, medan `bidiLiveRunner.ts` på 341 rader fortsätter passera), och hoppar över `__tests__` och `.legacy.` i `validateCodebaseLineLimits(rootDir)`.
3. `scripts/lib/fas2Tooling.ts` (< 245 rader) exporterar `export interface CrashDumpPayload { [key: string]: any; }`, avvisar `save_code` om målfilen redan existerar på disk (`if (fs.existsSync(full)) throw new Error(...)`), aktiverar `reportDiagnostics: true, allowJs: true` samt `scriptKind: rel.endsWith('.js') ? ts.ScriptKind.JS : rel.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS` i `ts.transpileModule` (så att TypeScript-syntax i `.js`-filer stoppas före skrivning) samt avvisar **duplicerade exporter** i samma fil via TypeScript AST (`ts.createSourceFile`) före skrivning.
4. `scripts/lib/maintValidation.ts` (< 80 rader) uppdaterar `esbuild`-kommandot till `npx esbuild scripts/run-planera-live.ts scripts/run-path.ts scripts/lib/*.ts --bundle --platform=node --format=esm --packages=external --outdir=/tmp/outreach-script-check`.
5. `pnpm verify` passerar med exit 0.

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **Ren JavaScript i `sizeGate.js` & rör ALDRIG `scripts/bidiLiveRunner.ts`:**
   - `scripts/lib/sizeGate.js` körs direkt av `node` utan `tsx` och får aldrig innehålla `: string` eller `: number`. Behåll `'bidiLiveRunner.ts': 345` i `LEGACY_SCRIPT_CAPS`.
