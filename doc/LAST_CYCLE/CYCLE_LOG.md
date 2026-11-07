# BYGGCYKEL LOGG: TCK-037
**Starttid:** 2026-11-07T22:21:41.353Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-037: Prövningsporten och Prediktiv TDD (Testing Port)

## 1. MÅL
Implementera Prövningsporten (src/features/path/engine/provningsport.ts) som förkroppsligar rollen Att vända om enligt ADR-028, ADR-029 och ADR-030. Prövningsporten ansvarar för att validera att ett genererat integrationstest uppfyller Prediktiv Fail-First: testet ska bevisat fallera rött och dess felorsak ska matcha ett förutsagt förväntat påståendefel (assertion failure), inte ett syntaxfel eller en trasig import.

## 2. DESTRUKTIVA HANDLINGSSTEG
Inga filer raderas. Befintlig kod i src/features/path/ kompletteras enligt Väg 2 (Modulär expansion). Gamla skript i scripts/ förblir orörda.

## 3. IMPLEMENTERINGSSPECIFIKATION FÖR BYGGMOTORN

### A. Typ- och Kontraktsutökning (src/features/path/model/types.ts)
Komplettera types.ts med kontrakt för prediktiv testvalidering:
- TestKorselResultat: { passerade: boolean; exitKod: number; felmeddelande?: string }
- TestExekverare: (testFilVag: string) => Promise<TestKorselResultat>
- ProvningsportOptions: { testFilVag: string; forvantatFel: string; testExekverare: TestExekverare }

### B. Prövningsporten (src/features/path/engine/provningsport.ts)
Skapa fabriksfunktionen skapaProvningsport(options: ProvningsportOptions): Port:
- Returnerar en asynkron funktion av typen Port: async (kontext: PathContext): Promise<PortResult> => { ... } (på samma sätt som skapaAvsiktsport).
- När porten anropas exekveras testet via await options.testExekverare(options.testFilVag).
- Bedömning av Prediktiv Fail-First:
  1. Om testet passerar (grönt för tidigt):
     Returnera { oppnad: false, orsak: 'Testet passerade grönt innan källkod implementerats (Falskt positivt / Saknar Fail-First)', omvandelseKrav: 'KRÄV_RÖTT_TEST' }.
  2. Om testet fallerar med rätt förväntat fel (äkta rött körtidsbevis):
     Om (resultat.felmeddelande || '').toLowerCase().includes(options.forvantatFel.toLowerCase()):
     Returnera { oppnad: true }.
  3. Om testet fallerar av fel anledning (syntaxfel, importfel etc.):
     Returnera { oppnad: false, orsak: `Testet fallerade av oväntad orsak: "${resultat.felmeddelande}". Förväntade: "${options.forvantatFel}"`, omvandelseKrav: 'ÅTGÄRDA_TESTSYNTAX' }.

### C. Zod-Validering (src/features/path/contracts/pathSchema.ts)
Komplettera schemat med ProvningsportOptionsSchema:
- testFilVag: z.string().min(1)
- forvantatFel: z.string().min(1)
- testExekverare: z.custom<Function>()

### D. Domänexport (src/features/path/index.ts)
Exportera skapaProvningsport och de nya typerna från src/features/path/index.ts.

## 4. ACCEPTANSKRITERIER (Hermetisk TDD och Gate 3a)
1. Skapa src/features/path/__tests__/provningsport.test.ts.
2. Körtidsankare och TDD Fail-First: Testet ska importera skapaProvningsport, knackaPaPorten, PortNekadError, Port och PathContext från den egna domänen. Använd rena asynkrona funktioner för testExekverare (inga syntetiska spioner som vi.fn()).
3. Korrekt anrop: Porten ska alltid anropas via await knackaPaPorten(port, kontext) där port är returvärdet från skapaProvningsport(...) och kontext: PathContext = {}.
4. Testfall 1 (Godkänt prediktivt rött test): 
   När exekveraren returnerar passerade: false och felmeddelande: 'AssertionError: expected false to be true', och forvantatFel: 'AssertionError', ska knackaPaPorten(port, kontext) öppna porten utan fel (resolves.not.toThrow() eller att resultat.oppnad === true).
5. Testfall 2 (Underkänt p.g.a. grönt test):
   När exekveraren returnerar passerade: true, ska knackaPaPorten(port, kontext) kasta PortNekadError med omvandelseKrav: 'KRÄV_RÖTT_TEST'.
6. Testfall 3 (Underkänt p.g.a. syntax-/importfel):
   När exekveraren returnerar passerade: false och felmeddelande: 'SyntaxError: Unexpected token', och forvantatFel: 'AssertionError', ska knackaPaPorten(port, kontext) kasta PortNekadError med omvandelseKrav: 'ÅTGÄRDA_TESTSYNTAX'.
7. Fil- och radgränser: Samtliga skapade eller ändrade .ts-filer under src/features/path/ ska strikt hålla sig under 250 rader per fil.
8. pnpm test och node scripts/verify-architecture.js ska vara 100 % gröna.

```


#### 1a Att följa: Intention & Nytta
Feature: Predictive Fail-First Validation with Prövningsporten

  Scenario: Test fails correctly due to an assertion failure
    Given the execution framework runs a test that throws an AssertionError
    When Prövningsporten evaluates the test run result against the expected error "AssertionError"
    Then the port verifies the error and opens successfully

  Scenario: Test passes prematurely
    Given the execution framework runs a test that passes
    When Prövningsporten evaluates the test run result
    Then the port denies access and requires a red test

  Scenario: Test fails prematurely due to syntax error
    Given the execution framework runs a test that throws a SyntaxError
    When Prövningsporten evaluates the test run result against the expected error "AssertionError"
    Then the port denies access and requires fixing test syntax


#### 0a Att vända om: Kontraktsaudit
Jag har utfört kontraktsauditen för TCK-037. Samtliga ändringar sker uteslutande inom domänen src/features/path/, vilket uppfyller kravet på FSD-isolering. Alla typer och scheman för prediktiv testvalidering finns definierade. Vi är redo för nästa steg.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
För att uppfylla TCK-037 och realisera prövningsporten formulerar jag härmed tre ortogonala alternativ för lösning:

Alternativ ett: Direkt injektion och exekveringskontrakt. Detta innebär en funktionell komposition där en `TestExekverare` injiceras som en ren callback, vilket ger låg komplexitet och en tight koppling till det befintliga kontraktet.

Alternativ två: Händelsestyrd exekvering via EventBus. Här emitterar prövningsporten en begäran och lyssnar efter resultat via `SwarmEventBus`, vilket ger ett helt frikopplat gränssnitt för asynkron tillståndshantering.

Alternativ tre: Adaptor-baserad isolering mot körtid. Genom att införa ett `TestAdapter`-gränssnitt kapslas testexekveringen in och blir helt agnostisk gentemot testramverk och miljö, vilket ger maximal modularitet.


#### 2c Att vända om: Resiliensgranskning
Baserat på resiliensgranskningen av de tre alternativen bedömer jag att Alternativ ett, direkt injektion och exekveringskontrakt, har högst resiliens för detta uppdrag.

Den funktionella kompositionen minimerar komplexiteten och eliminerar latenta haverier kopplade till asynkron händelseloggning eller trasiga korrelations-id:n, vilket ger det säkraste spåret för att snabbt verifiera prediktiv Fail-First.


#### 2d Att förlikas: Mättnad
Jag har vägt spänningsfältet och mätt det semantiska deltat. Med Alternativ ett minimerar vi komplexiteten och eliminerar latenta haverier. Jag låser kontraktet för Alternativ ett. MÄTTNAD: JA.


#### 3a Att följa: Testspecifikation



#### 3b Att följa: Källkod



#### 3c Att förlikas: Slutgiltigt Byggkontrakt
Filer att skapa och bevara i byggkontraktet är: src/features/path/model/types.ts för att inkludera de nya testtyperna, src/features/path/engine/provningsport.ts för logiken i porten, src/features/path/contracts/pathSchema.ts för Zod-validering, src/features/path/index.ts för alla nya exporter, och slutligen testfilen src/features/path/__tests__/provningsport.test.ts för verifiering.
