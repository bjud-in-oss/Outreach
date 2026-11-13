# BYGGCYKEL LOGG: TCK-MAINT-064
**Starttid:** 2026-11-13T23:51:24.965Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-MAINT-064: 4-stegs självrannsakande omvändelse (TCK + MAINT) och 3-vägs triagering av konstruktiv kritik

**Måldomän:** `scripts`
**Målfiler:** `scripts/run-planera-live.ts`, `scripts/update-tickets.js`
**Mekanisk Acceptans:**
1. `scripts/run-planera-live.ts` bantas extremt (till under 880 rader) genom att rad 825 till 965 byts ut mot importerade anrop (`konsolideraTest`, `synkaDomanBarrel`, `uppdateraFeatureIndex`, `uppdateraBiljettstatus`, `hanteraTrepunktsbesiktning`, `genomforGitCommitPush`) från `./lib/fas3Consolidation.js`.
2. I `scripts/run-planera-live.ts` aktiveras den yttre `--omvandelse`-loopen med **upp till 4 yttre försök** (`omvandelseCount < 4`) och framstegsspärr för **både** `TCK` och `TCK-MAINT`.
   - För `MAINT` återställs `scripts/` från `doc/LAST_CYCLE/scripts_backup` före omstarten, och `CRASH_DUMP.json` skrivs med `buildCrashDumpPayload`.
   - Före varje yttre omstart körs `runMicroChannel('Att vända om')` som besvarar *"Varför omvände sig inte den inre slingan under sina 3 försök?"*, sparar svaret i `CRASH_DUMP.json` och loggar det.
3. Efter grön Fas 2 utvärderas konstruktiv kritik. Om `BEDOMNING: STOR_SKILLNAD` returneras körs 1 extra `--kritik-iter=1`-omstart. `LITEM_BATCH` och `AVVISAD_FELAKTIG` loggas i `doc/PROCESS_IMPROVEMENTS.md` men utlöser ingen omstart.
4. `scripts/update-tickets.js` bevarar `READY`-status för obygda biljetter (skriver enbart `VERIFIED` om det stod så innan).
5. `pnpm verify` passerar med exit 0.

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **Kirurgisk bantning av `scripts/run-planera-live.ts` (MÅSTE BLI KORTARE ÄN INNAN):**
   - Importera funktionerna från `'./lib/fas3Consolidation.js'` högst upp.
   - Ersätt HELA kodblocket mellan `// FAS 3: SLUTKONSOLIDERING` (rad 825) och `main().catch` (rad 968) med enkla metodanrop. Lämna ingen gammal konsolideringslogik kvar.
2. **Kritisk sållning:**
   - Prompten för konstruktiv kritik i Fas 3 måste tvinga modellen att svara med `BEDOMNING: STOR_SKILLNAD`, `LITEM_BATCH` eller `AVVISAD_FELAKTIG`.
   - Endast `STOR_SKILLNAD` får trigga `npx tsx scripts/run-planera-live.ts ${ticketId} --kritik-iter=1`.

---

## Scenariotriad (Den relationella och systemiska avsikten)

**Scenario: ATT FÖLJA – Både skript och kod självläker via självrannsakan**
  Givet att den inre Fas 2-loopen misslyckas 3 gånger
  När den yttre omvändelsen tar över (för upp till 4 varv)
  Så analyserar motorn varför den inre slingan fastnade, vilket bryter Moment 22.

**Scenario: ATT VÄNDA OM – Stopp för skräpkritik och oändliga loopar**
  Givet att felsignaturen upprepas i yttre loopen eller att kritiken är `LITEM_BATCH`
  När spärren nås
  Så avbryts loopandet direkt och småputs sparas i en kö för senare städning.

**Scenario: ATT FÖRLIKAS – Grön verifiering med bantat skript**
  Givet att all redundans har brutits ut ur `run-planera-live.ts`
  När `pnpm verify` körs
  Så passerar storleksgrinden med bred marginal.

```


#### 1a Att följa: Intention & Nytta
Det här uppdraget handlar om att bygga ett system som självläker genom djupt självrannsakande.


#### 0a Att vända om: Kontraktsaudit
Jag har genomfört kontraktsauditen för TCK-MAINT-064. Jag är redo att påbörja arbetet med att banta `run-planera-live.ts` och etablera den yttre omvändelseloppen enligt specifikationen.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
Alternativ ett är en modulär refaktorisering där vi helt bryter ut all konsolideringslogik till det nya biblioteket, och hanterar loopen för omvändelse internt i skriptet med isolerad tillståndshantering per försök.

Alternativ två använder en rekursiv orkestreringsmodell i minnet för att köra looparna, där vi nollställer interna moduler för att undvika tillståndsläckage mellan körningarna.

Alternativ tre bygger på en tillståndsmaskin där varje försök loggas som ett fullständigt tillståndssnabbfoto för maximal spårbarhet.


#### 2c Att vända om: Resiliensgranskning
Med fokus på resiliens och att förhindra tysta fel, ser jag Alternativ ett som det starkaste. Genom att bryta ut all konsolidering till `fas3Consolidation.js` och hålla tillståndet isolerat per försök, minimerar vi risken för tillståndsläckage mellan de yttre omvändelseförsöken. Det ger oss också en renare felpropagering.


#### 2d Att förlikas: Mättnad
Jag bekräftar härmed Alternativ ett som det vinnande kontraktet. Genom att isolera tillståndet och bryta ut konsolideringen uppnår vi den resiliens och felpropagering vi eftersträvar. MÄTTNAD: JA.
