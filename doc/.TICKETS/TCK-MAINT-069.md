# TCK-MAINT-069: Delad 2-prompts 5-Varför-tratt, huvud/svans-felutdrag i shellAndBackup, modulär contextBatcher.ts och repospecifik ticketAndAnchor.ts

**Måldomän:** `scripts`
**Målfiler:** `scripts/lib/channelRunner.ts`, `scripts/lib/shellAndBackup.ts`, `scripts/lib/contextBatcher.ts`, `scripts/lib/ticketAndAnchor.ts`
**Mekanisk Acceptans:**
1. `scripts/lib/channelRunner.ts` (< 205 rader):
   - Ersätter implementationen av `omprioriteraBatchForbattringar`/`hanteraKonstruktivKritik` med en 1-radig `export { hanteraKonstruktivKritik } from './critiqueTriage.js';`.
   - Exporterar `diagnostiseraRotOrsak(ai, modelName, contextTitle, errorLog, sourceContext, si)` (samt en bakåtkompatibel wrapper `sparaMetaOmvandelse` som delegerar till `diagnostiseraRotOrsak`) med **två fristående efemära sessioner**:
     * **Prompt 1 (`Att vända om`, `maxTurns: 1`):** Zoomar ut mot FSD-/kontraktsintegritet och modulär expansion (Väg 2), spårar enbart de inledande mekaniska faktafrågorna (**normalt `Varför 1–3`**), öppnar där **3 ortogonala felhypoteser** utan rangordning, ställer den **Epistemiska Falsifieringsfrågan** och anger **återstående frågedjup** (`minst 2`, dvs. `Varför 4–5+`), strippad från slutsatser.
     * **Prompt 2 (`Att förlikas`, `maxTurns: 1`, blankt minne):** Väger hypoteserna mot fellogg, källkod, `FEATURE_INDEX.json` och `DECISIONS.md`, väljer fritt egna prövningsfrågor för att testa anpassning av befintliga repoidéer (`HYPOTES D: REPO-ÅTERANVÄNDNING`), slutför `Varför 4–5+`, loggar domen i `CYCLE_LOG.md` och låser `EGENTLIGT_FEL`.
2. `scripts/lib/shellAndBackup.ts` (< 115 rader) uppgraderar `execCaptured` så att när utdata överstiger 30 rader behålls **de 15 första raderna** (där `esbuild`/`tsc`/`Vitest` skriver `✘ [ERROR]` och `FAIL`) **samt de 15 sista raderna** (huvud + svans i stället för bara Node:s `child_process`-stacktrace).
3. Ny modul `scripts/lib/contextBatcher.ts` (< 130 rader) tar över `SourceManifestEntry`, `BatchPlan`, `buildSourceManifest`, `planContextBatches` och `buildCrashDumpPayload` från `ticketAndAnchor.ts` med 100 % bevarad logik.
4. `scripts/lib/ticketAndAnchor.ts` (< 180 rader) re-exporterar `SourceManifestEntry`, `BatchPlan`, `buildSourceManifest`, `planContextBatches` och `buildCrashDumpPayload` från `./contextBatcher.js`, exporterar `getCompactTicketWindow(ticketsMdContent, recentVerifiedLimit = 5)`, `validateTicketScope(ticketPrompt, isMaint, targetDomain)` (> 4 målfiler) samt `selectRelevantRetryFiles(candidateFiles, errorLog)`, och uppgraderar `buildRetryAnchor` till att matcha **repospecifika fil+radnummer** (`/(?:scripts|src)\/[^\s:()]+:(\d+)/`, ignorerar `node:child_process`) samt packa importhuvud (**rad 1–40**) + `±80` rader kring felraderna upp till **85 % av `maxChars`** (annars `KLYV_BILJETT`).
5. `pnpm verify` passerar med exit 0.

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **Modularisera — radera aldrig `contextBatcher`-funktionerna:**
   - Flytta dem till `scripts/lib/contextBatcher.ts` och re-exportera dem i `ticketAndAnchor.ts` så att samtliga befintliga och framtida anropare fungerar utan avbrott.
2. **Kirurgisk 4-filsbiljett:**
   - Rör ENDAST dessa 4 filer under `scripts/`.
