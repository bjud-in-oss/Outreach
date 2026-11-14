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
