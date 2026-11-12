# BYGGCYKEL LOGG: TCK-MAINT-049
**Starttid:** 2026-11-12T13:27:49.139Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
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

```


#### 1a Att följa: Intention & Nytta
Det här underhållet handlar om att skapa en renare och mer stabilare miljö för våra processer. Genom att bryta ut kod till bibliotek och hålla nere storleken på våra skript, säkerställer vi att systemet förblir överblickbart och fritt från onödiga dubbletter. Jag sätter igång med att sanera och förankra dessa ändringar nu.


#### 0a Att vända om: Kontraktsaudit
Jag har gått igenom kontraktet för TCK-MAINT-049 och bekräftar att uppdraget omfattar sanering av dubblettkod i `run-planera-live.ts`, integration av `buildRetryAnchor`, samt sänkning av radtaket i `verify-architecture.js` till 1000 rader. Kontraktet är tydligt och gränserna fastställda.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
Här är de tre ortogonala alternativen för att lösa TCK-MAINT-049 och säkerställa att skripten är korrekt uppbyggda och under radtak.

Alternativ 1: Minimalistisk kirurgisk patchning. Detta innebär att vi direkt patchar `run-planera-live.ts` för att ta bort dubbletterna och lägga till anropet till `buildRetryAnchor`, samt sänker taket i arkitekturarkivet. Testet i `scriptLibs.test.ts` fokuserar på karaktärisering av trunkeringen.

Alternativ 2: Testdriven isolering och validering. Vi bygger upp testerna först för `buildRetryAnchor` och `getRequiredFiles`, och när dessa är grönmarkerade ersätter vi den existerande logiken i huvudfilen. Detta ger en starkare tillförsikt till att beteendet förblir intakt.

Alternativ 3: Modulär omstrukturering och gränssnittsförstärkning. Vi flyttar ankarbyggandet till en renare abstraktion inom `./lib`, vilket minskar filstorleken i `run-planera-live.ts` ytterligare och skapar en renare koppling till testinvarianterna som vi verifierar via integrationstester.


#### 2c Att vända om: Resiliensgranskning
Alternativ 1 är effektivt men bär risk för regressionsfel om integrationen i huvudskriptet saknar en skyddande verifiering. Alternativ 2 uppvisar högst resiliens då TDD-ansatsen säkrar att beteendet förblir intakt innan implementering sker. Att vända sig om till Alternativ 2 ger oss bäst skydd mot latenta fel.


#### 2d Att förlikas: Mättnad
Jag har vägt spänningsfältet och det semantiska deltat mellan alternativen. Alternativ 2 vinner genom sin inneboende resiliens och strikta TDD-ansats, vilket skyddar mot latenta fel. Vi har nått full mognadskontroll och låser detta kontrakt. MÄTTNAD: JA.
