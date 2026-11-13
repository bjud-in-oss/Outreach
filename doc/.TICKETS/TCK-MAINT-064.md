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
