# BYGGCYKEL LOGG: TCK-MAINT-069
**Starttid:** 2026-11-14T12:55:53.892Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
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

```


#### 1a Att följa: Intention & Nytta
Jag förstår att uppdraget handlar om att stärka våra interna diagnos- och felhanteringsrutiner för att förebygga framtida buggar. Genom att klyva rotorsaksdiagnotiseringen och förbättra felutdragen ger vi systemet en djupare förmåga att förstå latenta fel, vilket i sin tur skyddar systemets integritet och främjar en mer stabil utvecklingsmiljö.


#### 0a Att vända om: Kontraktsaudit
Kontraktet är granskat och harmonierar väl med våra systemiska invarianter. Fokus ligger på att stärka felhanteringens stringens genom klyvd diagnostik och tydligare utdrag. Jag säkerställer att inga gränser för FSD-domäner överskrids under implementeringen.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
För att lösa TCK-MAINT-069 presenterar jag här tre ortogonala alternativ:

Alternativ ett: Direkt modulär integration. Vi uppdaterar målfilerna i befintlig struktur där vi flyttar ut de gamla funktionerna och injicerar den nya logiken, samt strikt följer radbegränsningarna.

Alternativ två: Logikextraktion.
Vi bryter ut komplex logik som felutdraget och diagnosticeringsprocessen till egna moduler, för att hålla huvudkällfilerna maximalt små och lättlästa.

Alternativ tre: Kontraktsdriven testfokuserad implementation.
Vi prioriterar att sätta upp de nödvändiga exportkontrakten först och säkerställer att de två sessionsstegen i `channelRunner.ts` fungerar oberoende och följer 5-Varför-tratten.


#### 2c Att vända om: Resiliensgranskning
I resiliensgranskningen av alternativen ser vi att direkt modulär integration i Alternativ Ett riskerar en för tight koppling om vi försöker ändra för fundamentala kontrakt i gamla filer utan isolering.

Logikextraktion, alltså Alternativ Två, ger en mer resilient struktur eftersom vi bryter ut diagnostik och felutdrag, vilket håller huvudfilerna enkla och minskar risken för tysta catch-block.

Vårt vinnande spår blir Kontraktsdriven implementation, Alternativ Tre, då det säkrar att de två stegen i channelRunner.ts exekveras med isolerat minne och rätt frågedjup, vilket gör att vi uppfyller alla systemvarianter i kontraktet från start.


#### 2d Att förlikas: Mättnad
Alternativ Tre, Kontraktsdriven implementation, är det vinnande spåret. Det säkrar att stegen i channelRunner.ts exekveras med isolerat minne och korrekt frågedjup, vilket uppfyller alla systemiska invarianter från start. MÄTTNAD: JA.
