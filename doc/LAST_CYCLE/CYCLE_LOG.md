# BYGGCYKEL LOGG: TCK-MAINT-069
**Starttid:** 2026-11-14T20:39:19.241Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-MAINT-069: Vite/Oxc-säker re-export av contextBatcher.ts, felextraktion i maintValidation.ts, enhetstester och strikt isFas2Complete-spärr

**Måldomän:** `scripts`
**Målfiler:** `scripts/lib/maintValidation.ts`, `scripts/lib/ticketAndAnchor.ts`, `scripts/__tests__/scriptLibs.test.ts`, `scripts/run-planera-live.ts`
**Mekanisk Acceptans:**
1. `scripts/lib/maintValidation.ts` (< 65 rader) kör `stdio: 'pipe'` i `runCheck`. Vid fel extraherar den först rader som matchar `/Error|FAIL|Transform failed|SyntaxError|TypeError|AssertionError|error TS|RADGRÄNSBROTT|✘|File:/` (med `±3` kontekstrader, max 25 rader) och skriver ut dem **allra överst** till `process.stderr` följt av hela originalutskriften, före `process.exit(1)`.
2. `scripts/lib/ticketAndAnchor.ts` (< 140 rader, måste **skrivas över helt med `save_code`** för att rensa dödkod, men bevara exakt logik för `getRequiredFiles`):
   - Innehåller Vite 8 / `isolatedModules`-kompatibel re-export högst upp: `export type { SourceManifestEntry, BatchPlan } from './contextBatcher.js';` och `export { buildSourceManifest, planContextBatches, buildCrashDumpPayload } from './contextBatcher.js';`, och raderar de gamla lokala deklarationerna av dessa 5 symboler.
   - Bevarar `getRequiredFiles` (med `.replace(/`/g, '')`).
   - Implementerar verklig logik (inga `"TODO"`-stubbar) för `getCompactTicketWindow(ticketsMdContent, recentVerifiedLimit = 5)`, `validateTicketScope(ticketPrompt, isMaint, targetDomain)` (returnerar `{ valid: false, reason }` vid > 4 målfiler) och `selectRelevantRetryFiles(candidateFiles, errorLog)`.
   - Uppgraderar `buildRetryAnchor` till att matcha **repospecifika fil+radnummer** (`/(?:scripts|src)\/[^\s:()]+:(\d+)/`, ignorerar `node:child_process`) samt packa importhuvud (**rad 1–40**) + `±80` rader kring felraderna upp till **85 % av `maxChars`** (annars `KLYV_BILJETT`).
3. `scripts/__tests__/scriptLibs.test.ts` (< 140 rader) lägger till enhetstester för `getCompactTicketWindow`, `validateTicketScope` (> 4 filer -> `valid: false`), `selectRelevantRetryFiles` och `buildRetryAnchor` (ignorerar `node:child_process:978` och bevarar rad 1–40). **Använd vanliga citattecken (`'...'`) i teststrängar med backticks (aldrig nästlade template literals) så att `vite:oxc` aldrig får parse-fel.**
4. `scripts/run-planera-live.ts` (< 920 rader):
   - Höjer Fas 2:s `maxTurns` från `5` till `8` och ersätter `if (!codeSaved && !isMaint)` med ovillkorlig `if (!isFas2Complete()) { console.error('❌ FAS 2 MISSLYCKADES: Samtliga målfiler i kontraktet uppdaterades inte.'); process.exit(1); }` (gäller både `TCK` och `MAINT`, samt efter självrättning).
   - Utökar `relevantLines`-filtret i `currentSig` med `Transform failed`, `SyntaxError`, `TypeError`, `AssertionError` och `✘`, samt ersätter `sparaMetaOmvandelse` i `MAINT`-självrättningen med `await diagnostiseraRotOrsak(ai, MODEL_NAME, ticketId, errLog, currentMaintSource, systemInstruction)` och injicerar diagnosen i `maintRetryPrompt`.
5. `pnpm verify` passerar med exit 0.

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **Oxc-säkra teststrängar & total omskrivning av `ticketAndAnchor.ts`:**
   - Skriv över `scripts/lib/ticketAndAnchor.ts` med `save_code` utan dubblettexporter, och använd aldrig oescapade backticks inuti `` `...` `` i `scripts/__tests__/scriptLibs.test.ts`.

```


#### 1a Att följa: Intention & Nytta
Jag förstår intentionen med TCK-MAINT-069. Vi kommer att säkra upp skriptinfrastrukturen genom Vite- och Oxc-kompatibla re-exporter, förbättra felhantering och utöka testtäckningen för att säkerställa stabilitet i våra underhållsprocesser. Är du redo att påbörja planeringssvepet för att realisera detta?


#### 0a Att vända om: Kontraktsaudit
Kontraktsaudit för TCK-MAINT-069 är nu genomförd och godkänd. Alla parametrar och systemiska invarianter är validerade för uppdraget i mål-domänen `scripts`. Vi är redo att gå vidare.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
Alternativ ett innebär att vi skriver över `ticketAndAnchor.ts` helt med `save_code` för att rensa dödkod och införa den nya exportstrukturen, följt av att vi implementerar den verkliga logiken i en enskild patch.

Alternativ två fokuserar på felhantering genom att först uppgradera `maintValidation.ts` och sedan anpassa orchestratorns gränser för en mer robust feldiagnos.

Det tredje alternativet är testdrivet, där vi utvecklar logiken och enhetstesterna parallellt för att garantera att Oxc-kompatibiliteten hålls intakt, innan vi driftsätter källkoden.


#### 2c Att vända om: Resiliensgranskning
För en robust lösning bör vi kombinera alternativen och prioritera att skriva över `ticketAndAnchor.ts` helt med `save_code` direkt. Det säkerställer Vite-kompatibilitet för re-exporten. Därefter genomför vi den modulära expansionen för felhantering och tester enligt strikt TDD.


#### 2d Att förlikas: Mättnad
Jag fastställer det vinnande kontraktet: vi skriver över `ticketAndAnchor.ts` helt med `save_code` för att garantera Vite-kompatibilitet. Därefter genomför vi den modulära expansionen för felhantering och tester enligt strikt TDD. MÄTTNAD: JA.
