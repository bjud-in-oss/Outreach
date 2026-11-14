# BYGGCYKEL LOGG: TCK-MAINT-075
**Starttid:** 2026-11-14T21:21:45.888Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-MAINT-075: Slutför fas1Sweep.ts (Steg 3a–3c + runMicroChannel 750ms), koppla riktiga importer i fas2Recovery.ts och aktivera isFas2Complete i fas2Loop.ts

**Måldomän:** `scripts`
**Målfiler:** `scripts/lib/fas1Sweep.ts`, `scripts/lib/fas2Recovery.ts`, `scripts/lib/fas2Loop.ts`
**Mekanisk Acceptans:**
1. `scripts/lib/fas1Sweep.ts` (< 210 rader) tar bort den duplicerade `runMicroChannel` (`400 ms`) och återanvänder/re-exporterar `runMicroChannel` (`750 ms`) från `./channelRunner.js`, samt utökar `exekveraFas1Sweep` med `getCompactTicketWindow`, `validateTicketScope` och (när `!isMaint`) Steg `3a` (transient test), `3b` (källkodsspecifikation) och `3c` (slutgiltigt byggkontrakt).
2. `scripts/lib/fas2Recovery.ts` (< 225 rader) tar bort sina lokala placeholder-hjälpfunktioner och importerar i stället `diagnostiseraRotOrsak` från `./channelRunner.js`, `selectRelevantRetryFiles` från `./ticketAndAnchor.js`, samt `planContextBatches` och `buildCrashDumpPayload` från `./contextBatcher.js` i `korMaintValidering` (inklusive kompakta `## ADR-`-rubriker ur `doc/DECISIONS.md`) och `hanteraFas2TestFel` (inklusive loop-nollställning till `0` vid lyckat bygge).
3. `scripts/lib/fas2Loop.ts` (< 180 rader) exporterar `korFas2Loop` med `maxTurns: 8`, ovillkorlig `if (!isFas2Complete()) { console.error('❌ FAS 2 MISSLYCKADES: Samtliga målfiler uppdaterades inte.'); process.exit(1); }` (gäller både `TCK` och `MAINT`, samt efter självrättning) och delegerar validering/felhantering till `fas2Recovery.ts`.
4. `pnpm verify` passerar med exit 0.

```


#### 1a Att följa: Intention & Nytta
Syftet med denna uppdatering är att stärka tillförlitligheten i våra underhållsrutiner. Genom att slutföra planeringsstegen och säkerställa en strikt återhämtningsloop, ser vi till att inga ändringar lämnas ofullständiga. Detta ger oss en stabilare grund för systemet och sparar tid för utvecklaren.


#### 0a Att vända om: Kontraktsaudit
Jag har granskat kontraktet och ser att uppdraget håller sig strikt inom domänen för skripten. Jag bekräftar att vi har full kontroll och kan påbörja arbetet enligt gällande riktlinjer.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
För att lösa TCK-MAINT-075 och uppnå acceptanskriterierna formulerar jag här tre ortogonala alternativ.

Alternativ 1 fokuserar på direkt integration där vi ersätter lokal logik i fas1Sweep.ts och fas2Recovery.ts med korrekta importer från channelRunner.js, ticketAndAnchor.js och contextBatcher.js.

Alternativ 2 innebär att vi bryter ut exekveringsstegen till en dedikerad hjälpmodul i scripts-domänen, vilket underlättar linjebegränsningar och separerar orkestreringslogik från de specifika huvudfilerna.

Alternativ 3 använder en konfigurationsdriven approach där testspecifikationer och hanteringsrutiner definieras genom konfigurationsobjekt, vilket maximerar återanvändning mellan TCK och MAINT-arbetsflöden.


#### 2c Att vända om: Resiliensgranskning
Vid en resiliensgranskning av de tre alternativen framstår Alternativ 1 som mest robust. Genom att ersätta lokal logik och platshållare med direkta, exakta importer från etablerade moduler som `channelRunner.js`, minskar vi abstraktionslagren och risken för dolda fel i orkestreringen. Det är direkt kopplat till syftet att bygga feltolerant, utan onödiga abstraktioner.


#### 2d Att förlikas: Mättnad
Vi slår fast att Alternativ 1 är det vinnande kontraktet. Genom att minska abstraktionerna och direktimportera från etablerade moduler bygger vi en mer resilient och feltolerant orkestrering som stöder vårt syfte perfekt. Därmed är mognadskontrollen klar. MÄTTNAD: JA.
