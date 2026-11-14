# TCK-MAINT-079: Koppla extractErrorSignature, asynkron diagnostiseraRotOrsak, ADR-019 Fail-First-generering & recovery-loopar i fas2Recovery.ts och fas2Loop.ts

**Måldomän:** `scripts`
**Målfiler:** `scripts/lib/fas2Recovery.ts`, `scripts/lib/fas2Loop.ts`
**Förutsättning:** `TCK-MAINT-078` måste vara `VERIFIED`.
**Mekanisk Acceptans:**
1. `scripts/lib/fas2Recovery.ts` (< 215 rader) tar bort sin lokala stubb `diagnostiseraRotOrsak`, importerar i stället `extractErrorSignature` från `./ticketAndAnchor.js` och den asynkrona `diagnostiseraRotOrsak` från `./channelRunner.js`, läser automatiskt in eventuella externa felande filer som nämns i felloggen, anropar `planContextBatches(files, errorLog)` & `buildCrashDumpPayload(data)` från `./contextBatcher.js` med korrekta argumentsignaturer samt nollställer omvändelseräknaren till `0` vid lyckat bygge.
2. `scripts/lib/fas2Loop.ts` (< 195 rader):
   - När `!isMaint`: kör först en `Att följa`-mikrokanal med verktyg låsta till **enbart `transientTestFile`** (avvisar skrivning till `src/features/` enligt `ADR-019`) så att `transientTestFile` faktiskt existerar på disk med relativa importer `../features/${targetDomain}/...` **innan** Gate 3a (`ts.js --check-alibi`) och röd Fail-First (`npx vitest run ${transientTestFile}`) verifieras.
   - Behåller `planContextBatches`-förpackningen av befintliga målfiler (max `24 000` tecken), `maxTurns: 8` och ovillkorlig `isFas2Complete()`-spärr.
   - Kopplar in `korMaintValidering` (när `isMaint`) samt den 3-försöks Vitest + Gate 2c + `hanteraFas2TestFel`-återhämtningsloopen (när `!isMaint`) efter källkodsändringarna.
3. `pnpm verify` passerar med exit 0.
