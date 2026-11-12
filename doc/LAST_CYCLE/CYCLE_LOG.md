# BYGGCYKEL LOGG: TCK-MAINT-048
**Starttid:** 2026-11-12T13:07:43.298Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-MAINT-048: Bryt ut skriptverktyg till scripts/lib/ och sänk Strangler Fig-taket till 800 rader

**Måldomän:** `scripts`
**Målfiler:** `scripts/lib/shellAndBackup.ts`, `scripts/lib/ticketAndAnchor.ts`, `scripts/run-planera-live.ts`, `scripts/verify-architecture.js`
**Mekanisk Acceptans:**
1. Hjälpfunktionerna `execCaptured`, `dumpCrashDiff`, `restoreScriptsBackup`, `getRequiredFiles` och `buildRetryAnchor` (med hårt tak på 24 000 tecken) är utbrutna till `scripts/lib/shellAndBackup.ts` och `scripts/lib/ticketAndAnchor.ts` (< 250 rader per fil).
2. `scripts/run-planera-live.ts` importerar och använder dessa moduler utan att förlora någon befintlig funktionalitet och krymper under 800 rader.
3. `LEGACY_SCRIPT_CAPS['run-planera-live.ts']` i `scripts/verify-architecture.js` sänks från `1065` till `800`.
4. Ett test i `scripts/__tests__/scriptLibs.test.ts` verifierar funktionerna, och `pnpm verify` passerar med exit 0.

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **Bevara 100 % av befintligt beteende vid flytt:**
   - I `scripts/lib/shellAndBackup.ts`: flytta `execCaptured(cmd, rootDir)`, `dumpCrashDiff(rootDir)` och `restoreScriptsBackup(rootDir)` med exakt samma felhantering, `CRASH_DIFF.patch`-skrivning och `doc/LAST_CYCLE/scripts_backup/`-återställning.
   - I `scripts/lib/ticketAndAnchor.ts`: flytta `getRequiredFiles(ticketPrompt, isMaint, targetDomain)` och skapa `buildRetryAnchor(testContent, currentSourceSummary, testLog, maxChars = 24000)` som trunkerar `currentSourceSummary` deterministiskt om totala teckenlängden överstiger `maxChars`.
2. **Krymp och lås `scripts/run-planera-live.ts` (< 800 rader):**
   - Ersätt de flyttade funktionerna i `scripts/run-planera-live.ts` med rena importer från `./lib/shellAndBackup.js` och `./lib/ticketAndAnchor.js`.
   - Uppdatera `LEGACY_SCRIPT_CAPS` i `scripts/verify-architecture.js` till `{ 'run-planera-live.ts': 800, 'bidiLiveRunner.ts': 345 }`.
3. **Verifiera med skripttest:**
   - Skapa `scripts/__tests__/scriptLibs.test.ts` som testar både `getRequiredFiles` (med `**Målfiler:**` och fallback) och `buildRetryAnchor` (trunkering vid >24 000 tecken).

---

## Scenariotriad (Den relationella och systemiska avsikten)

**Scenario: ATT FÖLJA – Ren utbrytning utan beteendeförlust**
  Givet att `run-planera-live.ts` innehåller fristående hjälpfunktioner för skalexekvering, backup och biljettparsning
  När dessa flyttas till `scripts/lib/` och täcks av enhetstester
  Så minskar monoliten med över 230 rader samtidigt som varje skyddsmekanism förblir intakt
  Och `retryAnchor` skyddas mot TPM-överskridning.

**Scenario: ATT VÄNDA OM – Avvisande av regresserande radtillväxt**
  Givet att `verify-architecture.js` sänker radtaket för `run-planera-live.ts` till 800 rader
  När framtida ändringar kör `pnpm verify`
  Så garanterar Grind 4 att utbrytningen är permanent.

**Scenario: ATT FÖRLIKAS – Grön verifiering i hela repot**
  Givet att samtliga moduler och tester är sparade
  När `pnpm verify` körs
  Så passerar alla tester och arkitekturgrindar med exit 0.

```


#### 1a Att följa: Intention & Nytta
Jag förstår helt. Avsikten här är att städa upp repot genom att modulera våra skriptverktyg, vilket gör systemet enklare att underhålla och minskar risken för oförutsedda problem framåt. Jag ska nu bryta ut dessa delar, minska huvudskriptet och aktivera testerna för att bekräfta att allt fungerar som det ska. Kan vi sätta igång?


#### 0a Att vända om: Kontraktsaudit
Uppdraget för TCK-MAINT-048 är granskat. Vi bevarar 100 % av beteendet vid utbrytningen, sänker taket för monoliten och säkrar arkitekturgrindarna. Det är en ren underhållsinsats utan risk för våra domäner i `src/features/`.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
Här är tre ortogonala alternativ för att lösa TCK-MAINT-048 utifrån målet att bryta ut skriptverktyg och säkra omvända radtak för monoliten.

Alternativ 1 innebär direktfunktionell utbrytning till rena TypeScript-moduler i scripts/lib/. Funktionerna flyttas oförändrade, `scripts/run-planera-live.ts` uppdateras med relativa importer och arkitekturgrinden sänks mekaniskt. Detta bevarar 100 % funktionalitet i oförändrad struktur.

Alternativ 2 föreslår en strukturell omformulering genom att gruppera hjälpfunktionerna i klassinstanser inuti de nya biblioteksfilerna. Vi skapar Manager- och Builder-strukturer för isolerad hantering, vilket underlättar framtida tillståndskontroll, men ger en aningen mer komplex instansiering som behöver hanteras.

Alternativ 3 fokuserar på funktionell renhet genom att injicera beroenden, såsom rootDir och loggstömmar, explicit som argument till funktionerna. Detta frikopplar modulerna från globala variabler och maximerar testbarheten utan att behöva mocka externa miljövariabler, helt i linje med de strikta kraven på enhetstester.


#### 2c Att vända om: Resiliensgranskning
Granskningen visar att Alternativ 1 är mest resilient för att bevara 100 % befintligt beteende, vilket krävs i kontraktet. Alternativ 3 ger bäst testbarhet, men Alternativ 1 medför lägst risk för buggar vid flytten.


#### 2d Att förlikas: Mättnad
Jag slår fast att Alternativ 1 är vårt vinnande kontrakt. Det säkrar 100 % bevarat beteende med lägst risk för buggar, vilket väger tyngre än fördelarna i alternativ 3. MÄTTNAD: JA.
