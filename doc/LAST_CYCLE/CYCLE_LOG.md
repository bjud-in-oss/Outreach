# BYGGCYKEL LOGG: TCK-MAINT-031
**Starttid:** 2026-11-11T20:53:20.777Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
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

```


#### 1a Att följa: Intention & Nytta
Jag uppfattar din avsikt helt. Vi ska uppdatera vårt test för AST-mutatorn så att det talar samma moderna språk som testmotorn, det vill säga Vitest. Vi ser till att kapsla in testerna korrekt, bevara all testtäckning och hålla orkestreringen helt intakt. Detta stärker vår infrastruktur och låter grinden passera utan friktion. Är det en korrekt bild av uppdraget?


#### 0a Att vända om: Kontraktsaudit
Kontraktet är granskat och godkänt. Vi fokuserar uteslutande på att migrera testsviten i 'scripts/__tests__/ast-mutator.test.js' till Vitest-standarden, utan att röra produktionskod eller orkestreringslogik.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
För att lösa TCK-MAINT-031 och harmonisera ast-mutator.test.js med Vitest, formulerar jag här tre ortogonala alternativ:

Det första alternativet är direkt migrering och kapsling, där vi behåller befintliga tester men ersätter Node-asserts med Vitests förväntnings-API.

Det andra alternativet innebär funktionell refaktorering, där vi skapar en isolerad händelsebuss-stub lokalt i testet för att hantera sidoeffekter.

Det tredje alternativet är deklarativ verifiering via isolerade exekveringsfunktioner, vilket separerar logiken från miljön helt och hållet.


#### 2c Att vända om: Resiliensgranskning
Alternativ ett är sårbart vid händelsebuss-uppdateringar då det kräver tyst acceptans av sidoeffekter. Alternativ två ger bäst resiliens genom isolerad stubbning, men alternativ tre är absolut säkrast för framtida felmodellering eftersom det helt frikopplar miljöbunden logik.


#### 2d Att förlikas: Mättnad
Efter en noggrann avvägning av de tre alternativen står det klart att alternativ tre är vinnaren. Det erbjuder den säkraste strukturen för framtida felmodellering genom sin fullständiga frikoppling från miljöbunden logik, vilket stämmer bäst överens med vår strävan efter resiliens. Jag deklarerar härmed att vi uppnått mättnad: JA.
