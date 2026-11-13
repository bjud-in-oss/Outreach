# TCK-MAINT-057: Avvisa tautologiska alibi-assertions i Gate 3a (ts.js) och ersätt placeholder i swarmEventBus.test.tsx

**Måldomän:** `scripts`
**Målfiler:** `scripts/drivers/ts.js`, `src/features/gemini_live_swarm/__tests__/swarmEventBus.test.tsx`
**Mekanisk Acceptans:**
1. `scripts/drivers/ts.js` (< 240 rader) utökar `--check-alibi` (Gate 3a) med en AST-kontroll som stoppar triviala tautologi-assertions där `expect(<literal>).toBe(<identisk literal>)` eller `toEqual`/`toStrictEqual` jämför två identiska booleska, numeriska eller strängliteraler (t.ex. `expect(true).toBe(true)`).
2. Placeholder-testet i `src/features/gemini_live_swarm/__tests__/swarmEventBus.test.tsx` (< 140 rader) ersätts med ett verkligt körtidstest av `eventBus.clear()` utan `expect(true).toBe(true)`.
3. `pnpm verify` passerar med exit 0.

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **AST-kontroll mot tautologier i `scripts/drivers/ts.js` (< 240 rader):**
   - Lägg till `let hasTautologyAssertion = false;` i `--check-alibi`-blocket.
   - Inuti `if (ts.isCallExpression(node))`: kontrollera om `ts.isPropertyAccessExpression(node.expression)` har `.name.text` i `['toBe', 'toEqual', 'toStrictEqual']` och `ts.isCallExpression(node.expression.expression)` har anropsnamnet `'expect'`.
   - Jämför första argumentet till `expect(...)` med första argumentet till matchern: om båda är `TrueKeyword`, båda `FalseKeyword`, eller båda `StringLiteral`/`NumericLiteral` med exakt samma `.text`, sätt `hasTautologyAssertion = true;`.
   - Avbryt med `process.exit(1)` och tydligt `❌ GATE 3a BROTT`-meddelande om `hasTautologyAssertion` är sant.
2. **Ersätt `expect(true).toBe(true)` i `src/features/gemini_live_swarm/__tests__/swarmEventBus.test.tsx` (< 140 rader):**
   - Byt ut `expect(true).toBe(true);` i testet `'should limit capacity strictly using FIFO ring buffer logic'` mot en verklig verifiering av `eventBus.clear()` (prenumerera på `'test.clear'`, anropa `eventBus.clear()`, emittera `'test.clear'` och verifiera att räknaren är `0`).

---

## Scenariotriad (Den relationella och systemiska avsikten)

**Scenario: ATT FÖLJA – Gate 3a garanterar verkliga körtidsassertions**
  Givet att Gate 3a granskar nya och skördade testfiler via TypeScript AST
  När ett test innehåller `expect(true).toBe(true)` eller identiska literaler
  Så stoppar `ts.js` testet omedelbart innan källkod får skrivas
  Vilket säkerställer att varje testfall utövar verklig produktionskod.

**Scenario: ATT VÄNDA OM – Sanering av tom placeholder från TCK-055**
  Givet att `swarmEventBus.test.tsx` innehöll en kvarlämnad `expect(true).toBe(true)`-rad
  När den ersätts med ett skarpt `eventBus.clear()`-test
  Så passerar hela testsviten den nya Gate 3a-spärren.

**Scenario: ATT FÖRLIKAS – Grön verifiering i hela repot**
  Givet att `scripts/drivers/ts.js` och `swarmEventBus.test.tsx` är uppdaterade
  När `pnpm verify` körs
  Så passerar kompilering, radgränser, AST-grindar och samtliga tester med exit 0.
