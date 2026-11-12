# BYGGCYKEL LOGG: TCK-MAINT-037
**Starttid:** 2026-11-12T07:45:31.311Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-MAINT-037: Vitest 5 Happy-DOM och Kontraktssäkrad Testgenerering i Fas 1

**Måldomän:** `scripts` (`scripts/run-planera-live.ts`) & `vite.config.ts`
**Mekanisk Acceptans:** Ett transient skripttest bevisar att `vite.config.ts` konfigurerar `environment: 'happy-dom'` direkt under `test` (utan utfasat `environmentMatchGlobs`), att Steg 3a i `run-planera-live.ts` har `maxTurns: 5` samt att Gate 3a-återställningskanalen bär med sig `startAnchor`, och att regressionssviten passerar med exit 0.

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **Vitest v5 DOM-miljö i vite.config.ts:**
   - Ersätt `environmentMatchGlobs` i `vite.config.ts` med `environment: 'happy-dom'` direkt under `test`, så att `window`, `document` och `@testing-library/react` fungerar deterministiskt i Vitest v5.
2. **Tillräcklig vändbudget och uppföljning i Steg 3a:**
   - I `scripts/run-planera-live.ts` MÅSTE Steg 3a (`runMicroChannel` för testgenerering) ges `maxTurns: 5` samt `getFollowupPrompt: () => `Du har inspekterat domänen. Spara nu den kompletta transienta testfilen till '${transientTestFile}' med verktyget 'save_code' omedelbart!`` så att testet alltid sparas innan kanalen stängs.
3. **Full kontext i Gate 3a-återställning:**
   - När Gate 3a anropar `runMicroChannel('Att vända om', ...)` vid underkänt eller saknat test MÅSTE `${startAnchor}` inkluderas i startkontexten tillsammans med `BEFINTLIGT TEST`, så att modellen aldrig blir blind för biljettkontraktet.

---

## Scenariotriad (Den relationella och systemiska avsikten)

**Scenario: ATT FÖLJA – UI-tester har full tillgång till DOM och biljettkontext**
  Givet en UI-biljett som genererar ett `.test.tsx`-test med `@testing-library/react`
  När Steg 3a och Vitest exekverar testet
  Så ska Steg 3a hinna läsa katalogen och spara testfilen, och Vitest tillhandahålla `window` via `happy-dom`
  Utan `ReferenceError` eller blinda hallucinationer.

**Scenario: ATT VÄNDA OM – Avvisande av kontextlösa återställningsförsök**
  Givet att Gate 3a underkänner en testfil
  När återställningskanalen (*Att vända om*) startar
  Så ska biljettens startankare alltid finnas med i prompten
  Så att modellen lagar testet utifrån rätt kontrakt i stället för att gissa.

**Scenario: ATT FÖRLIKAS – En stabil byggpipeline för React och A2UI**
  Givet att ändringarna i `vite.config.ts` och `scripts/run-planera-live.ts` tillämpas
  När `pnpm verify` körs
  Så ska samtliga tester och arkitekturkontroller passera med exit code 0.

```


#### 1a Att följa: Intention & Nytta
Uppdraget är mottaget och förstått. Mitt fokus nu är att säkerställa att testmiljön har full tillgång till DOM-element och att processen för testgenerering har rätt kontext och vändbudget för att leverera stabila resultat. Vi sätter igång med att säkra byggpipelinen.


#### 0a Att vända om: Kontraktsaudit
Avsiktsförklaringen är noterad och djupt förstådd. Jag går nu in i kraften *Att vända om* för att utföra kontraktsaudit. Jag säkerställer att alla systemiska invarianter, inklusive Vitests DOM-miljö och konsekventa vändbudgetar, är strikt modellerade för att garantera en stabil byggpipeline.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
Baserat på ert kontrakt formulerar jag tre ortogonala alternativ för lösning.

Alternativ ett: Direkt konfigurations- och promptpatchning i körtidsorkestreraren. Vi patchar direkt i `vite.config.ts` och `run-planera-live.ts`.

Alternativ två: Modularisering via konfigurations- fabriker och promptmallar för Steg 3a. Vi extraherar konfigurationen till en lokal fabrik för högre underhållbarhet.

Alternativ tre: Fokus på kontraktsresiliens genom hård tillståndsåterföring i Gate 3a. Vi bygger in strikt validering av startankare i återställningskanalen.


#### 2c Att vända om: Resiliensgranskning
Alternativ ett är mest direkt och minimerar arkitektonisk friktion för själva fixen, men riskerar teknisk skuld över tid. Alternativ två bygger in högre underhållbarhet genom konfigurationsfabriker, medan alternativ tre adresserar den kritiska resiliensen i Gate 3a för att förhindra kontextförlust. Vårt bästa skydd ligger i att kombinera direkt patchning med strikt kontraktsåterföring.


#### 2d Att förlikas: Mättnad
Vårt vinnande alternativ blir att kombinera den direkta patchningen med strikt kontraktsåterföring. Detta ger oss omedelbarhet men säkrar resiliensen i Gate 3a. MÄTTNAD: JA.
