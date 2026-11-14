# TCK-MAINT-071: Bryt ut fas1Sweep.ts, fas2Loop.ts & fas2Recovery.ts och koppla in contextBatcher.ts + diagnostiseraRotOrsak

**Måldomän:** `scripts`
**Målfiler:** `scripts/lib/fas1Sweep.ts`, `scripts/lib/fas2Loop.ts`, `scripts/lib/fas2Recovery.ts`, `scripts/run-planera-live.ts`
**Förutsättning:** `TCK-MAINT-066`–`069` måste vara `VERIFIED`.
**Mekanisk Acceptans:**
1. Ny modul `scripts/lib/fas1Sweep.ts` (< 230 rader) tar över `runMicroChannel`, Fas 0 (`1a`, `0a`, `0b`) och Fas 1 (`1b`–`3c`) från `run-planera-live.ts`, och använder `getCompactTicketWindow` + `validateTicketScope` vid startankaret.
2. Ny modul `scripts/lib/fas2Recovery.ts` (< 220 rader) tar över `MAINT`-valideringsloopen (`maintValidation.ts`) samt Fas 2-självrättningen och den yttre omvändelseloopen (upp till 4 varv), och kopplar in `diagnostiseraRotOrsak` (`./channelRunner.js`), `selectRelevantRetryFiles` (`./ticketAndAnchor.js`) samt `planContextBatches` (`pass1`/`pass2` vid > 24 000 tecken) och `buildCrashDumpPayload` (`./contextBatcher.js`).
3. Ny modul `scripts/lib/fas2Loop.ts` (< 220 rader) tar över Gate 3a / Fail-First och Fas 2-kodgenereringen, återanvänder befintliga `codegenTools` och `createFas2ToolExecutor` ur `./fas2Tooling.js` (tar bort den 155-raders duplicerade koden i `run-planera-live.ts`) och delegerar felhantering till `fas2Recovery.ts`.
4. `scripts/run-planera-live.ts` importerar `synkaDomanBarrel` från `./lib/fas3Consolidation.js` (lagar `ReferenceError` på rad 846) och `hanteraKonstruktivKritik` från `./lib/critiqueTriage.js`, anropar `dumpCrashDiff()` i `main().catch` och delegerar Fas 0–2 till `fas1Sweep.ts` och `fas2Loop.ts`.
5. `pnpm verify` passerar med exit 0.
