# TCK-MAINT-035: Dynamisk Testextension vid Fas 3-konsolidering

**Måldomän:** `scripts` (`scripts/run-planera-live.ts`)
**Mekanisk Acceptans:** Ett transient skripttest bevisar att Fas 3 i `run-planera-live.ts` sparar den permanenta testfilen med samma dynamiska ändelse (`testExt`) som transient-testet (`${path.basename(primaryModule)}.test.${testExt}`), samt att den lokala Fas 2-valideringen och regressionssviten passerar med exit 0.

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **Bevara testextension vid konsolidering:**
   - I `scripts/run-planera-live.ts` (Fas 3) MÅSTE variabeln `permanentTestPath` använda den dynamiska variabeln `testExt` i stället för hårdkodat `.test.ts`:
     `path.join(permanentTestDir, `${path.basename(primaryModule)}.test.${testExt}`)`
2. **Bevara FSD- och skriptinvarianter:**
   - Inga ändringar får göras i domänlogiken under `src/features/`. Ändringen berör uteslutande Fas 3 i orkestreringsskriptet.

---

## Scenariotriad (Den relationella och systemiska avsikten)

**Scenario: ATT FÖLJA – Testsviten förblir intakt efter konsolidering**
  Givet ett godkänt transient UI-test med ändelsen `.tsx`
  När Fas 3 konsoliderar testet till domänens permanenta mapp
  Så ska filen sparas som `.test.tsx`
  Och slutverifieringen (`pnpm verify`) exekverar testet rent utan parserfel.

**Scenario: ATT VÄNDA OM – Avvisande av filändelseförvanskning**
  Givet en JSX-innehållande testfil
  När systemet skriver filen till disk
  Så får den aldrig tvingas till ren `.ts`
  Så att oxc-kompilatorn inte kastar syntaxfel på JSX-taggar.

**Scenario: ATT FÖRLIKAS – En friktionsfri väg för A2UI**
  Givet att konsolideringen är harmoniserad
  När `pnpm verify` körs
  Så ska alla skriptkontroller och arkitekturregler lysa grönt
  Och vägen är helt öppen för TCK-050.
