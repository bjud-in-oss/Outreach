# BYGGCYKEL LOGG: TCK-MAINT-042
**Starttid:** 2026-11-12T10:48:17.786Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-MAINT-042: Handskakningssäker WS 1011-omsändning, Målfilskontroll, Gate 2c-kontext och execCaptured

**Måldomän:** `scripts`
**Målfiler:** `scripts/bidiLiveRunner.ts`, `scripts/run-planera-live.ts`, `scripts/drivers/ts.js`
**Mekanisk Acceptans:** Ett transient skripttest bevisar att:
1. `BidiLiveSession.send()` i `scripts/bidiLiveRunner.ts` sätter `this.pendingText = text` FÖRE `await this.connect()`, anropar `waitForSession()` före `sendClientContent`, och återansluter vid `WS 1011`/`1006` när `this.currentResolver` eller `this.pendingText` är aktiv.
2. `scripts/run-planera-live.ts` definierar hjälparen `execCaptured(cmd)` som strömmar utskrift till terminalen och kastar fel med samlad `stdout`/`stderr`, och använder den i BÅDE `isMaint`-valideringsloopen och Fas 2:s Gate 2c/Vitest-loop.
3. `getRequiredFiles()` i `scripts/run-planera-live.ts` prioriterar raden `**Målfiler:**` i biljetthuvudet, och `isFas2Complete()` kräver `required.every(f => modifiedFiles.includes(f))` för BÅDE `isMaint` och `!isMaint`.
4. Gate 2c (`--check-catch-blocks`) i `scripts/drivers/ts.js` skriver ut den faktiska källkodsraden för tomma `catch {}`-block tillsammans med filnamn och radnummer.
Samtliga skripttester, domäntester och FSD-kontroller passerar med exit 0.

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **Handskakningssäker sändning i `scripts/bidiLiveRunner.ts`:**
   - I `send(text, timeoutMs = 120000)`: sätt `this.pendingText = text;` och `this.accumulatedText = '';` ALLRA FÖRST i metoden, INNAN `if (!this.session || this.isClosed) { await this.connect(); }`.
   - I `onclose`: ändra villkoret `if (!this.currentResolver)` till `if (!this.currentResolver && !this.pendingText)` så att ett `WS 1011`-avbrott under handskakningen alltid triggar återanslutning.
   - Inuti `new Promise((resolve, reject) => { ... })` i `send()`: hämta sessionen via `this.waitForSession().then((activeSession) => { activeSession.sendClientContent(...); }).catch((err) => { if (this.currentRejecter) this.currentRejecter(err); });` i stället för att anropa `this.session.sendClientContent` direkt.
2. **Gemensam `execCaptured(cmd)` i `scripts/run-planera-live.ts`:**
   - Skapa hjälpfunktionen:
     ```ts
     function execCaptured(cmd: string): string {
       try {
         const out = execSync(cmd, { encoding: 'utf-8', stdio: 'pipe', cwd: ROOT_DIR });
         if (out) process.stdout.write(out);
         return out;
       } catch (err: any) {
         const combined = [err?.stdout, err?.stderr].filter(Boolean).join('\n').trim() || err?.message || String(err);
         if (combined) process.stderr.write(combined + '\n');
         throw new Error(combined);
       }
     }
     ```
   - Ersätt `execSync(..., { stdio: 'inherit', cwd: ROOT_DIR })` med `execCaptured(...)` i BÅDE `if (isMaint)`-valideringsloopen (`verify-architecture.js`, `vitest run scripts/__tests__/`, `pnpm test`) OCH i Fas 2:s `while (!testPassed && attempts < 3)`-loop (`ts.js --check-catch-blocks` och `vitest run ${transientTestFile}`), så att `errLog` och `testLog` alltid får full felkontext.
3. **Strukturerad `Målfiler`-parsning och universal Fas 2-kontroll i `scripts/run-planera-live.ts`:**
   - I `getRequiredFiles()`: kontrollera först om `ticketPrompt` matchar `/\*\*Målfiler:\*\*\s*(.+)/` och extrahera samtliga sökvägar inom backticks (`` `...` ``). Om raden saknas, använd befintlig regex-logik som fallback.
   - I `isFas2Complete()`: kontrollera för ALLA körningar (`isMaint` och `!isMaint`):
     `const required = getRequiredFiles(); const missing = getMissingFiles(); return missing.length === 0 && required.every(f => modifiedFiles.includes(f));`
   - I `getFas2FollowupPrompt()`: om `missing.length === 0`, kontrollera `const untouched = getRequiredFiles().filter(f => !modifiedFiles.includes(f));` och om `untouched.length > 0`, returnera en uppmaning som listar `untouched` och kräver `apply_patch` eller `save_code` på dessa filer.
4. **Källkodskontext i Gate 2c (`scripts/drivers/ts.js`):**
   - I `--check-catch-blocks`: när ett tomt `catch {}`-block upptäcks på `line`, hämta radens text via `const lineText = sourceFile.text.split('\n')[line]?.trim() || '';` och inkludera den i felutskriften:
     `console.error(\`❌ GATE 2c BROTT: Tomt catch-block i \${path.relative(ROOT_DIR, filePath)}:\${line + 1} -> \${lineText}\`);`

---

## Scenariotriad (Den relationella och systemiska avsikten)

**Scenario: ATT FÖLJA – Oavbruten leverans och full felinsyn i alla självrättningsloopar**
  Givet att `BidiLiveSession` skickar ett uppdrag eller att en validering i MAINT eller Fas 2 fallerar
  När `WS 1011` slår till under handskakningen eller ett test/AST-steg underkänns
  Så ska uppdraget återupptas utan `null`-krasch och `execCaptured` leverera komplett felutskrift med fil, radnummer och kodrad till självrättningsagenten
  Och bygget slutförs deterministiskt.

**Scenario: ATT VÄNDA OM – Avvisande av blinda felloggar och ofullständiga flerfilsbyggen**
  Givet att `stdio: 'inherit'` tidigare lämnade `err.stdout` och `err.stderr` tomma vid fel
  När `execCaptured` ersätter `stdio: 'inherit'` i valideringslooparna
  Så kan ingen självrättningsloop längre starta utan exakt felkontext
  Och `isFas2Complete` håller kanalen öppen tills samtliga utpekade `**Målfiler:**` har modifierats.

**Scenario: ATT FÖRLIKAS – En helgjuten byggmotor inför TCK-051**
  Givet att `scripts/bidiLiveRunner.ts`, `scripts/run-planera-live.ts` och `scripts/drivers/ts.js` är uppdaterade
  När `pnpm verify` körs
  Så passerar samtliga skript- och domäntester med exit 0.

```


#### 1a Att följa: Intention & Nytta
Syftet med det här uppdraget är att göra våra skript mycket stabilare och lättare att felsöka. Genom att säkra upp WS-handskakningen, fånga upp alla felmeddelanden korrekt och säkerställa att alla filer hanteras rätt kommer vi att få en betydligt pålitligare byggprocess.


#### 0a Att vända om: Kontraktsaudit
Jag har granskat kontraktet för TCK-MAINT-042. Alla systemiska invarianter, inklusive handskakningssäker sändning, execCaptured-hjälparen och Gate 2c-kontexten är tydligt definierade. Jag är redo att fortsätta.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
För att lösa TCK-MAINT-042 och uppfylla kraven i biljetten utan att introducera otillåtna beroenden kan vi formulera följande tre ortogonala alternativ.

Alternativ ett: Direkt modifiering med imperativ patching. Här uppdaterar vi BidiLiveSession direkt i repot genom att lägga till tillståndsändringar före anslutning, ersätter execSync med execCaptured i skripten och utökar TS-drivern med direktsträngsanalys för catch-block. Detta är en mycket direkt och okomplicerad metod.

Alternativ två: Funktionell omstrukturering och modulär separation. Vi extraherar sessionslogik till hjälpfunktioner för att hantera sändningskön, skapar en centraliserad exekveringsmodul för felhantering och implementerar en deklarativ filkontroll genom schema-validering. Detta bygger en mer robust och testbar arkitektur.

Alternativ tre: Tillståndsbaserad arkitektur och asynkron kontrollösning. Här omvandlar vi sessionen till en strikt tillståndsmaskin, bygger upp en asynkron händelsehanterare för säkra återanslutningar och använder AST-parsing som middleware för att inspektera och diagnostisera catcgh-block. Detta säkerställer högsta möjliga systemintegritet.


#### 2c Att vända om: Resiliensgranskning
Resiliensgranskningen visar att alternativ två är bäst på att hantera latenta fel. Genom modulärseparation isoleras sändningskö och felhantering vilket förhindrar att krascher sprids och möjliggör snabb återhämtning i osäkra nätverkslägen.


#### 2d Att förlikas: Mättnad
Vi har vägt spänningsfältet och det semantiska deltat är nu tydligt. Det vinnande kontraktet är fastställt: alternativ två för att garantera maximal resiliens och isolering genom modulärseparation. MÄTTNAD: JA.
