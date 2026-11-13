# BYGGCYKEL LOGG: TCK-MAINT-057
**Starttid:** 2026-11-13T21:51:22.229Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
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

```


#### 1a Att följa: Intention & Nytta
Jag förstår uppdraget precis. Syftet med TCK-MAINT-057 är att stärka vår kvalitetsgrind Gate 3a genom att stoppa tautologiska alibi-assertions, såsom `expect(true).toBe(true)`.

Genom att ersätta platshållaren i `swarmEventBus.test.tsx` med ett riktigt körtidstest av `eventBus.clear()`, säkerställer vi genuint testutfall och systemisk resiliens. Är du redo att vi sätter igång med bygget?


#### 0a Att vända om: Kontraktsaudit
Jag har granskat kontraktet och premisserna för TCK-MAINT-057 och kan bekräfta att alla invariater för Gate 3a hålls. Kontraktet är härmed auditerat och godkänt för exekvering.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
För att lösa kontraktet TCK-MAINT-057 och stärka grind 3a utan att introducera sidoberoenden, formulerar jag tre ortogonala alternativ.

Alternativ ett är att bygga in en direkt AST-kontroll i nod-besökaren för expect-anrop i `ts.js` för att validera första argumentet mot matcherns textvärde och avbryta omedelbart. För testfilen prenumererar vi på ett test-event, anropar `eventBus.clear()` och emitterar för att verifiera nollställning.

Alternativ två använder en modulär hjälpfunktion i `ts.js` för att renodla AST-logiken mot tautologiska matchers och för testfilen kapslas verifieringen in i en sluten lambda per krav.

Alternativ tre implementerar en specifik nod-besökare för assert-uttryck som filtrerar bort tautologier före generella funktioner och för testfilen används rena variabler för tillståndsmätning utan mockar. Vilka avvägningar prioriterar vi?


#### 2c Att vända om: Resiliensgranskning
Vi prioriterar Alternativ ett för dess direkta och transparenta AST-kontroll i nodbesökaren. Det minimerar risken för dolda fel eller sidoberoenden, vilket ger störst resiliens mot protokollbrus och felaktiga tillstånd.


#### 2d Att förlikas: Mättnad
Vi bekräftar att Alternativ ett är det bäst lämpade kontraktet. Vi deklarerar härmed MÄTTNAD: JA och låser det vinnande alternativet för fortsatt exekvering.
