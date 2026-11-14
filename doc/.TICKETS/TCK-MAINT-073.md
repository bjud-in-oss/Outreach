# TCK-MAINT-073: Slutför fas1Sweep.ts (återanvänd runMicroChannel 750ms + Steg 3a–3c), skapa fas2Recovery.ts och aktivera isFas2Complete-spärr i fas2Loop.ts

**Måldomän:** `scripts`
**Målfiler:** `scripts/lib/fas1Sweep.ts`, `scripts/lib/fas2Recovery.ts`, `scripts/lib/fas2Loop.ts`
**Mekanisk Acceptans:**
1. `scripts/lib/fas1Sweep.ts` (< 210 rader) tar bort den duplicerade 48-raders `runMicroChannel` (400 ms) och återanvänder/re-exporterar i stället `runMicroChannel` (750 ms) från `./channelRunner.js`, samt utökar `exekveraFas1Sweep` med `getCompactTicketWindow`, `validateTicketScope` och (när `!isMaint`) Steg `3a` (transient test), `3b` (källkodsspecifikation) och `3c` (slutgiltigt byggkontrakt).
2. Ny modul `scripts/lib/fas2Recovery.ts` (< 225 rader) exporterar `korMaintValidering` (kör `npx tsx scripts/lib/maintValidation.ts` upp till 4 försök med `diagnostiseraRotOrsak`, kompakta `## ADR-`-rubriker ur `doc/DECISIONS.md` och framstegsspärr) samt `hanteraFas2TestFel` (kör Gate 2c + Vitest upp till 3 inre försök och upp till 4 yttre omvändelser med `selectRelevantRetryFiles`, `planContextBatches` (`pass1`/`pass2`) och `buildCrashDumpPayload`, samt nollställer omvändelseräknaren till `0` när ett bygge lyckats).
3. `scripts/lib/fas2Loop.ts` (< 180 rader) exporterar `korFas2Loop` med `maxTurns: 8`, ovillkorlig `if (!isFas2Complete()) { console.error('❌ FAS 2 MISSLYCKADES: Samtliga målfiler uppdaterades inte.'); process.exit(1); }` (gäller både `TCK` och `MAINT`, samt efter självrättning) och delegerar validering/felhantering till `fas2Recovery.ts`.
4. `pnpm verify` passerar med exit 0.

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **Kirurgisk 3-filsbiljett (rör INTE `run-planera-live.ts` här):**
   - Håll varje modul under 225 rader så att `TCK-MAINT-074` kan koppla ihop dem i nästa steg.
