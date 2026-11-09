# Processförbättringar & Systemvård (v10.4)

Detta dokument är motorns aktiva liggare för processlärdomar, identifierad friktion och genomförda systemjusteringar. Varje registrerad processbrist ska leda till en motsvarande `TCK-MAINT`-biljett för att förankras mekaniskt i källkoden eller orkestreringsskripten.

---

## 1. Aktiva Processregler & Erfarenhetsbank
*Här listas regler som upptäckts under byggcykler och som laddas JIT under Fas 0 och Fas 1.*

- **[2026-10-31] Bryt Moment 22 vid infrastrukturfel:** Ändra aldrig orkestreringsskript (`scripts/run-planera-live.ts`) eller drivrutiner via autonoma patch-biljetter om motorns egna verktyg fallerar. Tillämpa deterministisk Git Hard-Reset till senast kända stabila commit.
- **[2026-11-01] Mekanisk förankring:** Introducera aldrig nya statuskoder eller promptval för modellen utan att den mottagande parser- och exekveringslogiken redan är implementerad i skripten.
- **[2026-11-09] Enhetlig typlåsning och SSOT mellan Zod och model/types.ts:**
  * *Förbjudet:* Deklarera manuella TypeScript-interfacen i `model/types.ts` parallellt med matchande `z.infer`-typer i `contracts/*Schema.ts`.
  * *Obligatoriskt:* Re-exportera alltid de Zod-härledda typerna från `contracts/` via `model/types.ts` (`export type { X } from '../contracts/XSchema'`). Detta förhindrar typkonflikter och säkerställer att Zod-schemat är domänens enda sanningskälla.
- **[2026-11-09] Skaloberoende skriptexekvering via Heredoc:**
  * *Förbjudet:* Instruera infrastrukturpatchar eller komplexa skript i terminalen via `node -e '...'` när koden innehåller mallsträngar (`${...}`), reguljära uttryck eller citattecken.
  * *Obligatoriskt:* Skriv alltid koden till en efemär fil via `cat << 'EOF' > fil.js && node fil.js && rm fil.js` med enkelciterad avgränsare (`'EOF'`) för att eliminera förtida variabel-evaluering i Bash.
- **[2026-11-01] Inga råa promptar via Bash CLI:** Skicka aldrig flerradiga promptar, systeminstruktioner eller JSON-data som råa argument i `child_process.execSync`. Skriv alltid till en efemär payload-fil på disk och läs in den i Node för att eliminera `/bin/sh`-syntaxfel.
- **[2026-11-02] TDD Fail-First kräver extern import:** En transient testfil i Fas 1 Steg 3a får aldrig deklarera eller mocka den källkod den avser att testa. Den MÅSTE importera funktioner och typer från den framtida domänen (`../features/[domän]/...`) så att testet bevisat fallerar rött (exit 1) innan källkoden implementeras.
- **[2026-11-02] Rekursiva testvägar och FSD-kataloger:** Alla konsoliderings- och sparmekanismer i orkestreringen måste tillämpa `fs.mkdirSync(path.dirname(p), { recursive: true })` och strikt exkludera `__tests__` från domänens publika `index.ts`.

---

## 2. Historik & Lärdomar från Omvändelseslingan (Meta-Teshuvah)
*Dokumenteras automatiskt av Att förlikas under Fas 3.*
- **[2026-11-02] Hermetiska minnestester utan I/O:** När en funktionell callback, prompter eller beräkning testas i minnet under Fas 1/2, använd rena TypeScript-funktioner (`async () => '...'`) i stället för `vi.fn()`. Det förhindrar falska Gate 3a-larm och eliminerar risken för panikartade kors-importer av händelsebussar från andra domäner.

- **[2026-11-08] Erfarenheter från TCK-035 till TCK-038 (Vägens fundament):**
  * TDZ i felhanterare: Variabler som fångar felloggar (testLog) måste initieras överst i catch-blocket.
  * Kontinuerlig barrel-synk: index.ts i aktiva FSD-domäner uppdateras deterministiskt inför varje testkörning.
  * Mekanisk flerfilskontroll i Fas 2: Byggmotorn kräver att samtliga specificerade källkodsfiler existerar på disk innan testerna startas.
  * Typamputationsskydd: save_code förbjuds att skriva över model/types.ts och index.ts om deklarerade exporter saknas.
  * Git-omvändelse framför MAINT-ackumulering: Trasig eller skuldsatt kod backas med git reset till senast kända rena tillstånd hellre än att plåstras över.
  * Filbaserad IPC: Komplexa ändringar överförs via efemära filer på disk för att eliminera klippta terminalbuffertar.

## [2026-11-08] Erfarenheter från TCK-039 (Besiktningsporten & Lean Recipe)
- **Observation 1 (Parameterinversion i test):** Modeller inverterar ibland funktionsargument i transienta tester och försöker därefter skriva om produktionskoden i Fas 2 för att klara testet, vilket slår sönder regressionssviten.
  *Åtgärd:* Inför Kontraktsspeglare (`--check-contract-mirror`) som avvisar felaktiga testanrop i Fas 1 innan källkod får röras.
- **Observation 2 (Strangler Fig vs Global Typkontroll):** Global `tsc --noEmit` i `pnpm verify` kolliderar med Strangler Fig-arkitekturen (ADR-029/030) eftersom vilande domäner kan innehålla historiska typfel.
  *Åtgärd:* Begränsa statisk typkontroll programmatiskt via TypeScripts Compiler API till den aktiva domänen och `shared`.
- **Observation 3 (Telemetribrus och terminalbuffert):** Stora mängder rå WebSocket-telemetri sliter på terminalbufferten i ChromeOS/Penguin och skapar kognitiv dimma.
  *Åtgärd:* Inför standardläget `CLI_VERBOSITY=terse` och bygg in automatisk generering av `CRASH_DIFF.patch` vid avbrott.
- **Observation 4 (Nätverkstolerans vid Bidi Live):** WebSockets kan drabbas av transienta serveravbrott (kod 1011/1006).
  *Åtgärd:* ADR-032 implementerar exponentiell backoff och återanslutning, med automatisk nollställning av felräknaren vid lyckat svar.

- **Observation 5 (Rotfiler & Källkodsagentens mandat):** Vanliga byggbiljetter (TCK-XXX) får aldrig kräva ändringar i package.json eller rotkonfigurationer, eftersom Fas 2-grinden medvetet blockerar ändringar utanför måldomänen.
  *Åtgärd:* Alla nya npm-skript eller rotkonfigurationer ska alltid installeras och commitas som infrastrukturell förberedelse innan den domänspecifika byggbiljetten startas.

- **Observation 6 (Polyglotta nodkontrakt och skiftlägestolerans i Vägmotorn):** När olika biljetter implementerar eller anropar recept kan små skiftningar i namngivning (STEP vs step, execute vs run, success vs sucess) skapa regressionskrascher i äldre tester.
  *Åtgärd:* Vägmotorn i pathRunner.ts ska alltid normalisera nodtyper via .toUpperCase(), acceptera alternativa metodnamn (execute || run, port || run) samt returnera polyglotta statusobjekt ({ success, sucess, slutfold }).


## [2026-11-09] Erfarenheter från TCK-041 till TCK-045 (Vägmotorns Exekveringsmiljö)
- **Observation 1 (Över-restriktiv strängmatchning i tillståndsmaskinen):** `bestamFasForSteg` i `pathRunner.ts` förlitade sig ursprungligen på `startsWith('provning')` etc. Detta orsakade att renodlade port-noder (t.ex. `p2` eller `port-provning`) föll tillbaka till default-fasen 'avsikt', vilket i sin tur riskerar att ge `promptCompiler` fel `PathPhase`-instruktion när Bidi Live-adaptern ansluts.
  *Åtgärd:* Vid nästa domänjustering i `src/features/path/` ska matchningslogiken breddas till `stegId.includes('provning') || stegId === 'p2'` för att garantera deterministisk fasspårning.

## [2026-11-09] Erfarenheter från TCK-041 till TCK-045 (Vägmotorns Exekveringsmiljö)
- **Observation 1 (Över-restriktiv strängmatchning i tillståndsmaskinen):** `bestamFasForSteg` i `pathRunner.ts` förlitade sig ursprungligen på `startsWith('provning')` etc. Detta orsakade att renodlade port-noder (t.ex. `p2` eller `port-provning`) föll tillbaka till default-fasen 'avsikt', vilket i sin tur riskerar att ge `promptCompiler` fel `PathPhase`-instruktion när Bidi Live-adaptern ansluts.
  *Åtgärd:* Vid nästa domänjustering i `src/features/path/` ska matchningslogiken breddas till `stegId.includes('provning') || stegId === 'p2'` för att garantera deterministisk fasspårning.
