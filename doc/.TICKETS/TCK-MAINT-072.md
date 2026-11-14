# TCK-MAINT-072: Slutför Strangler Fig — banta run-planera-live.ts under 250 rader, full scripts/ + src/features/ skanning i sizeGate.js och negativt beteendetest

**Måldomän:** `scripts`
**Målfiler:** `scripts/run-planera-live.ts`, `scripts/lib/sizeGate.js`, `scripts/lib/fas2Tooling.ts`, `scripts/__tests__/scriptLibs.test.ts`
**Förutsättning:** `TCK-MAINT-071` måste vara `VERIFIED`.
**Mekanisk Acceptans:**
1. `scripts/run-planera-live.ts` (**strikt < 250 rader**) agerar renodlad tunn CLI-orkestrerare (argumentparsning, `VERIFIED`-vakt, startsanering och anrop till `fas1Sweep`, `fas2Loop` och `fas3Consolidation`).
2. `scripts/lib/sizeGate.js` (< 95 rader) tar bort 1000-radersundantaget för `run-planera-live.ts` i `LEGACY_SCRIPT_CAPS` och `getLineLimitForFile` så att **250 rader** gäller som standardtak, och låter `validateCodebaseLineLimits(rootDir)` skanna **både `scripts/` och `src/features/`** (exklusive `__tests__`, `node_modules` och `.legacy.`).
3. `scripts/lib/fas2Tooling.ts` (< 220 rader) avvisar `save_code` om målfilen redan existerar på disk (`if (fs.existsSync(full)) throw new Error(...)`) så att `apply_patch` alltid krävs för befintliga filer.
4. `scripts/__tests__/scriptLibs.test.ts` (< 195 rader) lägger till ett **negativt beteendetest** i `os.tmpdir()` som skapar en 260-raders `.ts`-fil under en temporär `scripts/`-katalog och bevisar att `validateCodebaseLineLimits(tmpDir)` returnerar `1`.
5. `pnpm verify` passerar med exit 0.
