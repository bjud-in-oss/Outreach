# TCK-MAINT-076: Slutför Strangler Fig — tunn run-planera-live.ts (< 220 rader), 250-raderstak i sizeGate.js, AST-spärrar i fas2Tooling.ts och esbuild över scripts/lib/*.ts

**Måldomän:** `scripts`
**Målfiler:** `scripts/run-planera-live.ts`, `scripts/lib/sizeGate.js`, `scripts/lib/fas2Tooling.ts`, `scripts/lib/maintValidation.ts`
**Förutsättning:** `TCK-MAINT-077` måste vara `VERIFIED`.
**Mekanisk Acceptans:**
1. `scripts/run-planera-live.ts` (**strikt < 220 rader**, skrivs om rent med `save_code`) agerar tunn CLI-orkestrerare som importerar `exekveraFas1Sweep` (`./lib/fas1Sweep.js`), `korFas2Loop` (`./lib/fas2Loop.js`), `codegenTools` + `createFas2ToolExecutor` + `isFas2Complete` + `getFas2FollowupPrompt` (`./lib/fas2Tooling.js`), `konsolideraTest` + `synkaDomanBarrel` + `uppdateraFeatureIndex` + `uppdateraBiljettstatus` + `hanteraTrepunktsbesiktning` + `genomforGitCommitPush` + `saneraSkordadLegacy` (`./lib/fas3Consolidation.js`), `hanteraKonstruktivKritik` (`./lib/critiqueTriage.js`), nollställer omvändelseräknaren före `--kritik-iter=1` och anropar `dumpCrashDiff()` i `main().catch`.
2. `scripts/lib/sizeGate.js` (< 95 rader) tar bort `'run-planera-live.ts': 1000` ur `LEGACY_SCRIPT_CAPS` och `getLineLimitForFile` så att **250 rader** gäller universellt för alla `.ts`/`.js`-moduler (utöver legacy `bidiLiveRunner.ts` 345 och `sessionIntentAudio.ts` 300), och hoppar över `__tests__` och `.legacy.` i `validateCodebaseLineLimits(rootDir)`.
3. `scripts/lib/fas2Tooling.ts` (< 240 rader) avvisar `save_code` om målfilen redan existerar på disk (`if (fs.existsSync(full)) throw new Error(...)`), aktiverar `reportDiagnostics: true, allowJs: true` i `ts.transpileModule` samt avvisar **duplicerade exporter** i samma fil via TypeScript AST (`ts.createSourceFile`) före skrivning.
4. `scripts/lib/maintValidation.ts` (< 80 rader) uppdaterar `esbuild`-kommandot till `npx esbuild scripts/run-planera-live.ts scripts/run-path.ts scripts/lib/*.ts --bundle --platform=node --format=esm --packages=external --outdir=/tmp/outreach-script-check`.
5. `pnpm verify` passerar med exit 0.
