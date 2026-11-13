# BYGGCYKEL LOGG: TCK-MAINT-063
**Starttid:** 2026-11-13T23:15:04.980Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-MAINT-063: AI-prioriterad tvådelad kontextuppdelning, noga urvald trunkering och VERIFIED-vakt

**Måldomän:** `scripts`
**Målfiler:** `scripts/lib/ticketAndAnchor.ts`, `scripts/run-planera-live.ts`, `scripts/__tests__/scriptLibs.test.ts`
**Mekanisk Acceptans:**
1. `scripts/lib/ticketAndAnchor.ts` (< 185 rader — filen har 46 rader i dag) exporterar:
   - `buildSourceManifest(files)` som listar sökväg, radantal och teckenantal för varje källfil.
   - `extractCuratedRange(content, startLine, endLine)` som extraherar ett noga utvalt radintervall med tydlig radnummermarkering när en enskild fil måste beskäras.
   - `planContextBatches(files, errorLog, maxChars, prioritizeFn?)` som:
     * Returnerar **1 samlad batch med 100 % orörd kod (noll trunkering)** när totala teckenantalet ryms inom `maxChars` (`24000`).
     * När totalen överstiger `maxChars`: låter `prioritizeFn(manifest, errorLog)` (med deterministisk fallback) dela upp filerna i **Delkörning 1 (`pass1`)** och **Delkörning 2 (`pass2`)** samt tillämpa `curatedRanges` endast på filer som ensamma spränger budgeten.
   - `buildCrashDumpPayload(data, maxChars = 24000)` som bevarar full `previousTestCode`, `crashDiff`, `errorSignature`, `omvandelseCount` och `priorityPlan` när storleken ryms inom `maxChars`, och enbart använder prioriterad beskärning om gränsen överskrids.
2. `scripts/run-planera-live.ts` (strikt <= 995 rader — filen har 972 rader i dag):
   - Stoppar körningen före Fas 0 om `ticketId` redan står som `[x] **${ticketId}** (VERIFIED)` i `doc/TICKETS.md` (om inte `--force` eller `--omvandelse` skickats med).
   - Använder `planContextBatches` i Fas 2-självrättningen så att AI:n prioriterar upp källorna i två sekventiella delkörningar (`Delkörning 1/2` och `Delkörning 2/2`) när kontexten överstiger `24000` tecken, men kör allt i ett enda pass utan trunkering när det ryms under gränsen.
   - Sparar rik kraschkontext via `buildCrashDumpPayload` och tillåter upp till **2** yttre omvändelser (`--omvandelse=1`, `--omvandelse=2`) med framstegsspärr (`currentSig !== prevErrorSignature`).
3. `scripts/__tests__/scriptLibs.test.ts` (< 130 rader) verifierar med enhetstester att `planContextBatches` behåller allt otrungerat under `maxChars`, delar upp i två prioriterade körningar via AI-prioriteraren över `maxChars`, och att `extractCuratedRange` extraherar exakta radintervall.
4. `pnpm verify` passerar med exit 0.

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **Skydda radtaket i `scripts/run-planera-live.ts` (972 rader i dag, hårt tak 1000 rader i `sizeGate.js`):**
   - Lägg all manifest-, urvals-, batch- och kraschdumpslogik i `scripts/lib/ticketAndAnchor.ts` (46 rader -> ~160 rader, max 250).
   - Håll ändringen i `scripts/run-planera-live.ts` extremt kompakt (<= 20 nettorader, totalt <= 992 rader).
2. **Noll blind trunkering under gränsen:**
   - När `totalChars <= maxChars` får inga rader klippas bort och ingen extra AI-prioriteringsvända köras.

---

## Scenariotriad (Den relationella och systemiska avsikten)

**Scenario: ATT FÖLJA – AI-prioriterad uppdelning i två körningar när kontexten är stor**
  Givet att ett bygge berör flera stora filer som tillsammans överstiger `24 000` tecken
  När `planContextBatches` utvärderar källorna
  Så låter systemet AI:n prioritera vilka källor som körs i Delkörning 1 respektive Delkörning 2 (med noga utvalda radintervall vid behov)
  Vilket ger full skärpa i båda körningarna utan blind teckenkapning.

**Scenario: ATT VÄNDA OM – Noll trunkering under gränsen och framstegsspärr vid loop**
  Givet att kontexten ryms inom `24 000` tecken eller att samma felsignatur upprepas
  När villkoren prövas
  Så bevaras all kod 100 % otrunkerad under gränsen, medan upprepade felsignaturer och redan `VERIFIED` biljetter stoppas omedelbart.

**Scenario: ATT FÖRLIKAS – Grön verifiering inom radgränserna**
  Givet att `ticketAndAnchor.ts`, `run-planera-live.ts` och `scriptLibs.test.ts` är uppdaterade
  När `pnpm verify` körs
  Så passerar arkitekturgrindar, radgränser och hela testsviten med exit 0.

```


#### 1a Att följa: Intention & Nytta
Syftet med detta underhåll är att göra agentens kontexthantering smart och skonsam. Det gynnar oss genom att helt slippa blind trunkering under gränsen och ge oss en prioriterad, tvådelad kontextmatning när materialet är stort. Detta skyddar den kritiska logiken och bibehåller kvaliteten i källkoden.


#### 0a Att vända om: Kontraktsaudit
Kontraktsaudit och premissvalidering genomförd för TCK-MAINT-063. 

Samtliga målfiler och radgränser i `scripts`-domänen är identifierade, och säkerhetsmarginalerna för att undvika blind trunkering under gränsvärdet på 24 000 tecken är helt i linje med systemkraven. Vi är redo att inleda genomförandet.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
Följande tre ortogonala alternativ beskriver olika arkitektoniska tillvägagångssätt för att lösa uppdraget:

Alternativ ett är en tillståndslös manifest- och trunkeringsmodell. Den bygger rent på statisk längdberäkning för att deterministiskt dela upp kontexten i två batcher baserat på filstorlek utan intelligenta mönsteranalyser.

Alternativ två är en heuristikdriven prioriteringsmodell. Den låter modellen analysera filerna för att strategiskt välja ut vilka delar som ska ingå i den första respektive den andra körningen, vilket ger högre relevans vid komplexa debugg-scenarier.

Alternativ tre är en iterativ kraschdump- och framstegsspärrsmodell. Den fokuserar på att bevara historisk kraschkontext men inför hårda låsningar för att förhindra eviga loopar och säkerställa att upprepade fel inte korrumperar nästa exekveringscykel.


#### 2c Att vända om: Resiliensgranskning
Resiliensgranskningen visar att alternativ ett fallerar på nödvändig felhantering då deterministisk delning riskerar att krossa kritiskt sammanhang. Alternativ två saknar den strikta framstegsspärr som krävs för systemisk invarians och loopskydd. Vi måste därför förlita oss på alternativ tre för att garantera kraschkontextens integritet och förhindra skadliga cykler genom de hårda låsen.


#### 2d Att förlikas: Mättnad
Med tanke på analysen står det klart att det tredje alternativet är det enda som garanterar kraschkontextens integritet och förhindrar skadliga cykler. Jag slår därför fast att alternativ tre vinner, och därmed deklarerar jag MÄTTNAD: JA.
