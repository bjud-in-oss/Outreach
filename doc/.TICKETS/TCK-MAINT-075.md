# TCK-MAINT-075: Slutför fas1Sweep.ts (Steg 3a–3c + runMicroChannel 750ms), koppla riktiga importer i fas2Recovery.ts och aktivera isFas2Complete i fas2Loop.ts

**Måldomän:** `scripts`
**Målfiler:** `scripts/lib/fas1Sweep.ts`, `scripts/lib/fas2Recovery.ts`, `scripts/lib/fas2Loop.ts`
**Mekanisk Acceptans:**
1. `scripts/lib/fas1Sweep.ts` (< 210 rader) tar bort den duplicerade `runMicroChannel` (`400 ms`) och återanvänder/re-exporterar `runMicroChannel` (`750 ms`) från `./channelRunner.js`, samt utökar `exekveraFas1Sweep` med `getCompactTicketWindow`, `validateTicketScope` och (när `!isMaint`) Steg `3a` (transient test), `3b` (källkodsspecifikation) och `3c` (slutgiltigt byggkontrakt).
2. `scripts/lib/fas2Recovery.ts` (< 225 rader) tar bort sina lokala placeholder-hjälpfunktioner och importerar i stället `diagnostiseraRotOrsak` från `./channelRunner.js`, `selectRelevantRetryFiles` från `./ticketAndAnchor.js`, samt `planContextBatches` och `buildCrashDumpPayload` från `./contextBatcher.js` i `korMaintValidering` (inklusive kompakta `## ADR-`-rubriker ur `doc/DECISIONS.md`) och `hanteraFas2TestFel` (inklusive loop-nollställning till `0` vid lyckat bygge).
3. `scripts/lib/fas2Loop.ts` (< 180 rader) exporterar `korFas2Loop` med `maxTurns: 8`, ovillkorlig `if (!isFas2Complete()) { console.error('❌ FAS 2 MISSLYCKADES: Samtliga målfiler uppdaterades inte.'); process.exit(1); }` (gäller både `TCK` och `MAINT`, samt efter självrättning) och delegerar validering/felhantering till `fas2Recovery.ts`.
4. `pnpm verify` passerar med exit 0.
