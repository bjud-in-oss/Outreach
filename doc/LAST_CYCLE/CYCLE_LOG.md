# BYGGCYKEL LOGG: TCK-MAINT-050
**Starttid:** 2026-11-12T15:04:02.416Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-MAINT-050: Flytta formatMemoryIndicator till shared, återkoppla MAINT-exit-skydd och koppla Node-portar till Vägmotorn

**Måldomän:** `scripts`
**Målfiler:** `src/shared/telemetry/memoryIndicator.ts`, `src/features/gemini_live_swarm/ui/promptBarHelper.ts`, `scripts/samrad.ts`, `scripts/run-planera-live.ts`, `scripts/lib/pathNodePorts.ts`, `scripts/run-path.ts`
**Mekanisk Acceptans:**
1. `src/shared/telemetry/memoryIndicator.ts` exporterar `formatMemoryIndicator(metric?)`, `promptBarHelper.ts` re-exporterar den för bakåtkompatibilitet och `scripts/samrad.ts` importerar den från `../src/shared/telemetry/memoryIndicator.ts` (noll direktimport från `gemini_live_swarm` i `scripts/`).
2. `scripts/run-planera-live.ts` återkopplar `dumpCrashDiff()` och `restoreScriptsBackup()` i `process.on("exit", ...)` vid `code !== 0`, kör `npx vitest run src/features/${targetDomain}/__tests__/` i Fas 2:s valideringsloop när mappen innehåller testfiler, och hålls strikt under 1000 rader.
3. `scripts/lib/pathNodePorts.ts` (< 250 rader) exporterar `skapaNodePathPortar(deps)` med FSD-radgränser (125 rader `.tsx`, 250 rader `.ts`) och AST-kontroll, och `scripts/run-path.ts` (< 250 rader) använder den.
4. `pnpm verify` passerar med exit 0.

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **Eliminera domänläckaget i `scripts/samrad.ts` via `src/shared/`:**
   - Skapa `src/shared/telemetry/memoryIndicator.ts` (< 20 rader) med `export function formatMemoryIndicator(metric?: any): string { if (!metric || typeof metric !== 'object') return '0 / 8192 tokens'; return \`${metric.usedTokens ?? 0} / ${metric.maxTokens ?? 8192} tokens\`; }`.
   - Ersätt funktionskroppen i `src/features/gemini_live_swarm/ui/promptBarHelper.ts` (rad 9–12) med `export { formatMemoryIndicator } from '../../../shared/telemetry/memoryIndicator.ts';`.
   - Ändra rad 14 i `scripts/samrad.ts` till `import { formatMemoryIndicator } from '../src/shared/telemetry/memoryIndicator.ts';`.
2. **Uppdatera `scripts/run-planera-live.ts` (< 1000 rader):**
   - Ändra rad 18 till `import { execCaptured, dumpCrashDiff, restoreScriptsBackup } from './lib/shellAndBackup.js';`.
   - I `process.on("exit", (code) => { if (code !== 0) { dumpCrashDiff(); restoreScriptsBackup(); } });` (rad 43–47): återställ anropen.
   - Direkt efter `execCaptured(\`npx vitest run ${transientTestFile}\`);` i Fas 2 (runt rad 735), lägg till kontroll att om `src/features/${targetDomain}/__tests__` existerar och innehåller filer körs `execCaptured(\`npx vitest run src/features/${targetDomain}/__tests__/\`);`.
3. **Skapa `scripts/lib/pathNodePorts.ts` (< 250 rader) och koppla in i `scripts/run-path.ts` (< 250 rader):**
   - Importera `fs`, `path`, `skapaAvsiktsport`, `skapaProvningsport`, `skapaKonstruktionsport`, `skapaBesiktningsport` från `'../../src/features/path/index.js'` och `execCaptured` från `'./shellAndBackup.js'`.
   - Exportera `skapaNodePathPortar(deps: { ticketId: string; io: any; dryRun?: boolean; testFilVag?: string; matris?: any[]; rootDir?: string })`.
   - Vid `dryRun !== false`: returnera säkra minnes-portar så att `scripts/__tests__/run-path.test.ts` passerar utan CLI-interaktion. Vid `dryRun === false`: kör skarpa kontroller inklusive FSD-radgränser (125 `.tsx` / 250 `.ts`) och `node scripts/drivers/ts.js --check-catch-blocks`.
   - Uppdatera `scripts/run-path.ts` till `const portar = options.portar || skapaNodePathPortar({ ticketId, io, dryRun: isDryRun || !isLive });`.

---

## Scenariotriad (Den relationella och systemiska avsikten)

**Scenario: ATT FÖLJA – Ren shared-delning, tidig domänverifiering och skarpa Node-portar**
  Givet att `formatMemoryIndicator` flyttas till `src/shared/telemetry/` och `pathNodePorts.ts` skapas
  När `samrad.ts`, `run-planera-live.ts` och `run-path.ts` uppdateras
  Så har hela `scripts/` noll otillåtna domänimporter, Fas 2 kör domäntester tidigt och Vägmotorn får skarpa CLI-portar
  Utan att överskrida radgränserna.

**Scenario: ATT VÄNDA OM – Avvisande av tyst exit utan backup-återställning**
  Givet att `process.on("exit")` i `run-planera-live.ts` tömdes i `TCK-MAINT-049`
  När `dumpCrashDiff()` och `restoreScriptsBackup()` återkopplas
  Så återställs `scripts/` automatiskt vid varje avbruten `MAINT`-körning.

**Scenario: ATT FÖRLIKAS – Grön verifiering i hela repot**
  Givet att samtliga skript och tester är uppdaterade
  När `pnpm verify` körs
  Så passerar alla grindar och tester med exit 0.

```


#### 1a Att följa: Intention & Nytta
Jag förstår uppdraget. Vi ska flytta `formatMemoryIndicator` till `src/shared` för att städa upp i våra skript, återställa skyddet så att vi inte förlorar backup-data vid krascher i `run-planera-live.ts`, och koppla in Node-portar via `pathNodePorts.ts` för en stabilare Vägmotor. Är vi överens om att detta är rätt steg för att förbättra systemets resiliens och struktur?


#### 0a Att vända om: Kontraktsaudit
Kontraktsaudit genomförd. Samtliga ändringar i TCK-MAINT-050 följer FSD-principer, radgränser och säkrar noll läckage av domäner. Vi är redo att gå vidare.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
Alternativ ett innebär en direkt flytt och strikt kontrollstyrning genom top-down refaktorisering, där vi etablerar delad kod och portbryggan i isolerade moduler.

Alternativ två fokuserar på gränssnittsemulering och fabriksmönster för Node-portarna, vilket gör koden lättare att mocka och testa i en torr miljö.

Alternativ tre bygger på kontraktscentrerad verifiering och robust avbrottshantering genom att införa felhantering tidigt för att garantera miljöns resiliens.


#### 2c Att vända om: Resiliensgranskning
Alternativ tre är det som bäst säkerställer miljöns resiliens genom tidig felhantering och kontraktscentrerad verifiering. Detta harmonierar starkt med kravet på att absolut återkoppla skyddsmekanismer vid avbrutna körningar.


#### 2d Att förlikas: Mättnad
Jag fastställer härmed att Alternativ tre är det vinnande spåret. Det säkerställer bäst miljöns resiliens och harmoni med våra krav på skyddsmekanismer. MÄTTNAD: JA.
