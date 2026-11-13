# BYGGCYKEL LOGG: TCK-060
**Starttid:** 2026-11-13T22:43:52.502Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-060: In-memory Gate 3a-tautologispärr, omvändelserollback och avveckling av sista legacy-filen

**Måldomän:** `path` (`src/features/path/`)
**Målfiler:** `src/features/path/engine/alibiInspector.ts`, `src/features/path/contracts/pathSchema.ts`, `src/features/path/engine/provningsport.ts`, `src/features/path/engine/pathRunner.ts`
**Skördad Legacy:** `src/__tests__/envelope.legacy.ts`
**Mekanisk Acceptans:** Ett hermetiskt Vitest-test bevisar (Fail-First mot körtidsankare utan `vi.fn()`/`vi.spyOn()`) att:
1. `inspectTestAlibis(testKod)` i `src/features/path/engine/alibiInspector.ts` (< 90 rader) fungerar helt i minnet (utan Node `fs`/`child_process`) och underkänner tautologiska assertions (`expect(true).toBe(true)`, `expect(false).toBe(false)`, identiska literaler), `fs.readFileSync`, rå källkodsmatchning (`'export function'`) samt `vi.fn()` utan körtidsankare.
2. `skapaProvningsport` i `src/features/path/engine/provningsport.ts` (< 65 rader) validerar `options.testKod` via `inspectTestAlibis` innan `testExekverare` körs, och returnerar `{ oppnad: false, omvandelseKrav: 'ÅTGÄRDA_TESTSYNTAX' }` vid alibibrott.
3. `exekveraRecept` i `src/features/path/engine/pathRunner.ts` (< 110 rader) stöder valfri `onOmvandelse(fel, kontext, forsok)` och `maxOmvandelseForsok` (default `1`) och kan fånga `PortNekadError` för att återställa tillståndet innan felet kastas vidare om försöken tar slut.
4. `src/__tests__/envelope.legacy.ts` raderas i Fas 3 och `pnpm verify` passerar med exit 0.

---

## Destruktiva Handlingssteg (Obligatorisk städning)
- **Sanera sista legacy-filen:** Radera `src/__tests__/envelope.legacy.ts` (då testerna redan existerar aktivt i `src/shared/__tests__/envelope.test.ts`).

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **Ren webbläsar- och VFS-kompatibel `src/features/path/engine/alibiInspector.ts` (< 90 rader):**
   - Importera ALDRIG `node:fs`, `node:path`, `child_process` eller `typescript` (så att Vägmotorn kan köras i webbläsarens VFS enligt ADR-026).
   - Exportera `inspectTestAlibis(testKod: string): { godkand: boolean; felmeddelande?: string }`.
2. **Utöka `ProvningsportOptionsSchema` i `src/features/path/contracts/pathSchema.ts` (< 150 rader):**
   - Lägg till `testKod: z.string().optional()` i `ProvningsportOptionsSchema` (härled typer via `z.infer`, duplicera aldrig manuellt i `model/types.ts`).
3. **Strikt Gate 3a-disciplin i testet (INGA `vi.fn()` eller kors-domänimporter):**
   - Importera ALDRIG `vi` från `vitest` och ALDRIG från `gemini_live_swarm`. Använd vanliga tillståndsvariabler (`let omvandelseAnropad = 0;`).
4. **Bevara bakåtkompatibilitet i `provningsport.ts` (< 65 rader) och `pathRunner.ts` (< 110 rader):**
   - Befintliga tester (`provningsport.test.ts`, `pathRunner.test.ts`, `classicRecipe.test.ts`) måste förbli gröna utan att kräva nya obligatoriska argument.

---

## Scenariotriad (Den relationella och systemiska avsikten)

**Scenario: ATT FÖLJA – Vägmotorn upprätthåller Gate 3a och omvändelserollback även i webbläsarens VFS**
  Givet att Vägmotorn körs i en serverlös webbläsarmiljö utan Node-skript
  När ett test med `expect(true).toBe(true)` skickas till Provningsporten eller en port nekas
  Så stoppar `inspectTestAlibis` alibit i minnet och `exekveraRecept` triggar återställning.

**Scenario: ATT VÄNDA OM – Slutgiltig städning av legacy och oändliga loopar**
  Givet att en port fortsätter att nekas efter `maxOmvandelseForsok` och att `envelope.legacy.ts` låg kvar
  När gränsen nås i `exekveraRecept` och Fas 3 körs
  Så kastas felet vidare, legacy-kön töms för alltid och arbetsområdet är rent.

**Scenario: ATT FÖRLIKAS – Grön verifiering i hela repot**
  Givet att Vägmotorn och samtliga tester är uppdaterade
  När `pnpm verify` körs
  Så passerar alla grindar och tester med exit 0.

```


#### 1a Att följa: Intention & Nytta
Jag förstår intentionen med TCK-060 till fullo. Uppdraget handlar om att stärka Vägmotorns integritet genom att införa en helt minnesbaserad spärr mot falska eller triviala testmönster. Detta säkerställer hög kvalitet och driftssäkerhet i serverlösa webbläsarmiljöer, samtidigt som vi sanerar bort den sista legacykoden och förbättrar vår omvändelseloggik. Är det en korrekt uppfattning?


#### 0a Att vända om: Kontraktsaudit
Din uppfattning är helt korrekt. Vi stärker Vägmotorns integritet och säkerställer full VFS-kompatibilitet genom att stänga de sista hålen för alibi-mönster och slutföra saneringen av legacy-koden. Jag är redo att initiera Fas 1.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
För att lösa TCK-060 och upprätthålla Gate 3a i en webbläsarkompatibel miljö, ska jag formulera tre alternativa angreppssätt för lösningen.


#### 2c Att vända om: Resiliensgranskning
Jag granskar alternativen och ser att den största risken är att förlita sig på för komplexa regex-mönster i `alibiInspector`, vilket kan leda till falska positiva resultat. Vi måste hålla mönstren strikta och förutsägbara för att garantera att inga alibin slipper igenom i VFS-miljön.


#### 2d Att förlikas: Mättnad
Efter noggrann avvägning av riskerna i spänningsfältet mellan komplexitet och säkerhet, slår jag fast att det vinnande kontraktet är att använda strikta, förutsägbara mönster och AST-analys istället för komplex regex. MÄTTNAD: JA.


#### 3a Att följa: Testspecifikation



#### 3b Att följa: Källkod



#### 3c Att förlikas: Slutgiltigt Byggkontrakt
Filer som ska skapas är alibiInspector under engine/, och de filer som ska bevaras och uppdateras är pathSchema.ts, provningsport.ts samt pathRunner.ts i sina respektive mappar.
