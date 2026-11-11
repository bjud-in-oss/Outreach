# TCK-MAINT-031: Harmonisera ast-mutator.test.js med Vitest-standarden

**Måldomän:** `scripts` (`scripts/__tests__/ast-mutator.test.js`)
**Mekanisk Acceptans:** Ett enhetstest bevisar att `scripts/__tests__/ast-mutator.test.js` exekverar framgångsrikt via `npx vitest run scripts/__tests__/` med registrerade testsviter (`describe`, `it`, `expect`), samt att den lokala Fas 2-valideringen passerar utan fel (exit 0).

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **Vitest-kompatibilitet:**
   - `scripts/__tests__/ast-mutator.test.js` MÅSTE migreras från råa Node.js `assert`-satser till Vitests standard-API (`describe`, `it`, `expect`).
   - Filen får inte innehålla oinkapslade toppnivå-satser som får Vitest att rapportera "No test suite found".
2. **Bevara testtäckning:**
   - Båda de ursprungliga testfallen för AST-mutatorn ska bevaras och verifieras:
     1. Scope-isolering (global konfiguration ignoreras och funktionens returvärde muteras).
     2. Händelsebuss-sidoeffekter (`eventBus.emit`) släcks med högsta prioritet.
3. **Oförändrad orkestrering:**
   - Inga ändringar får göras i `scripts/run-planera-live.ts` under denna biljett; målet är enbart att läka testfixturen.

---

## Scenariotriad (Den relationella och systemiska avsikten)

**Scenario: ATT FÖLJA – Skripttestet talar samma språk som testmotorn**
  Givet testfixturen för AST-mutatorn i `scripts/__tests__/`
  När `npx vitest run scripts/__tests__/` exekveras
  Så ska Vitest omedelbart identifiera testsviten och rapportera gröna tester
  Och infrastrukturen förblir enhetlig.

**Scenario: ATT VÄNDA OM – Avvisande av ostrukturerade testskript**
  Givet att en fil med ändelsen `.test.js` saknar formella testblock
  När testmotorn skannar katalogen
  Så ska avvikelsen elimineras genom att kapsla logiken i `describe` och `it`
  Så att inga falsklarm eller tomma testkörningar uppstår.

**Scenario: ATT FÖRLIKAS – Den lokala Fas 2-grinden öppnas**
  Givet att `ast-mutator.test.js` uppdateras
  När den lokala grinden i `run-planera-live.ts` körs under underhåll
  Så ska samtliga tester i `scripts/__tests__/` passera grönt
  Och vägen är fri för efterföljande systemförbättringar.
