# TCK-MAINT-065: Laga Fas 3-anropen, aktivera 4-stegs självrannsakande omvändelse (TCK + MAINT) och enhetlig Wayfinder-kritik

**Måldomän:** `scripts`
**Målfiler:** `scripts/lib/channelRunner.ts`, `scripts/run-planera-live.ts`
**Mekanisk Acceptans:**
1. `scripts/lib/channelRunner.ts` (< 235 rader — filen har 112 rader i dag) implementerar och exporterar:
   - `sparaMetaOmvandelse(ai, modelName, ticketId, errLog, si)`: kör en `Att vända om`-kanal som besvarar *"Varför omvände sig inte den inre slingan under sina 3 försök, och vilken konstruktiv kritik behöver genomföras?"* och returnerar diagnosen.
   - `omprioriteraBatchForbattringar(improvementsPath)`: läser `## 2. Köade Batch-förbättringar` i `doc/PROCESS_IMPROVEMENTS.md`, sorterar dem efter systemisk vikt (`[PRIO: HOG]` före `[PRIO: MEDEL]` före `[PRIO: LAG]`) och tar bort dubbletter.
   - `hanteraKonstruktivKritik(ai, modelName, ticketId, cycleSummary, si, improvementsPath)`: utvärderar körningen med en prompt som kräver exakt Wayfinder-format:
     * Om ingen verklig systemfriktion finns: returnera `INGEN_KRITIK` (nullable — ingen krystad kritik).
     * Vid verklig friktion: returnera `💡 Konstruktiv kritik av våra rutiner: [Observation & Konkret förslag]`, `BEDOMNING: STOR_SKILLNAD | LITEM_BATCH | AVVISAD_FELAKTIG`, `PRIORITET: HOG | MEDEL | LAG` och `MOTIVERING: ...`.
     * Sparar `LITEM_BATCH` under `## 2. Köade Batch-förbättringar` (och kör `omprioriteraBatchForbattringar`), sparar `AVVISAD_FELAKTIG` under `## 3. Avvisade & Vederlagda Förslag` (max 10 senaste, utförs aldrig), och returnerar `{ harStorSkillnad: boolean, atgard: string }`.
2. `scripts/run-planera-live.ts` (< 925 rader — filen har 857 rader i dag):
   - Rättar de felaktiga argumentordningarna i Fas 3 (rad 828–842) mot `scripts/lib/fas3Consolidation.ts`:
     * `konsolideraTest(targetDomain, ticketId, testExt, createdModules, transientTestFullPath)`
     * `hanteraTrepunktsbesiktning(ticketId, ai, systemInstruction)`
     * `genomforGitCommitPush(isMaint, ticketId, targetDomain)`
   - Kör `execCaptured('npx tsc --noEmit scripts/run-planera-live.ts scripts/run-path.ts')` i `MAINT`-valideringen (runt rad 673) så att signaturfel mellan `scripts/` och `scripts/lib/` stoppas mekaniskt.
   - Aktiverar **upp till 4 yttre omvändelser** (`omvandelseCount < 4`) med `sparaMetaOmvandelse` och framstegsspärr (`currentSig !== prevErrorSignature`) för **både** `TCK` (via `git checkout -- src/features/${targetDomain}`) och `TCK-MAINT` (via återställning från `doc/LAST_CYCLE/scripts_backup`).
   - Anropar `hanteraKonstruktivKritik` i Fas 3 (när `!process.argv.includes('--kritik-iter')`) och kör **exakt 1 extra förbättringsiteration** (`--kritik-iter=1`) när `harStorSkillnad === true`.
3. `pnpm verify` passerar med exit 0.

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **Exakta signaturer från `scripts/lib/fas3Consolidation.ts`:**
   - `konsolideraTest(targetDomain, ticketId, testExt, createdModules, transientTestFullPath)`
   - `uppdateraFeatureIndex(targetDomain, createdModules)`
   - `uppdateraBiljettstatus(ticketId)`
   - `hanteraTrepunktsbesiktning(ticketId, ai, systemInstruction)`
   - `genomforGitCommitPush(isMaint, ticketId, targetDomain)`
2. **Håll alla filer strikt inom radgränserna:**
   - `scripts/lib/channelRunner.ts` <= 235 rader (max 250).
   - `scripts/run-planera-live.ts` <= 925 rader (max 1000).
   - `--kritik-iter=1` garanterar max 1 extra förbättringsvända per cykel.

---

## Scenariotriad (Den relationella och systemiska avsikten)

**Scenario: ATT FÖLJA – Enhetlig Wayfinder-kritik, 4-stegs omvändelse och korrekta Fas 3-anrop**
  Givet att `channelRunner.ts` och `run-planera-live.ts` är uppdaterade
  När en `TCK`- eller `TCK-MAINT`-biljett körs
  Så genereras konstruktiv kritik i exakt Wayfinder-format, triageras i 3 spår med värdebaserad omprioritering, och utlöser 1 extra vända enbart vid `STOR_SKILLNAD`.

**Scenario: ATT VÄNDA OM – Stopp för signaturfel, felaktiga förslag och loopar**
  Givet att anrop mellan `run-planera-live.ts` och `scripts/lib/` har fel argumentordning eller att kritik klassas som `AVVISAD_FELAKTIG`
  När `tsc --noEmit` eller kritikgrinden körs
  Så fångas typfel omedelbart och vederlagda förslag utförs aldrig.

**Scenario: ATT FÖRLIKAS – Grön verifiering inom radgränserna**
  Givet att samtliga ändringar är applicerade
  När `pnpm verify` körs
  Så passerar arkitekturgrindar, typkontroll och tester med exit 0.
