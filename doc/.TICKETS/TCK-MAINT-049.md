# TCK-MAINT-049: Slutför scripts/lib-utbrytning, skärp Steg 3a-läsning och lås taket på 1000 rader

**Måldomän:** `scripts`
**Målfiler:** `scripts/run-planera-live.ts`, `scripts/verify-architecture.js`, `scripts/__tests__/scriptLibs.test.ts`
**Mekanisk Acceptans:**
1. De kvarlämnade dubblettdefinitionerna av `dumpCrashDiff` och `restoreScriptsBackup` i `scripts/run-planera-live.ts` är borttagna och filen håller sig strikt under 1000 rader.
2. `scripts/run-planera-live.ts` importerar och anropar `buildRetryAnchor(testContent, currentSourceSummary, testLog)` i Fas 2:s självrättningsslinga.
3. Punkt 1 i Steg 3a-prompten i `scripts/run-planera-live.ts` kräver explicit att modellen anropar `read_file` på samtliga befintliga filer listade under `**Målfiler:**` innan `save_code` anropas.
4. `LEGACY_SCRIPT_CAPS['run-planera-live.ts']` i `scripts/verify-architecture.js` sänks från `1065` till `1000`.
5. `scripts/__tests__/scriptLibs.test.ts` verifierar `getRequiredFiles` och `buildRetryAnchor`, och `pnpm verify` passerar med exit 0.

---

## Destruktiva Handlingssteg (Obligatorisk städning)
- **Radera dubblettfunktioner i `scripts/run-planera-live.ts`:** Ta bort de lokala funktionsdefinitionerna `function dumpCrashDiff()` och `function restoreScriptsBackup()` (runt rad 45–75) via `apply_patch`, eftersom båda redan importeras från `./lib/shellAndBackup.js` på rad 18.

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **Rensa dubbletter, koppla `buildRetryAnchor` och skärp Steg 3a i `scripts/run-planera-live.ts` (< 1000 rader):**
   - Ändra rad 19 till `import { getRequiredFiles, buildRetryAnchor } from './lib/ticketAndAnchor.js';`.
   - Ta bort de lokala dubblettfunktionerna `dumpCrashDiff` och `restoreScriptsBackup` (runt rad 45–75).
   - Uppdatera punkt 1 i `Steg 3a` (runt rad 398) till:
     `1. EPISTEMISK LÄSNING: Anropa först 'read_file' på SAMTLIGA befintliga filer listade under **Målfiler:** i biljetten (samt 'list_files' vid behov) så att du ser deras exakta fält- och metodnamn. Gissa ALDRIG egenskaper, fältnamn eller props!`
   - Ersätt konstruktionen av `retryAnchor` (runt rad 828) med `const retryAnchor = buildRetryAnchor(testContent, currentSourceSummary, testLog);`.
2. **Sänk taket i `scripts/verify-architecture.js` (< 250 rader):**
   - Ändra `const LEGACY_SCRIPT_CAPS = { 'run-planera-live.ts': 1065, 'bidiLiveRunner.ts': 345 };` till `const LEGACY_SCRIPT_CAPS = { 'run-planera-live.ts': 1000, 'bidiLiveRunner.ts': 345 };`.
3. **Karakteriseringstest i `scripts/__tests__/scriptLibs.test.ts`:**
   - Skapa `scripts/__tests__/scriptLibs.test.ts` som testar att `getRequiredFiles` läser `**Målfiler:**` och att `buildRetryAnchor` trunkerar utdata när den överstiger `maxChars`.

---

## Scenariotriad (Den relationella och systemiska avsikten)

**Scenario: ATT FÖLJA – Ren skriptkod och tvungen läsning av målfiler i Steg 3a**
  Givet att `shellAndBackup.ts` och `ticketAndAnchor.ts` är utbrutna och Steg 3a skärps
  När `run-planera-live.ts` rensas och `buildRetryAnchor` kopplas in
  Så krymper skriptet under 1000 rader och framtida Steg 3a-tester läser alltid målfilerna innan testgenerering
  Vilket eliminerar gissade fältnamn.

**Scenario: ATT VÄNDA OM – Avvisande av kvarlämnad dubblettkod och regresserande radtillväxt**
  Givet att dubblettfunktionerna tas bort och `verify-architecture.js` låser taket vid 1000 rader
  När `pnpm verify` körs
  Så avvisas framtida tillväxt mekaniskt.

**Scenario: ATT FÖRLIKAS – Grön verifiering och redo för Vägmotorn**
  Givet att tester och arkitekturgrindar exekveras
  När `pnpm verify` körs
  Så passerar samtliga kontroller med exit 0.
