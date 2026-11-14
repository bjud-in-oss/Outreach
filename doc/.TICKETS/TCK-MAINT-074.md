# TCK-MAINT-074: Slutför Strangler Fig — tunn run-planera-live.ts (< 220 rader), 250-raderstak över scripts/ + src/features/ och AST-spärrar

**Måldomän:** `scripts`
**Målfiler:** `scripts/run-planera-live.ts`, `scripts/lib/sizeGate.js`, `scripts/lib/fas2Tooling.ts`, `scripts/__tests__/scriptLibs.test.ts`
**Förutsättning:** `TCK-MAINT-073` måste vara `VERIFIED`.
**Mekanisk Acceptans:**
1. `scripts/run-planera-live.ts` (**strikt < 220 rader**, skrivs om rent med `save_code`) agerar tunn CLI-orkestrerare som importerar `exekveraFas1Sweep` (`./lib/fas1Sweep.js`), `korFas2Loop` (`./lib/fas2Loop.js`), `codegenTools` + `createFas2ToolExecutor` + `isFas2Complete` + `getFas2FollowupPrompt` (`./lib/fas2Tooling.js`), `konsolideraTest` + `synkaDomanBarrel` + `uppdateraFeatureIndex` + `uppdateraBiljettstatus` + `hanteraTrepunktsbesiktning` + `genomforGitCommitPush` + `saneraSkordadLegacy` (`./lib/fas3Consolidation.js`), `hanteraKonstruktivKritik` (`./lib/critiqueTriage.js`), nollställer omvändelseräknaren före `--kritik-iter=1` och anropar `dumpCrashDiff()` i `main().catch`.
2. `scripts/lib/sizeGate.js` (< 95 rader) tar bort `'run-planera-live.ts': 1000` ur `LEGACY_SCRIPT_CAPS` och `getLineLimitForFile` så att **250 rader** gäller universellt för alla `.ts`/`.js`-moduler (utöver legacy `bidiLiveRunner.ts` 345 och `sessionIntentAudio.ts` 300), och låter `validateCodebaseLineLimits(rootDir)` skanna **både `scripts/` och `src/features/`** (exklusive `__tests__`, `node_modules` och `.legacy.`).
3. `scripts/lib/fas2Tooling.ts` (< 235 rader) avvisar `save_code` om målfilen redan existerar på disk (`if (fs.existsSync(full)) throw new Error(...)`), aktiverar `reportDiagnostics: true, allowJs: true` i `ts.transpileModule` samt avvisar **duplicerade exporter** i samma fil via TypeScript AST (`ts.createSourceFile`) före skrivning.
4. `scripts/__tests__/scriptLibs.test.ts` (< 120 rader) lägger till ett **negativt beteendetest** i `os.tmpdir()` som skapar en 260-raders `.ts`-fil under en temporär `scripts/`-katalog och bevisar att `validateCodebaseLineLimits(tmpDir)` returnerar `1`.
5. `pnpm verify` passerar med exit 0.
