# BYGGCYKEL LOGG: TCK-MAINT-073
**Starttid:** 2026-11-14T21:09:57.353Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
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

```


#### 1a Att följa: Intention & Nytta
Hej! Jag förstår att intentionen med TCK-MAINT-073 är att stärka systemets resiliens genom att bygga ut felhanteringen och fullborda stegen i planeringssvepet, vilket ger oss en tryggare och mer självgående utvecklingsprocess. Stämmer det?


#### 0a Att vända om: Kontraktsaudit
Kontraktsauditen för TCK-MAINT-073 är genomförd och godkänd. Ramarna är tydliga: vi håller strikt till de tre målfilerna inom `scripts/lib`, beaktar fil- och radgränserna och säkerställer att inga obehöriga filer berörs. Kontraktet är redo för det fortsatta arbetet.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
För TCK-MAINT-073 formulerar jag följande tre ortogonala alternativ:

Alternativ 1 är Monolitisk orkestrering, där vi behåller en sekventiell struktur och utför all validering och felhantering direkt internt i modulerna.

Alternativ 2 fokuserar på en Servicebaserad recovery, där vi extraherar all återhämtnings- och valideringslogik till rena, tillståndslösa funktionsbibliotek.

Alternativ 3 är ett Tillståndsstyrt loopmönster, som använder explicita kontrollpunkter och tillståndsväxlingar efter varje körningsfas för att garantera atomära omstarter.


#### 2c Att vända om: Resiliensgranskning
Alternativ 1 ökar risken för kaskadfel på grund av tättkopplad logik. Alternativ 2 är mest resilient, då extraherad återhämtningslogik isolerar felen och möjliggör atomära omstarter utan att kompromissa med modulgränserna.


#### 2d Att förlikas: Mättnad
Vi slår fast att Alternativ 2 är det vinnande alternativet, då dess extraherade återhämtningslogik ger den högsta resiliensen och bäst isolerar felen. Vi deklarerar härmed MÄTTNAD: JA.
