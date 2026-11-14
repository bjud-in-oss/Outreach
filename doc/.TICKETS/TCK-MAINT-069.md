# TCK-MAINT-069: Delad 2-prompts 5-Varför-tratt, huvud/svans-felutdrag, re-export av contextBatcher.ts och strikt isFas2Complete-spärr

**Måldomän:** `scripts`
**Målfiler:** `scripts/lib/channelRunner.ts`, `scripts/lib/shellAndBackup.ts`, `scripts/lib/ticketAndAnchor.ts`, `scripts/run-planera-live.ts`
**Mekanisk Acceptans:**
1. `scripts/lib/channelRunner.ts` (< 205 rader):
   - Ersätter implementationen av `omprioriteraBatchForbattringar`/`hanteraKonstruktivKritik` med `export { hanteraKonstruktivKritik } from './critiqueTriage.js';`.
   - Exporterar `diagnostiseraRotOrsak(ai, modelName, contextTitle, errorLog, sourceContext, si)` (samt en bakåtkompatibel wrapper `sparaMetaOmvandelse` som delegerar till `diagnostiseraRotOrsak`) med **två fristående efemära sessioner**:
     * **Prompt 1 (`Att vända om`, `maxTurns: 1`):** Zoomar ut mot FSD-/kontraktsintegritet och modulär expansion (Väg 2), spårar enbart de inledande mekaniska faktafrågorna (**normalt `Varför 1–3`**), öppnar där **3 ortogonala felhypoteser** utan rangordning, ställer den **Epistemiska Falsifieringsfrågan** och anger **återstående frågedjup** (`minst 2`, dvs. `Varför 4–5+`), strippad från slutsatser.
     * **Prompt 2 (`Att förlikas`, `maxTurns: 1`, blankt minne):** Väger hypoteserna mot fellogg, källkod, `FEATURE_INDEX.json` och `DECISIONS.md`, väljer fritt egna prövningsfrågor för att testa anpassning av befintliga repoidéer (`HYPOTES D: REPO-ÅTERANVÄNDNING`), slutför `Varför 4–5+`, loggar domen i `CYCLE_LOG.md` och låser `EGENTLIGT_FEL`.
2. `scripts/lib/shellAndBackup.ts` (< 115 rader) uppgraderar `execCaptured` så att när utdata överstiger 30 rader behålls **de 15 första raderna** (där `esbuild`/`tsc`/`Vitest` skriver `✘ [ERROR]` och `FAIL`) **samt de 15 sista raderna** (huvud + svans i stället för bara Node:s `child_process`-stacktrace).
3. `scripts/lib/ticketAndAnchor.ts` (< 180 rader) ersätter de redan utbrutna funktionerna med `export { SourceManifestEntry, BatchPlan, buildSourceManifest, planContextBatches, buildCrashDumpPayload } from './contextBatcher.js';`, exporterar `getCompactTicketWindow(ticketsMdContent, recentVerifiedLimit = 5)`, `validateTicketScope(ticketPrompt, isMaint, targetDomain)` (> 4 målfiler) samt `selectRelevantRetryFiles(candidateFiles, errorLog)`, och uppgraderar `buildRetryAnchor` till att matcha **repospecifika fil+radnummer** (`/(?:scripts|src)\/[^\s:()]+:(\d+)/`, ignorerar `node:child_process`) samt packa importhuvud (**rad 1–40**) + `±80` rader kring felraderna upp till **85 % av `maxChars`** (annars `KLYV_BILJETT`).
4. `scripts/run-planera-live.ts` (< 920 rader) höjer Fas 2:s `maxTurns` från `5` till `8` och ersätter `if (!codeSaved && !isMaint)` med ovillkorlig `if (!isFas2Complete()) { console.error('❌ FAS 2 MISSLYCKADES: Samtliga målfiler i kontraktet uppdaterades inte.'); process.exit(1); }` (gäller både `TCK` och `MAINT`, samt efter självrättning).
5. `pnpm verify` passerar med exit 0.

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **Kirurgisk 4-filsbiljett & ingen tyst halv-leverans:**
   - Rör ENDAST dessa 4 filer under `scripts/` och säkerställ att samtliga 4 uppdateras innan Fas 2 avslutas.
