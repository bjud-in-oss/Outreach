# BYGGCYKEL LOGG: TCK-MAINT-079
**Starttid:** 2026-11-14T23:14:46.202Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
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

```


#### 1a Att följa: Intention & Nytta
Hej! Jag har förstått din avsikt med TCK-MAINT-079. Uppdraget handlar om att stärka systemets resiliens och felhantering genom att koppla samman rätt diagnostikverktyg och säkerställa att testerna genereras och körs enligt våra rutiner. Det i sin tur bygger en tryggare utvecklingsmiljö. Är du redo för att vi går vidare?


#### 0a Att vända om: Kontraktsaudit
Kontraktsaudit genomförd. Måldomänen scripts isoleras, och vi uppfyller kraven för destruktiv sanering.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
Vi har tre ortogonala alternativ för att lösa detta.

Det första alternativet är direkt integration och procedurell återhämtning: vi integrerar feldiagnostiken direkt i modulerna och kör testgenereringen sekventiellt i loopen.

Det andra alternativet fokuserar på delegerad diagnostik och fabriksbaserad testgenerering: vi flyttar analysen till externa tjänster och använder en specifik modul för att säkerställa att testfilen är korrekt etablerad innan testcykeln startar.

Det tredje alternativet är ett händelsestyrt system och isolerade återhämtningskrokar, där felaktiga tillstånd hanteras asynkront och orkestrerar cykelns respons.


#### 2c Att vända om: Resiliensgranskning
Alternativen har olika riskprofiler för resiliens. Det första alternativet är för tätt kopplat och riskerar dominoeffekter. Det tredje alternativet är händelsestyrt, vilket är bra men kan komplicera loopen i onödan. Det andra alternativet erbjuder bäst isolering och direkt stöd för ADR-019, vilket stärker resiliensen mot latenta fel.


#### 2d Att förlikas: Mättnad
Vi slår fast att det andra alternativet är det vinnande valet, då det ger bäst isolering och stödjer ADR-019 för starkare resiliens. MÄTTNAD: JA.
