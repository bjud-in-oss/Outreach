# BYGGCYKEL LOGG: TCK-MAINT-052
**Starttid:** 2026-11-12T18:01:10.412Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-MAINT-052: Banta run-planera-live.ts under 250 rader, laga pathNodePorts.ts och logga kvarvarande legacy-skörd

**Måldomän:** `scripts`
**Målfiler:** `scripts/lib/channelRunner.ts`, `scripts/lib/fas2Tooling.ts`, `scripts/lib/fas3Consolidation.ts`, `scripts/run-planera-live.ts`, `scripts/lib/sizeGate.js`, `scripts/lib/pathNodePorts.ts`, `scripts/run-path.ts`, `scripts/run-tests.js`
**Mekanisk Acceptans:**
1. `scripts/lib/channelRunner.ts`, `scripts/lib/fas2Tooling.ts` och `scripts/lib/fas3Consolidation.ts` är skapade och samtliga hålls strikt under 250 rader.
2. `scripts/run-planera-live.ts` krymper under 250 rader och `LEGACY_SCRIPT_CAPS['run-planera-live.ts']` i `scripts/lib/sizeGate.js` sänks från `1000` till `250`.
3. `scripts/lib/pathNodePorts.ts` returnerar exakta portnycklar `{ avsikt, provning, konstruktion, besiktning }` med korrekta portfabriker (`prompter`, `testExekverare`, `inspekterare`), och `scripts/run-path.ts` importerar `skapaBidiLiveAdapter` från `'../src/features/path'`.
4. `scripts/run-tests.js` (< 50 rader) listar kvarvarande `src/__tests__/*.legacy.ts`-filer vid testkörning så att ADR-030-skörden hålls synlig, och `pnpm verify` passerar med exit 0.

---

## Destruktiva Handlingssteg (Obligatorisk städning)
- **Radera utbrutna block ur `scripts/run-planera-live.ts`:** Ta bort inline-implementationerna av `getFeatureIndexText`, `getInstalledDependencies`, `appendCycleLog`, `runMicroChannel`, `inspectionTools`, `executeInspection`, `codegenTools`, `executeFas2Tools`, den lokala dubbletten av `getRequiredFiles`, `getMissingFiles`, `isFas2Complete`, `getFas2FollowupPrompt`, Fas 3-konsolideringen, Trepunktsbesiktningen (`[j/s/n]`) samt Git commit/push-blocket ur `scripts/run-planera-live.ts`.
- **Ersätt felaktiga portnycklar i `scripts/lib/pathNodePorts.ts`:** Ta bort `{ avsiktsport, provningsport, konstruktionsport, besiktningsport }` och returnera `{ avsikt, provning, konstruktion, besiktning }`.

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **Utbrytning till `scripts/lib/` (< 250 rader per fil):**
   - `scripts/lib/channelRunner.ts`: `getFeatureIndexText`, `getInstalledDependencies`, `appendCycleLog`, `runMicroChannel` (med 400 ms paus efter `runner.close()`), `inspectionTools`, `executeInspection`.
   - `scripts/lib/fas2Tooling.ts`: `codegenTools`, `createFas2ToolExecutor`, `getMissingFiles`, `isFas2Complete`, `getFas2FollowupPrompt`.
   - `scripts/lib/fas3Consolidation.ts`: testkonsolidering, barrel-synk, `TICKETS.md`/`FEATURE_INDEX.json`-uppdatering, Trepunktsbesiktning (`[j/s/n]`) och Git commit/push.
   - Uppdatera `scripts/run-planera-live.ts` (< 250 rader) och sänk `LEGACY_SCRIPT_CAPS['run-planera-live.ts']` i `scripts/lib/sizeGate.js` till `250`.
2. **Laga Vägmotorns Node-portar (`scripts/lib/pathNodePorts.ts` & `scripts/run-path.ts`):**
   - I `scripts/lib/pathNodePorts.ts`: returnera `{ avsikt: skapaAvsiktsport({ prompter: async () => 'y', beskrivning: ... }), provning: skapaProvningsport({ testFilVag: ..., forvantatFel: 'Fail-First', testExekverare: ... }), konstruktion: skapaKonstruktionsport({ matris: deps.matris || [], inspekterare: ... }), besiktning: skapaBesiktningsport({ inspekterare: ... }) }`. Vid `dryRun === false` körs skarpa kontroller via `execCaptured`.
   - I `scripts/run-path.ts`: lägg tillbaka `skapaBidiLiveAdapter` i importen från `'../src/features/path'`.
3. **Synliggör kvarvarande legacy-skörd i `scripts/run-tests.js` (< 50 rader):**
   - Läs `src/__tests__/` och logga `📦 [LEGACY-SKÖRD KVAR]: ...` om några `*.legacy.ts`-filer finns kvar.

---

## Scenariotriad (Den relationella och systemiska avsikten)

**Scenario: ATT FÖLJA – Hela skriptlagret under 250 rader och fungerande Vägmotorportar**
  Givet att `run-planera-live.ts` delas upp och `pathNodePorts.ts` returnerar rätt portkontrakt
  När `pnpm verify` och `pnpm bygg:path` körs
  Så hålls varje skriptfil under 250 rader och Vägmotorn knackar på samtliga fyra portar utan tysta bortfall.

**Scenario: ATT VÄNDA OM – Avvisande av glömda legacy-testfiler**
  Givet att `*.legacy.ts` är exkluderade ur Vitest enligt ADR-010
  När `pnpm test` körs
  Så påminner `run-tests.js` om kvarvarande filer att skörda enligt ADR-030.

**Scenario: ATT FÖRLIKAS – Grön verifiering i hela repot**
  Givet att samtliga moduler och tester är uppdaterade
  När `pnpm verify` körs
  Så passerar alla grindar och tester med exit 0.

```


#### 1a Att följa: Intention & Nytta
Det här är en viktig städning för att hålla skriptlagret överskådligt och för att Vägmotorn ska fungera utan felaktiga portnycklar. Jag ser till att koden delas upp enligt konstens alla regler och att legacy-skörden synliggörs. Är intentionen tydlig för dig?


#### 0a Att vända om: Kontraktsaudit
Intentionen är tydlig gällande städningen av skriptlagret och Vägmotorns portar. Kontraktsauditen är utförd och jag har validerat stegen för att uppfylla alla mekaniska och systemiska krav.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
Här är tre ortogonala alternativ för att banta `run-planera-live.ts` och säkra att portarna fungerar.

Alternativ ett är modulär funktionsbaserad utbrytning. Vi flyttar funktionerna rakt av till de nya filerna som fristående hjälp- och verktygsmoduler och anropar dem i huvudskriptet.

Alternativ två är tillståndsdriven orkestrering. Vi inkapslar logiken i specifika klasser eller manager-objekt i `scripts/lib/` för att hantera tillstånd och livscykel mer strukturerat.

Alternativ tre är funktionell pipelining. Vi bygger upp processen som en pipeline där varje modul utför ett steg och skickar vidare ett gemensamt kontextobjekt.


#### 2c Att vända om: Resiliensgranskning
Alternativ ett har bäst resiliens och följer Feature-Sliced Design bäst genom att hålla modulerna autonoma. Jag avvisar det tillståndsdrivna alternativet på grund av risken för dolda tillståndskonflikter. Vi går vidare med alternativ ett.


#### 2d Att förlikas: Mättnad
Jag har vägt spänningsfältet och lyssnat till resonemanget kring alternativen. Genom att prioritera resiliens och strikt Feature-Sliced Design säkrar vi modulernas autonomi och minimerar risken för dolda tillståndskonflikter. Jag fastställer härmed att alternativ ett är det vinnande kontraktet. MÄTTNAD: JA.
