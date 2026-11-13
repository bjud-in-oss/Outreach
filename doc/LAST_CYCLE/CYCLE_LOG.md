# BYGGCYKEL LOGG: TCK-MAINT-064
**Starttid:** 2026-11-13T23:32:45.962Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-MAINT-064: Laga update-tickets.js, 4-stegs självrannsakande omvändelse (TCK + MAINT) och 3-vägs triagering av konstruktiv kritik

**Måldomän:** `scripts`
**Målfiler:** `scripts/update-tickets.js`, `scripts/run-planera-live.ts`, `scripts/__tests__/scriptLibs.test.ts`
**Mekanisk Acceptans:**
1. `scripts/update-tickets.js` (< 75 rader) bevarar `- [ ] **TCK-XXX** (READY)` för obygda biljetter och sätter enbart `[x] **TCK-XXX** (VERIFIED)` om biljetten redan stod som `VERIFIED` i `doc/TICKETS.md` eller matchar `doc/LAST_CYCLE/VERIFY_RECEIPT.json`.
2. `scripts/run-planera-live.ts` (strikt <= 940 rader — bantas först genom att delegera Fas 3-konsolidering och trepunktsbesiktning till `scripts/lib/fas3Consolidation.ts`):
   - Aktiverar den yttre `--omvandelse`-loopen med **upp till 4 yttre försök** (`omvandelseCount < 4`) och framstegsspärr (`currentSig !== prevErrorSignature`) för **både** `TCK` och `TCK-MAINT` (för `MAINT` återställs `scripts/` från `doc/LAST_CYCLE/scripts_backup` före omstarten, och trepunktsbesiktningen `[j/s/n]` körs alltid i Fas 3).
   - Före varje yttre omstart körs en **Meta-Omvändelse** (`Att vända om`) som besvarar *"Varför omvände sig inte den inre slingan under sina 3 försök, och vilken konstruktiv kritik gör stor skillnad?"* och sparar diagnosen i `CRASH_DUMP.json`.
   - Efter grön Fas 2 (`!process.argv.includes('--kritik-iter')`) klassificeras genererad konstruktiv kritik strikt i en av tre bedömningar:
     * `BEDOMNING: STOR_SKILLNAD` -> Loggas i `doc/PROCESS_IMPROVEMENTS.md` och kör **exakt 1 extra förbättringsiteration** (`--kritik-iter=1`), varefter posten rensas från kön.
     * `BEDOMNING: LITEM_BATCH` -> Köas i `doc/PROCESS_IMPROVEMENTS.md` under `## 2. Köade Batch-förbättringar` utan extra iteration nu (och rensas när en `MAINT`-batch betar av den).
     * `BEDOMNING: AVVISAD_FELAKTIG` -> Utförs **aldrig**, utan sparas med kort motivering under `## 3. Avvisade & Vederlagda Förslag` i `doc/PROCESS_IMPROVEMENTS.md`.
3. `scripts/__tests__/scriptLibs.test.ts` (< 145 rader) verifierar att `scripts/update-tickets.js` bevarar `(READY)` för obygda biljetter.
4. `pnpm verify` passerar med exit 0.

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **Håll `scripts/run-planera-live.ts` strikt under 940 rader (max 1000 i `sizeGate.js`):**
   - Importera `konsolideraTest`, `uppdateraFeatureIndex`, `uppdateraBiljettstatus`, `hanteraTrepunktsbesiktning` och `genomforGitCommitPush` från `'./lib/fas3Consolidation.js'` och ersätt den duplicerade koden i Fas 3 (rad 829–965) så frigörs ~115 rader.
2. **Ingen oändlig meta-loop och ren erfarenhetsbank:**
   - Flaggan `--kritik-iter=1` garanterar att en `STOR_SKILLNAD`-iteration körs **högst en gång** per cykel.
   - Behåll högst de 10 senaste raderna under `## 3. Avvisade & Vederlagda Förslag` vid skrivning till `doc/PROCESS_IMPROVEMENTS.md` så att filen hålls mager.

---

## Scenariotriad (Den relationella och systemiska avsikten)

**Scenario: ATT FÖLJA – Stora förbättringar körs direkt, små batchas och felaktiga avvisas**
  Givet att en byggcykel genererar konstruktiv kritik i Fas 3
  När kritiken bedöms som `STOR_SKILLNAD`, `LITEM_BATCH` eller `AVVISAD_FELAKTIG`
  Så körs enbart `STOR_SKILLNAD` direkt (1 iteration), `LITEM_BATCH` köas för batch-städning och `AVVISAD_FELAKTIG` loggas som vederlagd utan att utföras.

**Scenario: ATT VÄNDA OM – 4-stegs självrannsakande yttre omvändelse och säker READY-status**
  Givet att den inre Fas 2-loopen fallerar 3 gånger (i `TCK` eller `TCK-MAINT`) eller att en ny biljett registreras
  När yttre omvändelsen (upp till 4 varv med framstegsspärr) eller `update-tickets.js` körs
  Så analyseras orsaken till att den inre slingan fastnade, medan obygda biljetter behåller `READY`.

**Scenario: ATT FÖRLIKAS – Grön verifiering i hela repot**
  Givet att `update-tickets.js`, `run-planera-live.ts` och `scriptLibs.test.ts` är uppdaterade
  När `pnpm verify` körs
  Så passerar arkitekturgrindar, radgränser och samtliga tester med exit 0.

```


#### 1a Att följa: Intention & Nytta
Jag förstår uppdraget helt. Syftet är att stabilisera och förbättra våra skript för hantering av biljetter samt införa en starkare självrannsakande omvändelseprocess. Vi ska se till att bra förbättringar prioriteras, att mindre förslag sparas, samt att felaktiga val sorteras bort. Det kommer att göra våra cykler mer robusta och lärorika.


#### 0a Att vända om: Kontraktsaudit
Kontraktsaudit slutförd. Uppdraget omfattar skriptdomänen, håller sig inom en FSD-domän och följer kraven på destruktiv sanering. Vi är redo att gå vidare till planeringssvepet.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
De tre ortogonala alternativen för den här lösningen är: Alternativ ett, in-band loophantering med direkt delegering av fas tre för att behålla den procedurbaserade strukturen men minska filstorleken. Alternativ två, en kontrollbaserad omvändelsekontroller som extraherar looplogik till en separat modul för striktare separationsprincip. Och alternatif tre, en pipelinebaserad tillståndsmaskin med JSON-baserade audit-gränssnitt för maximal resiliens vid yttre omstarter.


#### 2c Att vända om: Resiliensgranskning
Alternativ ett är smidigt men riskerar att ackumulera tillståndsbrus vid upprepade omstarter. Alternativ två isolerar loopen bättre, vilket ger högre resiliens vid haverier, och alternativ tre är mest robust men för komplext för radgränserna. Mitt fokus ligger på att balansera separation och enkelhet.


#### 2d Att förlikas: Mättnad
Jag har vägt spänningsfältet mellan alternativen och fastslår att alternativ två vinner. Det isolerar loopen bäst, ger högst resiliens vid haverier och uppnår perfekt balans mellan separation och enkelhet. MÄTTNAD: JA.
