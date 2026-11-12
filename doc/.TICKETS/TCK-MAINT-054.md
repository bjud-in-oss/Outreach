# TCK-MAINT-054: Kompileringsskydd för scripts/*.ts, koppla saneraSkordadLegacy och laga pathNodePorts

**Måldomän:** `scripts`
**Målfiler:** `scripts/run-planera-live.ts`, `scripts/lib/pathNodePorts.ts`, `scripts/run-path.ts`, `scripts/run-tests.js`
**Mekanisk Acceptans:**
1. `scripts/run-planera-live.ts` behåller `MODEL_NAME`, `API_KEY`, `ai` och `systemInstruction` intakta, ersätter de lokala `getFeatureIndexText`/`getInstalledDependencies`/`appendCycleLog` med importer från `./lib/channelRunner.js` (så filen hålls <= 990 rader), anropar `saneraSkordadLegacy(ticketPath)` i Fas 3 och kör `esbuild`-kompileringsskydd i `MAINT`-valideringen.
2. `scripts/lib/pathNodePorts.ts` (< 250 rader) returnerar `{ avsikt, provning, konstruktion, besiktning }` i SAMTLIGA kodvägar (både `dryRun: true` och `dryRun: false`) och `scripts/run-path.ts` (< 250 rader) importerar `skapaBidiLiveAdapter` från `'../src/features/path'`.
3. `scripts/run-tests.js` (< 50 rader) listar kvarvarande `src/__tests__/*.legacy.ts`-filer vid testkörning, och `pnpm verify` passerar med exit 0.

---

## Destruktiva Handlingssteg (Obligatorisk städning)
- **Frigör radmarginal i `scripts/run-planera-live.ts`:** Ta bort den duplicerade rad 1 (`import { mutateSourceCodeAST } from './drivers/astMutator.js';`) samt de lokala funktionerna `getFeatureIndexText`, `getInstalledDependencies` och `appendCycleLog` (rad 52–69) och importera dem i stället från `'./lib/channelRunner.js'` så att filen stannar runt 980 rader (under 1000-taket).
- **Ersätt felaktiga portnycklar i `scripts/lib/pathNodePorts.ts`:** Ta bort ALLA förekomster av `{ avsiktsport, provningsport, konstruktionsport, besiktningsport }` i båda `return`-blocken och returnera `{ avsikt, provning, konstruktion, besiktning }`.

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **Kirurgisk uppdatering av `scripts/run-planera-live.ts` (<= 990 rader — RÖR INTE `MODEL_NAME`, `API_KEY`, `ai` eller `systemInstruction`):**
   - Lägg till `import { getFeatureIndexText, getInstalledDependencies, appendCycleLog } from './lib/channelRunner.js';` och `import { saneraSkordadLegacy } from './lib/fas3Consolidation.js';`.
   - Ta bort de lokala `getFeatureIndexText`, `getInstalledDependencies` och `appendCycleLog` (rad 52–69) så att radantalet minskar med ~18 rader.
   - I `MAINT`-valideringsloopen (runt rad 670): lägg till `execCaptured('npx esbuild scripts/run-planera-live.ts scripts/run-path.ts --bundle --platform=node --packages=external --outdir=/tmp/outreach-script-check');`.
   - I Fas 3 (direkt efter `execSync('pnpm verify', { stdio: 'inherit', cwd: ROOT_DIR });`): lägg till `if (!isMaint) saneraSkordadLegacy(ticketPath);`.
2. **Laga Vägmotorns Node-portar (`scripts/lib/pathNodePorts.ts` & `scripts/run-path.ts`):**
   - I `scripts/lib/pathNodePorts.ts` (< 250 rader): returnera `{ avsikt: skapaAvsiktsport({ prompter: async () => 'y', beskrivning: `Verifiera intention för ${deps.ticketId}` }), provning: skapaProvningsport({ testFilVag: deps.testFilVag || 'transient_test.ts', forvantatFel: 'Fail-First', testExekverare: async () => ({ passerade: false, exitKod: 1, felmeddelande: 'Förväntat Fail-First fel' }) }), konstruktion: skapaKonstruktionsport({ matris: deps.matris || [], inspekterare: async () => ({ existerar: true, antalRader: 50, exporteradIIndex: true }) }), besiktning: skapaBesiktningsport({ inspekterare: async () => ({ godkand: true }) }) }` i BÅDA grenarna.
   - I `scripts/run-path.ts` (< 250 rader): lägg till `skapaBidiLiveAdapter` i importen från `'../src/features/path'`.
3. **Synliggör kvarvarande legacy-skörd i `scripts/run-tests.js` (< 50 rader):**
   - Importera `fs` och `path` och logga `📦 [LEGACY-SKÖRD KVAR]: ...` om några `*.legacy.ts`-filer finns kvar under `src/__tests__/`.

---

## Scenariotriad (Den relationella och systemiska avsikten)

**Scenario: ATT FÖLJA – Byggmotorn skyddar sig själv mot trasiga skript och städar skördad legacy**
  Givet att `run-planera-live.ts` håller sig under 990 rader
  När `MAINT`-valideringen kör `esbuild`-bundling och Fas 3 anropar `saneraSkordadLegacy(ticketPath)`
  Så kan inga trasiga skriptreferenser passera grönt och skördade `*.legacy.ts`-filer raderas efter grön verifiering.

**Scenario: ATT VÄNDA OM – Avvisande av obundlade skriptändringar och trasiga portnycklar**
  Givet att `TCK-MAINT-053` tidigare passerade utan att `run-planera-live.ts` kompilerades
  När `esbuild` validerar `run-planera-live.ts` och `run-path.ts`
  Så upptäcks eventuella `ReferenceError` eller saknade importer omedelbart i Fas 2.

**Scenario: ATT FÖRLIKAS – Grön verifiering i hela repot**
  Givet att samtliga skript och grindar är uppdaterade
  När `pnpm verify` körs
  Så passerar alla grindar och tester med exit 0.
