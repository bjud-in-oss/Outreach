# TCK-MAINT-058: Slutför tautologispärren i ts.js (med negativt test), radera envelope.legacy.ts och installera dubbelkrasch-checkout

**Måldomän:** `scripts`
**Målfiler:** `scripts/drivers/ts.js`, `scripts/__tests__/scriptLibs.test.ts`, `scripts/run-planera-live.ts`, `src/features/gemini_live_swarm/__tests__/swarmEventBus.test.tsx`
**Skördad Legacy:** `src/__tests__/envelope.legacy.ts`
**Mekanisk Acceptans:**
1. `scripts/drivers/ts.js` (strikt <= 248 rader) avbryter med `process.exit(1)` och `❌ GATE 3a BROTT` när `hasTautologyAssertion` är `true` i `--check-alibi`.
2. `scripts/__tests__/scriptLibs.test.ts` innehåller ett negativt körtidstest som kör `node scripts/drivers/ts.js --check-alibi` mot en temporär fil i `os.tmpdir()` med `expect(true).toBe(true)` och verifierar att grinden kastar/returnerar icke-noll exit-kod.
3. Placeholder-påståendet `expect(true).toBe(true);` i `src/features/gemini_live_swarm/__tests__/swarmEventBus.test.tsx` ersätts med ett verkligt körtidstest av `eventBus.clear()`.
4. `scripts/run-planera-live.ts` (<= 960 rader) kör `git checkout -- src/features/${targetDomain} 2>/dev/null || true` i `else`-grenen vid `attempts >= 3` innan `process.exit(1)`, samt anropar `saneraSkordadLegacy(ticketPath)` för både funktions- och `MAINT`-biljetter.
5. `src/__tests__/envelope.legacy.ts` är borttagen och `pnpm verify` passerar med exit 0.

---

## Destruktiva Handlingssteg (Obligatorisk städning)
- **Slutför ADR-030-skörden:** Radera `src/__tests__/envelope.legacy.ts` (samtliga 3 scenarier körs nu i `src/shared/__tests__/envelope.test.ts`).
- **Ta bort tautologi-alibi:** Ersätt `expect(true).toBe(true);` i `src/features/gemini_live_swarm/__tests__/swarmEventBus.test.tsx` med ett skarpt `eventBus.clear()`-test.

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **Kompakt utgång för `hasTautologyAssertion` i `scripts/drivers/ts.js` (strikt <= 248 rader — filen har 239 rader i dag):**
   - Lägg in exakt 4 rader direkt före `if (hasIllegalFsRead) {`: `if (hasTautologyAssertion) { console.error(\`❌ GATE 3a BROTT i ${targetFile}: Tautologisk alibi-assertion (t.ex. expect(true).toBe(true)) är förbjuden!\`); process.exit(1); }` så att filen stannar på 243 rader (under 250-taket).
2. **Negativt Gate 3a-test i `scripts/__tests__/scriptLibs.test.ts` (< 80 rader):**
   - Skriv en temporär fil i `os.tmpdir()` med innehållet `expect(true).toBe(true);`, kör `execFileSync('node', ['scripts/drivers/ts.js', '--check-alibi', '--file', tmpFile])` inuti `expect(() => ...).toThrow()`, och ta bort temporärfilen i `finally`.
3. **Ersätt `expect(true).toBe(true)` i `src/features/gemini_live_swarm/__tests__/swarmEventBus.test.tsx`:**
   - Byt ut `expect(true).toBe(true);` mot prenumeration på `'test.clear'`, `eventBus.clear()`, `eventBus.emit('test.clear', {})` och `expect(clearedCount).toBe(0)`.
4. **Installera dubbelkrasch-checkout och universell `saneraSkordadLegacy` i `scripts/run-planera-live.ts` (<= 960 rader):**
   - I `else`-grenen vid `attempts >= 3` (runt rad 752–755): lägg till `if (!isMaint) { try { execSync(\`git checkout -- src/features/${targetDomain} 2>/dev/null || true\`, { cwd: ROOT_DIR }); } catch (err: any) { console.warn('Checkout vid cykelspärr misslyckades:', err?.message); } }` direkt före `console.error('❌ Cykelspärr nådd: Max 1 omvändelse tillåten per körning.');`.
   - Runt rad 853: ändra `if (!isMaint) saneraSkordadLegacy(ticketPath);` till `saneraSkordadLegacy(ticketPath);` så att även `TCK-MAINT-058` automatiskt raderar `src/__tests__/envelope.legacy.ts` efter grön `pnpm verify`.

---

## Scenariotriad (Den relationella och systemiska avsikten)

**Scenario: ATT FÖLJA – Bevisad tautologispärr, noll legacy-skuld och rent arbetsområde vid dubbelkrasch**
  Givet att `ts.js`, `scriptLibs.test.ts`, `swarmEventBus.test.tsx` och `run-planera-live.ts` uppdateras
  När `pnpm verify` körs
  Så bevisar ett negativt test att `expect(true).toBe(true)` avvisas med exit 1, `envelope.legacy.ts` raderas och dubbelkrascher återställer måldomänen.

**Scenario: ATT VÄNDA OM – Avvisande av halvimplementerade grindar**
  Givet att `hasTautologyAssertion` tidigare sattes utan att stoppa körningen
  När utgångsvillkoret kopplas in och testas negativt
  Så kan tautologispärren aldrig tyst kopplas ur.

**Scenario: ATT FÖRLIKAS – Grön verifiering i hela repot**
  Givet att samtliga ändringar är applicerade
  När `pnpm verify` körs
  Så passerar arkitekturgrindar, radgränser och hela testsviten med exit 0.
