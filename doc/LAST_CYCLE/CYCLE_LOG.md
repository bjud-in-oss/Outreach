# BYGGCYKEL LOGG: TCK-MAINT-040
**Starttid:** 2026-11-12T09:44:59.936Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-MAINT-040: Härdad Fas 2-avslutning, In-Loop AST-Grind och Maint-Regression

**Måldomän:** `scripts` (`scripts/run-planera-live.ts`)
**Mekanisk Acceptans:** Ett transient skripttest bevisar att `isFas2Complete()` kräver att alla filer i `getRequiredFiles()` finns i antingen `createdModules` eller `modifiedFiles`, att Gate 2c (AST-kontroll) körs inuti Fas 2:s självrättningsslinga innan testmotorn startas, samt att `isMaint`-körningar exekverar den fulla regressionssviten (`pnpm test`) i sin självrättningsloop. Alla tester passerar med exit 0.

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **Rigorös stängning av Fas 2 (isFas2Complete):**
   - I `scripts/run-planera-live.ts` ska `isFas2Complete()` ändras för `!isMaint`. Den får inte bara kontrollera `getMissingFiles().length === 0`.
   - Den måste kontrollera: `const required = getRequiredFiles(); return getMissingFiles().length === 0 && required.every(f => modifiedFiles.includes(f) || createdModules.includes(f.replace(/\.(ts|tsx)$/, '')));` (där `createdModules` saknar filändelse).
2. **Flytta in Gate 2c i Självrättningsslingan (TDD-loopen):**
   - Raderna kring `Verifierar Gate 2c: AST-kontroll...` och `node scripts/drivers/ts.js --check-catch-blocks` (runt rad 738) MÅSTE flyttas IN inuti `while (!testPassed && attempts < 3)`-loopen, precis före anropet till `npx vitest run ${transientTestFile}`.
   - Detta tillåter modellen att fånga och åtgärda AST-fel via underhållsprompten i stället för att hela bygget tvärdör.
3. **Fullständig regressionskontroll vid Maint:**
   - I MAINT-valideringen (runt rad 674) i `while (!maintPassed && maintAttempts < 3)`-loopen ska `execSync('pnpm test', { stdio: 'inherit', cwd: ROOT_DIR });` läggas till EFTER skripttesterna.
   - Detta garanterar att ändringar i shared-infrastruktur (`isMaint`) inte tyst bryter funktionella domäner under underhåll.

---

## Scenariotriad (Den relationella och systemiska avsikten)

**Scenario: ATT FÖLJA – Byggmotorn lagar sig själv innan krasch**
  Givet en källkodsagent som skapar ett tomt catch-block eller glömmer uppdatera en befintlig fil
  När Fas 2-loopen når sitt utvärderingssteg
  Så ska AST-granskaren fånga felet inuti loopen och `isFas2Complete` hålla mikrokanalen öppen
  Så att agenten kan självrätta felet.

**Scenario: ATT VÄNDA OM – Avvisande av för tidiga loop-avslut**
  Givet att en biljett stipulerar uppdatering av fil A och nyskapande av fil B
  När fil B skapats men fil A ännu inte är uppdaterad
  Så ska `isFas2Complete()` returnera false och tvinga modellen att anropa `apply_patch` för A
  Innan kanalen tillåts stängas.

**Scenario: ATT FÖRLIKAS – Ett vattentätt ramverk för TCK-051**
  Givet att `run-planera-live.ts` är uppdaterad
  När `pnpm verify` körs
  Så passerar alla befintliga mekanismer med exit 0.

```


#### 1a Att följa: Intention & Nytta
Vårt uppdrag med TCK-MAINT-040 är att göra vår byggmotor mer robust och självläkande. Vi ska härda stängningsvillkoren för Fas 2 och flytta in AST-granskningen i självrättningsslingan. Detta gör att vi kan fånga upp fel direkt och åtgärda dem innan bygget kraschar. Det ger ett mer förutsägbart och stabilt flöde för underhållskörningar.


#### 0a Att vända om: Kontraktsaudit
Jag har granskat kontraktet för TCK-MAINT-040. Det är tydligt och fokuserat på att härda byggmotorn genom att integrera AST-kontrollen direkt i loopen och kräva full regressionstestning vid underhåll. Avsikterna och de systemiska invarianterna är väl definierade. Jag är redo att påbörja arbetet.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
För TCK-MAINT-040 utvärderar vi tre ortogonala alternativ för att uppfylla kontraktskraven; alternativ ett fokuserar på inline-integrering i befintlig loop, alternativ två bygger på modulära valideringsfunktioner, och alternativ tre använder en tillståndshanterare förloop-progressionen.


#### 2c Att vända om: Resiliensgranskning
Resiliensgranskningen visar att alternativ ett, med inline-integrering, ger den högsta isoleringen mot sidoeffekter och uppfyller kontraktskravet på ett deterministiskt sätt inuti TDD-slingan utan att öka systemkomplexiteten.


#### 2d Att förlikas: Mättnad
Vi slår fast att alternativ ett, med sin inbyggda isolering och deterministiska metod för TDD-slingan, är det vinnande kontraktet. Det uppfyller kraven perfekt utan att addera komplexitet. MÄTTNAD: JA.
