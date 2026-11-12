# BYGGCYKEL LOGG: TCK-MAINT-037
**Starttid:** 2026-11-12T07:54:42.107Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
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

```


#### 1a Att följa: Intention & Nytta
Det här underhållet handlar om att ge oss en mycket stabilare grund för våra React-tester. Genom att sätta happy-dom globalt ser vi till att verktyg som render() fungerar utan problem, samtidigt som vi säkrar att minnet bevaras om vi behöver göra en omstart under testerna. Det kommer göra arbetet mycket smidigare för oss.


#### 0a Att vända om: Kontraktsaudit
Jag har mottagit kontraktet för TCK-MAINT-037. Jag påbörjar nu auditeringen av `scripts/run-planera-live.ts` och `vite.config.ts` för att säkerställa att kraven för global Happy-DOM och kontexträddning i Gate 3a efterlevs.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
Alternativ ett innebär att vi konfigurerar om Vitest direkt till happy-dom i filen vite.config.ts och i skriptet run-planera-live.js injicerar vi startAnchor som en sträng i prompten vid omstart. Alternativ två använder en strukturerad kontext-payload som kapslar in startAnchor i felhanteringen så att modellen kan återskapa tillståndet. Alternativ tre innebär att vi modifierar Vite för en modulär setup och raderar kontexten från en separat tillståndshanterare.


#### 2c Att vända om: Resiliensgranskning
Alternativ ett är det mest robusta och felsäkra valet för uppdraget. Genom att sätta den globala miljön direkt i konfigurationen och injicera kontraktet i omstarten, minimerar vi risken för parsingfel i komplexa payloads och behåller den nödvändiga enkelheten för resiliens.


#### 2d Att förlikas: Mättnad
Jag bekräftar härmed att Alternativ ett är det vinnande kontraktet. Det ger största möjliga resiliens och minimerar felkällor genom sin enkelhet. Jag deklarerar härmed MÄTTNAD: JA.
