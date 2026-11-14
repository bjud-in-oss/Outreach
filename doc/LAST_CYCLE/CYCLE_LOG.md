# BYGGCYKEL LOGG: TCK-MAINT-079
**Starttid:** 2026-11-14T22:58:56.870Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-MAINT-079: Koppla extractErrorSignature, asynkron diagnostiseraRotOrsak & recovery-loopar i fas2Recovery.ts och fas2Loop.ts

**Måldomän:** `scripts`
**Målfiler:** `scripts/lib/fas2Recovery.ts`, `scripts/lib/fas2Loop.ts`
**Förutsättning:** `TCK-MAINT-078` måste vara `VERIFIED`.
**Mekanisk Acceptans:**
1. `scripts/lib/fas2Recovery.ts` (< 215 rader) använder `extractErrorSignature` från `./ticketAndAnchor.js` för framstegsspärren, anropar den asynkrona `diagnostiseraRotOrsak` från `./channelRunner.js` (med automatisk inläsning av externa felande filer som nämns i felloggen), och anropar `planContextBatches(files, errorLog)` & `buildCrashDumpPayload(data)` från `./contextBatcher.js` med korrekta argumentsignaturer samt nollställer omvändelseräknaren till `0` vid lyckat bygge.
2. `scripts/lib/fas2Loop.ts` (< 175 rader) behåller `planContextBatches`-förpackningen av befintliga målfiler (max `24 000` tecken) och kopplar in `korMaintValidering` (när `isMaint`) samt den 3-försöks Vitest + Gate 2c + `hanteraFas2TestFel`-återhämtningsloopen (när `!isMaint`).
3. `pnpm verify` passerar med exit 0.

```


#### 1a Att följa: Intention & Nytta
Hallå! Jag sätter mig in i intentionen med TCK-MAINT-079 för att säkerställa att vi bygger rätt sorts stabilitet. Berätta kort om din största utmaning med dagens felhantering och vad ni hoppas uppnå med den här kopplingen.


#### 0a Att vända om: Kontraktsaudit
Den största utmaningen idag är att felhanteringen kan vara för reaktiv och ytlig, vilket gör det svårt att bryta negativa loopar. Med den här kopplingen hoppas vi uppnå en djupare, asynkron diagnostik som verkligen hittar grundorsaken och ger stabila återhämtningsvägar. Jag har auditerat kontrakten och bekräftar att gränserna i fas 2 Recovery och Loop följer direktiven.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
För att lösa TCK-MAINT-079 och koppla samman felhanteringen i fas2Recovery och fas2Loop ser jag tre ortogonala alternativ för lösning.

Alternativ ett är Centraliserad asynkron orkestrering. Här låter vi fas2Recovery hantera sekventiella anrop för extraktion, diagnos och paketering direkt i flödet, och uppdaterar ställt tillstånd per steg.

Alternativ två är en händelsestyrd återhämtningskö. Då registrerar fas2Recovery diagnosuppgifter i en kö som exekveras asynkront för att minska blockering i huvudflödet.

Alternativ tre är en funktionell fas-strategi. Här separerar vi loopvarianterna i specialiserade moduler, så att fas2Recovery bara fungerar som en ren coordinator som väljer rätt strategi baserat på testresultatet.


#### 2c Att vända om: Resiliensgranskning
Alternativ ett ger bäst transparens vid fel, då alla beroenden är låsta. Alternativ två riskerar dolda köfel och komplex state-hantering. Alternativ tre kan skapa onödig indirektion. Jag rekommenderar att vi väljer alternativ ett för att garantera att framstegsspärren fungerar deterministiskt.


#### 2d Att förlikas: Mättnad
Jag fastställer att Alternativ 1 är det vinnande alternativet. Det garanterar transparens och en deterministisk framstegsspärr utan risk för dolda köfel. MÄTTNAD: JA.
