# TCK-MAINT-077: Exportera executeInspection & inspectionTools i channelRunner.ts, rensa dubbletter i fas1Sweep & fas2Recovery och laga import i fas2Loop

**Måldomän:** `scripts`
**Målfiler:** `scripts/lib/channelRunner.ts`, `scripts/lib/fas1Sweep.ts`, `scripts/lib/fas2Recovery.ts`, `scripts/lib/fas2Loop.ts`
**Mekanisk Acceptans:**
1. `scripts/lib/channelRunner.ts` (< 175 rader) exporterar `inspectionTools` (kompletta verktygsdeklarationsobjekt med `name`, `behavior: 'NON_BLOCKING'`, `description` och `parameters` för `read_file` och `list_files` — INTE en strängarray) samt `executeInspection(name, args)`.
2. `scripts/lib/fas1Sweep.ts` (< 185 rader, skrivs om rent med `save_code` utan dubbletter) exporterar `export { runMicroChannel } from './channelRunner.js';` (utan lokal `runMicroChannel`-implementation) och utökar `exekveraFas1Sweep` med `getCompactTicketWindow`, `validateTicketScope` och (när `!isMaint`) Steg `3a` (transient test), `3b` (källkodsspecifikation) och `3c` (slutgiltigt byggkontrakt).
3. `scripts/lib/fas2Recovery.ts` (< 195 rader, skrivs om rent med `save_code` utan dubbletter) tar bort de fyra lokala dubblettfunktionerna (`diagnostiseraRotOrsak`, `buildCrashDumpPayload`, `selectRelevantRetryFiles`, `planContextBatches`), importerar `readFileSync` & `existsSync` från `'fs'`, definierar `RecoveryState` lokalt, använder de importerade funktionerna från `./channelRunner.js`, `./ticketAndAnchor.js` och `./contextBatcher.js` (inklusive kompakta `## ADR-`-rubriker ur `doc/DECISIONS.md`, automatisk inläsning av eventuella externa felande filer som nämns i felloggen, samt loop-nollställning till `0` vid lyckat bygge).
4. `scripts/lib/fas2Loop.ts` (< 105 rader) ändrar `import { execCaptured } from './ticketAndAnchor.js';` till `import { execCaptured } from './shellAndBackup.js';`.
5. `pnpm verify` passerar med exit 0.
