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
