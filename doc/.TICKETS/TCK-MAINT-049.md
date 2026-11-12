# TCK-MAINT-049: Slutför scripts/lib-utbrytning, koppla buildRetryAnchor och lås taket på 1000 rader

**Måldomän:** `scripts`
**Målfiler:** `scripts/run-planera-live.ts`, `scripts/verify-architecture.js`, `scripts/__tests__/scriptLibs.test.ts`
**Mekanisk Acceptans:**
1. De kvarlämnade dubblettdefinitionerna av `dumpCrashDiff` och `restoreScriptsBackup` i `scripts/run-planera-live.ts` är borttagna så att filen uteslutande använder importerna från `./lib/shellAndBackup.js` och håller sig under 1000 rader.
2. `scripts/run-planera-live.ts` importerar och anropar `buildRetryAnchor(testContent, currentSourceSummary, testLog)` i Fas 2:s självrättningsslinga.
3. `LEGACY_SCRIPT_CAPS['run-planera-live.ts']` i `scripts/verify-architecture.js` sänks från `1065` till `1000`.
4. `scripts/__tests__/scriptLibs.test.ts` verifierar `getRequiredFiles` och `buildRetryAnchor` (inklusive 24 KB-trunkering), och `pnpm verify` passerar med exit 0.

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **Rensa dubbletter och koppla `buildRetryAnchor` i `scripts/run-planera-live.ts` (< 1000 rader):**
   - Importera `buildRetryAnchor` från `./lib/ticketAndAnchor.js` på rad 19.
   - Ta bort de lokala dubblettfunktionerna `dumpCrashDiff` och `restoreScriptsBackup` (runt rad 39–75) eftersom de redan importeras från `./lib/shellAndBackup.js`.
   - Ersätt konstruktionen av `retryAnchor` (runt rad 828) med `const retryAnchor = buildRetryAnchor(testContent, currentSourceSummary, testLog);`.
2. **Sänk taket i `scripts/verify-architecture.js` (< 250 rader):**
   - Ändra `const LEGACY_SCRIPT_CAPS = { 'run-planera-live.ts': 1065, 'bidiLiveRunner.ts': 345 };` till `const LEGACY_SCRIPT_CAPS = { 'run-planera-live.ts': 1000, 'bidiLiveRunner.ts': 345 };`.
3. **Karakteriseringstest i `scripts/__tests__/scriptLibs.test.ts`:**
   - Skapa `scripts/__tests__/scriptLibs.test.ts` som testar att `getRequiredFiles` läser `**Målfiler:**` och att `buildRetryAnchor` trunkerar utdata när den överstiger `maxChars`.

---

## Scenariotriad (Den relationella och systemiska avsikten)

**Scenario: ATT FÖLJA – Ingen död dubblettkod och skyddad självrättningskontext**
  Givet att `shellAndBackup.ts` och `ticketAndAnchor.ts` har brutits ut till `scripts/lib/`
  När `run-planera-live.ts` rensas och använder `buildRetryAnchor`
  Så krymper skriptet under 1000 rader och TPM-spärren aktiveras i skarpt läge
  Utan beteendeförlust.

**Scenario: ATT VÄNDA OM – Avvisande av regresserande radtillväxt**
  Givet att `verify-architecture.js` låser taket vid 1000 rader
  När `pnpm verify` körs
  Så avvisas framtida tillväxt mekaniskt.

**Scenario: ATT FÖRLIKAS – Grön verifiering i hela repot**
  Givet att tester och arkitekturgrindar exekveras
  När `pnpm verify` körs
  Så passerar samtliga kontroller med exit 0.
