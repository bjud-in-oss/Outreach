# TCK-MAINT-059: Koppla Gate 3a till pathNodePorts, slutför scriptLibs-tester, dubbelkrasch-checkout och radera envelope.legacy.ts

**Måldomän:** `scripts`
**Målfiler:** `scripts/lib/pathNodePorts.ts`, `scripts/run-path.ts`, `scripts/__tests__/scriptLibs.test.ts`, `scripts/run-planera-live.ts`, `src/features/gemini_live_swarm/__tests__/swarmEventBus.test.tsx`
**Skördad Legacy:** `src/__tests__/envelope.legacy.ts`
**Mekanisk Acceptans:**
1. `scripts/lib/pathNodePorts.ts` (< 120 rader) importerar `skapaAvsiktsport`, `skapaProvningsport`, `skapaKonstruktionsport`, `skapaBesiktningsport` från `'../../src/features/path/index.js'`, returnerar `{ avsikt, provning, konstruktion, besiktning }` som rena portfunktioner `(kontext) => Promise<PortResult>` (ALDRIG `.kor()`), och kör `node scripts/drivers/ts.js --check-alibi --file <testFilVag>` i `provning` (samt `--check-catch-blocks` i `konstruktion` och `pnpm verify` i `besiktning` när `deps.dryRun === false`).
2. `scripts/run-path.ts` (< 130 rader) importerar `skapaBidiLiveAdapter` från `'../src/features/path'`.
3. `scripts/__tests__/scriptLibs.test.ts` (< 95 rader) använder toppnivå-ESM-`import { skapaNodePathPortar } from '../lib/pathNodePorts';` (ALDRIG `require()`) och verifierar både portnycklarna (`avsikt`, `provning`, `konstruktion`, `besiktning`) och att `node scripts/drivers/ts.js --check-alibi` kastar vid `expect(true).toBe(true)`.
4. `scripts/run-planera-live.ts` (<= 980 rader) kör `git checkout -- src/features/${targetDomain} 2>/dev/null || true` i `else`-grenen vid `attempts >= 3` innan `process.exit(1)`, samt anropar `saneraSkordadLegacy(ticketPath)` utan `if (!isMaint)`-spärr.
5. `expect(true).toBe(true);` i `src/features/gemini_live_swarm/__tests__/swarmEventBus.test.tsx` ersätts med ett skarpt körtidstest av `eventBus.clear()`, och `src/__tests__/envelope.legacy.ts` raderas i Fas 3.
6. `pnpm verify` passerar med exit 0.

---

## Destruktiva Handlingssteg (Obligatorisk städning)
- **Slutför ADR-030-skörden:** Radera `src/__tests__/envelope.legacy.ts` (samtliga 3 scenarier körs redan i `src/shared/__tests__/envelope.test.ts`).
- **Ta bort tautologi-alibi:** Ersätt `expect(true).toBe(true);` i `src/features/gemini_live_swarm/__tests__/swarmEventBus.test.tsx` med ett skarpt `eventBus.clear()`-test.
- **Ersätt felaktiga portnycklar i `scripts/lib/pathNodePorts.ts`:** Ta bort `{ avsiktsport, provningsport, konstruktionsport, besiktningsport }` och returnera `{ avsikt, provning, konstruktion, besiktning }`.

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **Exakta portfabriker och funktionssignaturer i `scripts/lib/pathNodePorts.ts` (< 120 rader):**
   - Behåll importerna `skapaAvsiktsport`, `skapaProvningsport`, `skapaKonstruktionsport`, `skapaBesiktningsport` från `'../../src/features/path/index.js'` (döp ALDRIG om dem till `skapaAvsikt` etc.).
   - Skapa basportarna med deras verkliga options-objekt:
     * `const avsikt = skapaAvsiktsport({ prompter: async () => 'y', beskrivning: 'Verifiera intention' });`
     * `const provning = skapaProvningsport({ testFilVag: deps.testFilVag || 'transient_test.ts', forvantatFel: 'Fail-First', testExekverare: async () => ({ passerade: false, exitKod: 1, felmeddelande: 'Fail-First' }) });`
     * `const konstruktion = skapaKonstruktionsport({ matris: deps.matris || [], inspekterare: async () => ({ existerar: true, antalRader: 50, exporteradIIndex: true }) });`
     * `const besiktning = skapaBesiktningsport({ inspekterare: async () => ({ godkand: true }) });`
   - När `deps.dryRun !== false`: returnera `{ avsikt, provning, konstruktion, besiktning }`.
   - När `deps.dryRun === false`: omslut `provning`, `konstruktion` och `besiktning` som asynkrona funktioner `async (kontext) => { execCaptured(...); return basPort(kontext); }` (anropa ALDRIG `.kor()`).
   - Lägg till `skapaBidiLiveAdapter,` i importen från `'../src/features/path'` i `scripts/run-path.ts`.
2. **ESM-import i `scripts/__tests__/scriptLibs.test.ts` (< 95 rader — FÖRBJUD `require`):**
   - Lägg `import { skapaNodePathPortar } from '../lib/pathNodePorts';` högst upp i filen.
   - Testa både `skapaNodePathPortar` (`dryRun: true` -> funktionerna `avsikt`, `provning`, `konstruktion`, `besiktning`) och att `execFileSync('node', ['scripts/drivers/ts.js', '--check-alibi', '--file', tmpFile], { stdio: 'pipe' })` kastar när filen i `os.tmpdir()` innehåller `expect(true).toBe(true);` (rensa i `finally`).
3. **Ersätt `expect(true).toBe(true)` i `src/features/gemini_live_swarm/__tests__/swarmEventBus.test.tsx`:**
   - Byt ut `expect(true).toBe(true);` mot prenumeration på `'test.clear'`, `eventBus.clear()`, `eventBus.emit('test.clear', {})` och `expect(clearedCount).toBe(0)`.
4. **Dubbelkrasch-checkout och universell `saneraSkordadLegacy` i `scripts/run-planera-live.ts` (<= 980 rader):**
   - I `else`-grenen vid `attempts >= 3` (runt rad 752–755): lägg till `if (!isMaint) { try { execSync(\`git checkout -- src/features/${targetDomain} 2>/dev/null || true\`, { cwd: ROOT_DIR }); } catch (err: any) { console.warn('Checkout vid cykelspärr misslyckades:', err?.message); } }` direkt före `console.error('❌ Cykelspärr nådd: Max 1 omvändelse tillåten per körning.');`.
   - Runt rad 853: ändra `if (!isMaint) saneraSkordadLegacy(ticketPath);` till `saneraSkordadLegacy(ticketPath);`.

---

## Scenariotriad (Den relationella och systemiska avsikten)

**Scenario: ATT FÖLJA – Gemensam Gate 3a-spärr och testade Node-portar i Vägmotorn**
  Givet att `pathNodePorts.ts` använder rätt portfabriker och anropar `--check-alibi`
  När `pnpm verify` körs
  Så bevisar `scriptLibs.test.ts` (via ESM-import) att både tautologispärren och portnycklarna fungerar skarpt.

**Scenario: ATT VÄNDA OM – Nollställning av kvarlämnad legacy och dubbelkrascher**
  Givet att `envelope.legacy.ts` fortfarande låg kvar och dubbelkrascher lämnade ändringar i `src/features/`
  När `saneraSkordadLegacy` körs universellt och `git checkout` läggs in vid `attempts >= 3`
  Så töms `*.legacy.ts`-kön helt och arbetsområdet förblir rent.

**Scenario: ATT FÖRLIKAS – Grön verifiering i hela repot**
  Givet att samtliga ändringar är applicerade
  När `pnpm verify` körs
  Så passerar arkitekturgrindar, radgränser och hela testsviten med exit 0.
