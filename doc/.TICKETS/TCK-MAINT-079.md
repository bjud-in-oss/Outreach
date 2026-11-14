# TCK-MAINT-079: Koppla extractErrorSignature, asynkron diagnostiseraRotOrsak, ADR-019 Fail-First-generering & recovery-loopar i fas2Recovery.ts och fas2Loop.ts

**Måldomän:** `scripts`
**Målfiler:** `scripts/lib/fas2Recovery.ts`, `scripts/lib/fas2Loop.ts`
**Förutsättning:** `TCK-MAINT-078` måste vara `VERIFIED`.
**Mekanisk Acceptans:**
1. `scripts/lib/fas2Recovery.ts` (< 215 rader) tar bort sin lokala stubb `diagnostiseraRotOrsak`, importerar i stället `extractErrorSignature` från `./ticketAndAnchor.js` och den asynkrona `diagnostiseraRotOrsak` från `./channelRunner.js`, läser automatiskt in eventuella externa felande filer som nämns i felloggen, anropar `planContextBatches(files, errorLog)` & `buildCrashDumpPayload(data)` från `./contextBatcher.js` med korrekta argumentsignaturer samt nollställer omvändelseräknaren till `0` vid lyckat bygge.
2. `scripts/lib/fas2Loop.ts` (< 215 rader):
   - Bygger `enrichedFas2Anchor` (med befintliga målfiler förpackade via `planContextBatches`, max `24 000` tecken) **högst upp** i `korFas2Loop` så att både testgenereringen och källkodsexekveringen har befintliga typer/scheman i startankaret.
   - När `!isMaint`: om `transientTestFullPath` inte existerar på disk, kör först en `Att följa`-mikrokanal med ett verktygswrapper `executeTestOnlyTools` som **enbart tillåter skrivning (`save_code`/`apply_patch`) till `transientTestFile`** (avvisar alla andra skrivningar enligt `ADR-019`), med `maxTurns: 5` och **`onMutationCheck: () => fs.existsSync(transientTestFullPath)`** (samt `getFollowupPrompt` som uppmanar till omedelbar `save_code` av `transientTestFile` med relativa importer `../features/${targetDomain}/...`).
   - Kör därefter Gate 3a (`node scripts/drivers/ts.js --check-alibi --file ${transientTestFile}`, där återhämtningsloopen också använder `executeTestOnlyTools` och `onMutationCheck`) följt av röd Fail-First (`npx vitest run ${transientTestFile}`).
   - Kör därefter källkodsändringarna (`maxTurns: 8`, `onMutationCheck: isFas2Complete`) samt (efter källkodsändringarna) den 3-försöks Vitest + Gate 2c + `hanteraFas2TestFel`-återhämtningsloopen (när `!isMaint`) eller `korMaintValidering` (när `isMaint`).
3. `pnpm verify` passerar med exit 0.
