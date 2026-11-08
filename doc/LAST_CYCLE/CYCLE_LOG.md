# BYGGCYKEL LOGG: TCK-MAINT-003
**Starttid:** 2026-11-08T13:27:03.284Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-MAINT-003: Infrastrukturhärdning, Domänisolerad Typbesiktning och Kontraktsspeglare

## 1. MÅL
Härda orkestreringsinfrastrukturen och kvalitetsgrindarna inför drift av Vägen (src/features/path/). Underhållet etablerar domänisolerad typkontroll via TypeScripts Compiler API, inför en kontraktsspeglare som skyddar produktionskod mot parameterinversion i transienta tester, slutför resilienslogiken för WebSocket-återanslutning (ADR-032) samt dämpar telemetribruset i terminalen.

## 2. KÄLLKODSSPECIFIKATION FÖR INFRASTRUKTUR
1. scripts/drivers/ts.js:
   - Implementera flaggan --check-domain-types --domain <namn> via TypeScripts Compiler API (ts.createProgram) för att kontrollera typdiagnostik enbart för aktiv domän och src/shared/.
   - Implementera flaggan --check-contract-mirror --test-file <vag> --target-domain <namn> som validerar att anrop till befintliga domänfunktioner i transienta tester inte kastar typfel mot nuvarande funktionssignaturer.
2. scripts/bidiLiveRunner.ts:
   - Nollställ this.reconnectAttempts = 0 vid bekräftat meddelande i onmessage och när send() slutförs framgångsrikt.
3. scripts/run-planera-live.ts:
   - Inför stöd för CLI_VERBOSITY (standard: terse). Vid terse skrivs inte råa verktygsreturer och WebSocket-paket ut; terminalen visar enbart fasrubriker, Gherkin, testresultat och kraschdiffar.
   - Kör --check-contract-mirror inför Fas 2: om testet anropar befintliga funktioner felaktigt tvingas modellen rätta testet i Fas 1 i stället för att mutera produktionskod.
   - Kör --check-domain-types i Fas 3 före commit.
4. scripts/verify-architecture.js:
   - Lägg till kontroll som säkerställer att alla exporterade fabriker skapa[X]port i src/features/path/engine/ har motsvarande Zod-scheman i contracts/pathSchema.ts.

## 3. ACCEPTANSKRITERIER
1. scripts/drivers/ts.js --check-domain-types --domain path rapporterar 0 fel när path är typgrön.
2. scripts/drivers/ts.js --check-contract-mirror varnar och avvisar om ett genererat test inverterar parametrar mot befintlig källkod.
3. scripts/bidiLiveRunner.ts nollställer reconnectAttempts vid lyckade anrop.
4. Terminalutskriften under mikrokanalerna är dämpad och fri från råa JSON-paket vid standardläge.
5. pnpm verify är 100 % grön.

```


#### 1a Att följa: Intention & Nytta
Givet att infrastrukturskripten och kvalitetsgrindarna ska härdas och dämpas, När domänisolerad typbesiktning och kontraktsspegling införs i orkestreringen, Så garanteras att tester skyddar produktionskontrakt och att terminalmiljön är fri från brus. Speglade detta din intention?


#### 0a Att vända om: Kontraktsaudit
Granskning genomförd enligt kontraktets gränser. Uppdraget rör strikt infrastrukturella förändringar i `scripts/` och påverkar inte källkoden under `src/features/` på ett sätt som bryter mot FSD-isoleringskontraktet. Kontraktet är härmed godkänt och redo för genomförande.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
För att lösa TCK-MAINT-003 enligt kraven formulerar jag tre ortogonala alternativ:

Alternativ 1: In-process TS-programmodell via Compiler API. Vi bygger ut `scripts/drivers/ts.js` till att skapa ett fullständigt ts.createProgram för att isolera typdiagnostik till den specifika domänen utan externa miljöberoenden.

Alternativ 2: Decoupled AST-analys via fristående skript. Vi separerar kontraktsspeglaren från typskannern genom ett dedikerat skript som enbart validerar signaturer mot AST-träd för att tvinga fram rättelser i testerna.

Alternativ 3: Interceptors i runtime och in-memory state management. Vi injicerar logik i `scripts/bidiLiveRunner.ts` och använder env-variabler för att styra strömningen och hålla terminalen ren från rådata.


#### 2c Att vända om: Resiliensgranskning
Alternativ 1 uppvisar högst resiliens då det direkt använder TypeScripts officiella Compiler API för exakt typkontroll, vilket förhindrar att latenta typfel når produktion. Alternativ 2 innebär en risk för komplexitet och missade semantiska fel vid fristående analys. Alternativ 3 är nödvändigt för runtime-stabilitet i WebSocket-hanteringen, men kräver noga kontrollerad tillståndshantering för att inte introducera minnesläckage.


#### 2d Att förlikas: Mättnad
Vi vinner på att låsa fast det arkitektoniska kontraktet. Genom att kombinera Typescripts officiella Compiler API för exakt typkontroll med strikt hanterad tillståndshantering för WebSockets, eliminerar vi både latenta typfel och minnesläckage. Jag deklarerar härmed MÄTTNAD: JA.
