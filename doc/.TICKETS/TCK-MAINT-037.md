# TCK-MAINT-037: Global Happy-DOM och Fail-First-förankring i Vitest v5

**Måldomän:** `scripts` (`scripts/run-planera-live.ts`) & rotfiler (`vite.config.ts`)
**Mekanisk Acceptans:** Ett transient skripttest bevisar att `vite.config.ts` använder den globala inställningen `environment: 'happy-dom'` (och saknar `environmentMatchGlobs`), samt att återställningskanalen i Gate 3a-grinden förmedlar biljettens `startAnchor` i `scripts/run-planera-live.ts`. Alla skripttester och regressionssviten passerar grönt (exit 0).

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **Global Happy-DOM:**
   - I `vite.config.ts` ska sektionen `test` konfigureras med den stabila globalen `environment: 'happy-dom'`. Ta bort eventuella referenser till `environmentMatchGlobs`.
2. **Context-räddning i Gate 3a-Fail:**
   - I `scripts/run-planera-live.ts` (Fas 2), när Fail-First-grinden eller AST-grinden för testfilen fallerar och startar återställningskanalen (`runMicroChannel('Att vända om', ...)`), MÅSTE `${startAnchor}` injiceras i prompten så att modellen inte hallucinerar ett kontextlöst test.
3. **Bevara Fail-First-spärren:**
   - Spärrarna för `ReferenceError`, `TypeError`, `Failed to resolve import` och `Cannot find package` måste ligga kvar i Gate 3a.

---

## Scenariotriad (Den relationella och systemiska avsikten)

**Scenario: ATT FÖLJA – React-tester får omedelbar tillgång till window**
  Givet att ett React-test laddas i Vitest
  När testmotorn initieras
  Så ska Happy-DOM finnas globalt tillgängligt
  Och körtidsankare som AudioContext och render() kraschar inte.

**Scenario: ATT VÄNDA OM – Modellen behåller minnet vid testfel**
  Givet att Gate 3a underkänner ett genererat test
  När återställningskanalen aktiveras
  Så ska modellen fortfarande ha tillgång till kontraktet (startAnchor)
  Och kan reparera testet i stället för att fastna.

**Scenario: ATT FÖRLIKAS – Stabil grund för A2UI**
  Givet att ändringarna tillämpas
  När `pnpm verify` körs
  Så lyser allt grönt
  Och bygget är redo för TCK-050.
