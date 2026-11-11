# TCK-MAINT-029: Fas 2-isolering, Barrel-skydd mot testfiler och typindexering

**Måldomän:** `scripts` (`scripts/`)
**Mekanisk Acceptans:** Ett transient skripttest bevisar att `syncDomainBarrel` i `run-planera-live.ts` aldrig exporterar filer med `.test.` eller `.spec.` till domänens `index.ts`, att transienta testkörningar i Fas 2 är konfigurationsisolerade, samt att regressionssviten passerar med 100 % grönt utfall (exit 0).

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **Barrel-skydd mot testläckage:**
   - Funktionen `syncDomainBarrel` i `scripts/run-planera-live.ts` MÅSTE filtrera bort alla filer vars namn innehåller `.test.` eller `.spec.`.
   - Testfiler får ALDRIG skrivas in som `export * from ...` i en domäns publika `index.ts`.
   - Eventuella befintliga testexporter i `src/features/path/index.ts` (t.ex. `promptCompiler.test`) ska saneras bort.
2. **Isolerad transient-körning i Fas 2:**
   - När Fas 2 exekverar transienta tester via Vitest ska anropet isoleras så att det inte kolliderar med eller kräver manipulering av repots delade `vite.config.ts`.
3. **Bevara orkestreringens integritet:**
   - Befintliga kvalitetsgrindar (Gate 2c, Gate 3a AST-kontroll, Git-sanering vid start) ska förbli 100 % intakta.

---

## Scenariotriad (Den relationella och systemiska avsikten)

**Scenario: ATT FÖLJA – Domänens fasad förblir ren och tydlig**
  Givet en domän där utvecklaren skapar både logikfiler och interna tester
  När `syncDomainBarrel` körs inför en byggcykel
  Så ska endast rena produktionsmoduler exporteras i `index.ts`
  Och inga testfiler får någonsin synas i domänens publika barrel.

**Scenario: ATT VÄNDA OM – Avvisande av testläckage och konfigurationskonflikter**
  Givet att en källkodsagent placerar en testfil i samma mapp som logiken
  När barrel-synken undersöker katalogen
  Så ska testmönster omedelbart ignoreras
  Och tillfälliga Fas 2-tester ska kunna köras rött och grönt utan att påverka repots globala testinställningar.

**Scenario: ATT FÖRLIKAS – Helheten läks och källkoden lämnas i frid**
  Givet att gamla testrester eller felaktiga exporter existerar i `src/features/path/index.ts`
  När underhållet slutförs
  Så ska domänens `index.ts` vara återställd till rena domänexporter
  Och regressionssviten (`pnpm verify`) ska passera helt utan anmärkning.
