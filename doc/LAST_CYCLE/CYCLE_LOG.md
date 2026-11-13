# BYGGCYKEL LOGG: TCK-MAINT-058
**Starttid:** 2026-11-13T22:07:55.342Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
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

```


#### 1a Att följa: Intention & Nytta
Uppdraget med TCK-MAINT-058 handlar om att stärka vår inre resiliens genom att sätta hårdare gränser för kodkvalitet. Genom att blockera tautologiska alibier, städa bort skördad legacy-kod och införa en säker återställning vid krascher, bygger vi ett system som håller hög standard och främjar pålitlighet.


#### 0a Att vända om: Kontraktsaudit
Kontraktsaudit för TCK-MAINT-058 är genomförd och kraven är validerade. Spärren mot tautologiska alibier i `ts.js` kommer att hålla filens radantal under gränsen, och det negativa testet säkerställer att grinden fungerar. Ändringarna i `run-planera-live.ts` ger stabilitet vid upprepade krascher.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
Här är tre ortogonala alternativ för att lösa biljetten TCK-MAINT-058.

Alternativ ett: Direkt processkontroll. Här implementerar vi spärren i ts.js och förlitar oss på exekvering av externa processer i testet.

Alternativ två: Temporär kontextisolering. Vi hanterar testkörningen genom att skriva testkod till temporära filer för processisolation.

Alternativ tre: Funktionell AST-injektion. Vi utnyttjar befintliga mekanismer för AST-analys inuti samma minnesrymd för att verifiera spärren.


#### 2c Att vända om: Resiliensgranskning
Resiliensgranskningen visar att alternativ ett, direkt processkontroll, ger högst tillförlitlighet genom att testa den faktiska exekveringsvägen och felhanteringen. Det säkrar att inga syntetiska spioner läcker och att systemet kraschar deterministiskt. De andra alternativen innebär risker med filsystemshantering eller isolerad minnesrymd som kan dölja latenta fel.


#### 2d Att förlikas: Mättnad
Jag fastställer härmed att Alternativ 1, direkt processkontroll, är det vinnande kontraktet. Det säkrar en deterministisk kraschkultur och eliminerar dolda latenta fel. MÄTTNAD: JA.
