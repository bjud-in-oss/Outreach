# BYGGCYKEL LOGG: TCK-MAINT-029
**Starttid:** 2026-11-11T06:50:33.574Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
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

```


#### 1a Att följa: Intention & Nytta
Hej. Jag har tagit emot uppdraget rörande TCK-MAINT-029 och skyddet av våra domänexporter. Det känns angeläget att säkerställa att våra testfiler förblir helt isolerade och inte läcker in i systemets publika gränssnitt. Finns det någon särskild typ av konfigurationskonflikt under transienta testkörningar du har noterat tidigare som vi bör lägga extra fokus vid?


#### 0a Att vända om: Kontraktsaudit
Jag har granskat kontraktet för TCK-MAINT-029 och can bekräfta att det är fullt i linje med våra systemiska krav. Vi kommer att fokusera hårt på att rensa bort testexporter i `index.ts` och isolera körningsmiljön för Fas 2. Jag är redo att gå vidare till nästa steg.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
För att lösa TCK-MAINT-029 och skydda domänens fasad formulerar jag tre ortogonala alternativ.

Alternativ 1 är direkt regex-filtrering inne i syncDomainBarrel där vi utesluter filer med `.test.` eller `.spec.` innan exporten skrivs.

Alternativ 2 innebär att vi modifierar själva insamlingsloggan för filer så att testfiler ignoreras redan vid kataloggenomlysningen.

Alternativ 3 är att skapa en separat hjälppunktion för filtrering i ett nytt modullager för att följa strikt modulär expansion och bevara ren separation.


#### 2c Att vända om: Resiliensgranskning
Alternativ 1, med direkt regex-filtrering, ger direkt skydd, men kan bli en flaskhals i underhållet. Alternativ 2 är mer resilient eftersom det hanterar källkodsinsamlingens grund, men kan dölja latenta problem om insamlingen misslyckas. Alternativ 3 främjar modularitet, vilket är mest i linje med våra strikta FSD-principer och ger ren felpropagering.


#### 2d Att förlikas: Mättnad
Efter att ha vägt avvägningarna står det klart att Alternativ 3 är det vinnande kontraktet. Genom att prioritera modularitet och strikt följa FSD-principerna säkerställer vi ren felpropagering och långsiktig resiliens i vår arkitektur. MÄTTNAD: JA.
