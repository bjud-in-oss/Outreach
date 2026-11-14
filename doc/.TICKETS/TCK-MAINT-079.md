# TCK-MAINT-079: Koppla extractErrorSignature, asynkron diagnostiseraRotOrsak & recovery-loopar i fas2Recovery.ts och fas2Loop.ts

**Måldomän:** `scripts`
**Målfiler:** `scripts/lib/fas2Recovery.ts`, `scripts/lib/fas2Loop.ts`
**Förutsättning:** `TCK-MAINT-078` måste vara `VERIFIED`.
**Mekanisk Acceptans:**
1. `scripts/lib/fas2Recovery.ts` (< 215 rader) använder `extractErrorSignature` från `./ticketAndAnchor.js` för framstegsspärren, anropar den asynkrona `diagnostiseraRotOrsak` från `./channelRunner.js` (med automatisk inläsning av externa felande filer som nämns i felloggen), och anropar `planContextBatches(files, errorLog)` & `buildCrashDumpPayload(data)` från `./contextBatcher.js` med korrekta argumentsignaturer samt nollställer omvändelseräknaren till `0` vid lyckat bygge.
2. `scripts/lib/fas2Loop.ts` (< 175 rader) behåller `planContextBatches`-förpackningen av befintliga målfiler (max `24 000` tecken) och kopplar in `korMaintValidering` (när `isMaint`) samt den 3-försöks Vitest + Gate 2c + `hanteraFas2TestFel`-återhämtningsloopen (när `!isMaint`).
3. `pnpm verify` passerar med exit 0.
