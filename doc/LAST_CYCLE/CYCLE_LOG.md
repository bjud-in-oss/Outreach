# BYGGCYKEL LOGG: TCK-MAINT-043
**Starttid:** 2026-11-12T11:27:37.105Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-MAINT-043: Källkodskontext i Gate 2c, execCaptured och Efemär Handskakningsutjämning

**Måldomän:** `scripts`
**Målfiler:** `scripts/drivers/ts.js`, `scripts/run-planera-live.ts`
**Mekanisk Acceptans:** Ett transient skripttest bevisar att:
1. `scripts/drivers/ts.js` (`--check-catch-blocks`) skriver ut den faktiska källkodsraden (`-> ...`) vid tomma `catch {}`-block.
2. `scripts/run-planera-live.ts` definierar och använder `execCaptured(cmd)` (som strömmar utskrift och fångar samlad `stdout`/`stderr` vid fel) i BÅDE `isMaint`-valideringsloopen och Fas 2:s Gate 2c/Vitest-loop, samt att Fas 2:s `retryPrompt` tillåter `apply_patch` vid `GATE 2c BROTT`.
3. `runMicroChannel` behåller helt efemära, minnesisolerade `BidiLiveSession`-instanser per makrosteg (SI v10.5 § 3.2) och lägger in en kort deterministisk paus på 400 ms efter `runner.close()` för att jämna ut handskakningstakten.
Samtliga skripttester, domäntester och FSD-kontroller passerar med exit 0.

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **Källkodskontext i Gate 2c (`scripts/drivers/ts.js`):**
   - I `--check-catch-blocks`: när ett tomt `catch {}`-block upptäcks på `line`, hämta radens text via `const lineText = sourceFile.text.split('\n')[line]?.trim() || '';` och inkludera den i felutskriften:
     `console.error(\`❌ GATE 2c BROTT: Tomt catch-block i \${path.relative(ROOT_DIR, filePath)}:\${line + 1} -> \${lineText}\`);`
2. **Gemensam `execCaptured(cmd)` i `scripts/run-planera-live.ts`:**
   - Lägg till hjälpfunktionen `execCaptured(cmd: string): string` som kör `execSync(cmd, { encoding: 'utf-8', stdio: 'pipe', cwd: ROOT_DIR })`, strömmar utdata till `process.stdout.write` vid framgång och kastar `new Error(combined)` med samlad `stdout` + `stderr` vid fel.
   - Ersätt `execSync(..., { stdio: 'inherit', cwd: ROOT_DIR })` med `execCaptured(...)` i BÅDE `if (isMaint)`-valideringsloopen (`verify-architecture.js`, `vitest run scripts/__tests__/`, `pnpm test`) och i Fas 2:s `while (!testPassed && attempts < 3)`-loop (både för `ts.js --check-catch-blocks` och `npx vitest run ${transientTestFile}`).
   - Uppdatera `retryPrompt` i Fas 2 så att den uttryckligen tillåter både `apply_patch` och `save_code` och instruerar modellen att åtgärda eventuella `GATE 2c BROTT` (tomma `catch {}`-block) på den angivna raden.
3. **Efemära mikrokanaler med 400 ms handskakningspaus (`scripts/run-planera-live.ts`):**
   - I `runMicroChannel`: behåll skapandet av en ny, minnesisolerad `BidiLiveSession` per anrop (inga delade sessioner mellan makrosteg), men lägg till `await new Promise((r) => setTimeout(r, 400));` direkt efter `runner.close();` i både `try`- och `catch`-grenen så att handskakningstakten mot edge-servrarna jämnas ut utan kontextsvullnad.

---

## Scenariotriad (Den relationella och systemiska avsikten)

**Scenario: ATT FÖLJA – Full felinsyn och jämn anslutningstakt utan kontextsvullnad**
  Givet att Byggmotorn exekverar sekventiella mikrokanaler och validerar källkod
  När en session stängs eller Gate 2c/Vitest rapporterar ett fel
  Så ska 400 ms paus jämna ut handskakningstakten och `execCaptured` leverera exakt fil, radnummer och kodrad till självrättningsagenten
  Medan varje mikrokanal behåller sitt magra, isolerade minnesfönster.

**Scenario: ATT VÄNDA OM – Avvisande av tysta stdio-fel och delade planeringssessioner**
  Givet att `stdio: 'inherit'` tidigare lämnade `err.stdout` och `err.stderr` tomma och delade sessioner riskerar 65K TPM-överskridning
  När `execCaptured` används i isolerade mikrokanaler
  Så fångas varje felrad deterministiskt utan att belasta TPM-taket
  Och granskande roller behåller full epistemisk distans.

**Scenario: ATT FÖRLIKAS – En ren, resilient och token-snål byggmotor inför TCK-051**
  Givet att `scripts/drivers/ts.js` och `scripts/run-planera-live.ts` är uppdaterade
  När `pnpm verify` körs
  Så passerar samtliga skript- och domäntester med exit 0.

```


#### 1a Att följa: Intention & Nytta
Jag förstår uppdraget. Målet är att stärka systemets resiliens genom att ge full felinsyn vid tomma catch-block och skapa en jämnare handskakningstakt genom efemära mikrokanaler. Detta kommer att ge oss en mycket säkrare utvecklingsmiljö.


#### 0a Att vända om: Kontraktsaudit
Kontraktet för TCK-MAINT-043 är granskat och accepterat. Jag har säkerställt att kraven på källkodskontext i Gate 2c, implementeringen av `execCaptured`, samt den efemära handskakningsutjämningen är i linje med våra systemiska invarianter. Vi är redo att gå vidare med exekveringen.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
Vi kan lösa detta genom att implementera `execCaptured` och källkodskontext.

Det första alternativet är en proceduriell ansats där vi lägger till `execCaptured` direkt i `run-planera-live.ts`, splittar texten manuellt för radkontext och använder en enkel fördröjning.

Det andra alternativet innebär en inkapslad verktygsfunktion som använder TypeScript-API:et för mer exakt källkodsutdrag och integrerar pausen i sessionens asynkrona livscykel.

Det tredje alternativet bygger på att vi strömmar data simultant under processkörning och använder den inbyggda AST-metodiken för att fånga upp eventuella felaktigheter i realtid utan extra komplexitet för utvecklaren.


#### 2c Att vända om: Resiliensgranskning
Resiliensgranskningen av alternativen visar att det andra alternativet är mest resilient eftersom det utnyttjar TypeScript-API:et för exakt radkontext och integrerar pausen direkt i sessionens livscykel, vilket förhindrar tysta fel och minnesproblem.


#### 2d Att förlikas: Mättnad
Jag har vägt spänningsfältet och granskat det semantiska deltat. Det andra alternativet vinner eftersom det garanterar den resiliens och exakthet som krävs för körtidskontraktet. Jag deklarerar härmed MÄTTNAD: JA.
