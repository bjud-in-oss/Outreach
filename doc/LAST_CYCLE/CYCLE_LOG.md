# BYGGCYKEL LOGG: TCK-MAINT-069
**Starttid:** 2026-11-14T12:40:06.713Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
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

```


#### 1a Att följa: Intention & Nytta
Det här är en viktig uppdatering för att förbättra systemets diagnosförmåga och hålla skriptkatalogen modulär och överskådlig. Intentionen är att dela upp feldiagnostiken i två steg och snygga till felutdragen för att göra det mycket lättare att hitta grundorsaken bakom framtida krascher. Stämmer denna tolkning väl med vad du vill uppnå med den här körningen?


#### 0a Att vända om: Kontraktsaudit
Din tolkning stämmer precis med vad som ska uppnås. Kontraktsauditen bekräftar att alla krav är väl avgränsade, modulära och följer våra systemiska invarianter utan att bryta historiska beroenden.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
För att lösa kontraktet TCK-MAINT-069 avseende modularisering av `scripts` domänen formulerar jag tre ortogonala alternativ.

Alternativ 1: Direkt logikmigrering och enkel array-slicing. Vi extraherar batchningslogiken till `contextBatcher` och implementerar log-utdraget genom att direkt dela upp utdatasträngen i huvud och svans.

Alternativ 2: Arkitektoniskt ren återexport och tokenkänslig logghantering. Vi strikt kopplar om modulerna i `ticketAndAnchor` och använder avancerad positionering för att fånga exakt 15 rader i början och slutet av felutskrifterna.

Alternativ 3: Tillståndsseparerad diagnostik och avancerad regex-modellering. Vi använder två fristående sessioner för att diagnostisera utan minnesläckage, samt uppdaterar felankaret med regex för att specifikt matcha fil och radnummer.


#### 2c Att vända om: Resiliensgranskning
Alternativ 1 saknar tillräcklig resiliens vid gränsfall och direkt array-slicing riskerar att krascha om utdatan inte uppfyller radkraven. Alternativ 2 skyddar modulkontrakten bra, men kan kräva mer avancerad felhantering. Alternativ 3 erbjuder bäst skydd mot minnesläckage genom sessionsseparering och korrekt regex-modellering, vilket minimerar latenta fel.


#### 2d Att förlikas: Mättnad
Efter en ingående vägning av spänningsfältet mellan flexibilitet och extrem resiliens, står det klart att Alternativ 3 är det vinnande kontraktet. Genom att implementera sessionsseparering och rigorös regex-modellering eliminerar vi risken för minnesläckage och latenta fel, vilket ger den arkitektoniska mognad som krävs.

Vinnande alternativ: Alternativ 3.
MÄTTNAD: JA.
