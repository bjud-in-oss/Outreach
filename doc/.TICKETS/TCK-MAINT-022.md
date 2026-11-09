# TCK-MAINT-022: Implementera run-path.ts och dess integrationstest

## 1. MÅL
Ersätt stubben i `scripts/run-path.ts` med den kompletta orkestreringen mot `src/features/path/` och skapa det permanenta integrationstestet `scripts/__tests__/run-path.test.ts`. 

## 2. INFRASTRUKTURSPECIFIKATION
1. `scripts/run-path.ts`:
   - Exportera funktionen `exekveraRunPath(options: { ticketId?: string; argv?: string[]; io?: any; adapter?: any })`.
   - Läs in angiven biljett (fallback till PROMPT.md).
   - Skapa ett komplett `OrchestratorConfig` med `ticketId`, `malDoman`, `receptTyp` och `uppdrag`.
   - Välj recept dynamiskt: `--classic` ger 'classic', annars 'lean'.
   - Instansiera `skapaPathOrkestrerare` med dummy-portar som loggar till `io.log`, och kör orkestreraren.
   - Kör `exekveraRunPath()` om filen anropas direkt via CLI.

2. `scripts/__tests__/run-path.test.ts`:
   - Testa `exekveraRunPath` med ett syntetiskt `io`-objekt.
   - Verifiera att både lean- och classic-receptet returnerar `success: true` och `slutfold: true`.

## 3. ACCEPTANSKRITERIER
1. Båda filerna existerar och kompilerar felfritt.
2. `pnpm test` passerar 100 % grön med det nya testet inkluderat.
3. Trepunktsbesiktningen godkänns manuellt med `j`.
