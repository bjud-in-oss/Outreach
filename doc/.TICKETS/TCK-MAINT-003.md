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
