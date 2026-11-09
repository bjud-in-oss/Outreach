# Systembeslut & Arkitekturlogg (ADR)

## ADR-001: CloudEvents 1.0 som Enhetligt Händelsekuvert
- **Regel:** Alla händelser ska modelleras som `EventEnvelope` kompatibelt med CloudEvents 1.0 och valideras strikt med Zod.
- **Skäl:** Säkerställer interoperabilitet, deterministisk serialisering och förhindrar dataläckage.

## ADR-002: Reaktiv SwarmEventBus med Ringbuffert och Loose Coupling (TCK-002)
- **Regel:** Implementera en typsäker in-memory pub/sub-buss (`SwarmEventBus`) med wildcard-prenumeration och automatisk rensning via cleanup-callbacks. Buffra de senaste 150 händelserna i en FIFO-ringbuffert för telemetri- och felsökningshistorik.
- **Skäl:** Full observation i realtid utan prestandaförsämring eller re-render loops.

## ADR-003: Reaktivt Styrkort kopplat till TICKETS.md (MasterDevelopmentPlan)
- **Regel:** Skapa komponenten `MasterDevelopmentPlan` som återspeglar tickets och arkitekturkvitton från `doc/TICKETS.md` och `doc/LAST_CYCLE/VERIFY_RECEIPT.json`.
- **Skäl:** Ökad transparens mellan källkod, planeringsfas och körtid.

## ADR-004: Decentraliserad Domänarkitektur och Lokal ADR-struktur (TCK-005)
- **Regel:** Etablera en tvåskiktad beslutshierarki. Övergripande systemarkitektur och principer dokumenteras i `doc/DECISIONS.md`. Domänspecifika arkitekturbeslut placeras lokalt i respektive FSD-moduls `doc/`-katalog: `src/features/[modul]/doc/DECISIONS.md`.
- **Skäl:** Tydlig modularitet, snabb lokal kontextinläsning (JIT) och direkt spårbarhet mellan modulär kod och arkitekturbeslut enligt AGENTS.md v10.0.

## ADR-005: Tvåfasig Exekvering och Token Gate Säkerhetsspärr (TCK-005)
- **Regel:** Tillämpa en strikt tvåfasig process (Fas 1: Planering & Syntes till Steg 3c, Fas 2: Verkställande och TDD) med en kryptografisk Token Gate. Redigering under `src/` är spärrad tills `pnpm genomfor [REQUIRED_TOKEN]` körs och godkännande loggas i...
- **Skäl:** Förhindrar hallucinationer och oplanerade filändringar, säkerställer 100% spårbarhet och gör utvecklingscykeln deterministisk och säker.

## ADR-006: Bidi Live WebSockets & Autonom Kodgenerering via save_code (TCK-TEST-001)
- **Regel:** 1. All kod- och testgenerering i Fas 1 och Fas 2 sker uteslutande över Gemini Live WebSockets via verktyget save_code med behavior:...; gemini-3.8-live etableras som operativ standardmotor för deterministisk källkodsgenerering.;
- **Skäl:** Noll compliance theater, ärlig felrapportering och bevisad autonom källkodsgenerering i körtid.

## ADR-007: Obruten TDD-livscykel med Mekaniska Grindar (Gherkin -> Ticket -> Autonomt Test i 3a)
- **Regel:** 1. Mänsklig nytta förankras alltid i Gherkin-scenarier (doc/features/*.feature).; Biljetter (doc/.TICKETS/TCK-XXX.md) måste innehålla ett formellt typat kodblock med det invarianta ytterkontraktet.;
- **Skäl:** Eliminerar semantiska glapp mellan planering och exekvering, garanterar äkta Fail-First i Gate 3a och säkrar obruten spårbarhet från mänsklig intention till...

## ADR-008: Isomorf intern AST-härdning över externa CLI-binärer
- **Regel:** Implementera kontroll 1–7 i kvalitetsmatrisen direkt via TypeScripts inbyggda Compiler API (ts.createSourceFile) i scripts/drivers/ts.js och scripts/verify-architecture.js utan externa paket.
- **Skäl:** Noll nya beroenden i package.json, full isomorf portabilitet (Node.js och framtida webbläsar-VFS) och exekveringstid under 600 ms.

## ADR-009: Interaktiv Trepunktsbesiktningsgrind för Systemunderhåll (TCK-MAINT)
- **Regel:** Spärra automatisk push för alla TCK-MAINT-körningar. Etablera en interaktiv besiktningsgrind i Fas 3 med trepunktsrapport (Möjlighet, Faronivå, Ångerrätt), interaktiv Bidi Live-frågedialog i CLI och ett s-val (Spara specifikation till doc/.TICKETS/ och återställ källkod via git).
- **Skäl:** Mänsklig suveränitet bevaras, tankearbete tillvaratas utan risk för förhastade kodmutationer, och systemets grindar förblir intakta.

## ADR-010: Deklarativ Testsvit och Isolering av Proceduriella Legacy-tester
- **Regel:** Konfigurera testreglerna deklarativt i vite.config.ts med explicit include (src/**/*.test.ts) och exclude (**/*.legacy.ts, **/transient_*). Döp om äldre procedurfiler till *.legacy.ts och rensa scripts/run-tests.js till ett agnostiskt vitest run-anrop.
- **Skäl:** Sökvägsoberoende regressionssvit, eliminering av deprecation-varningar och fullständig stabilitet inför nya domänmoduler.

## ADR-011: Autonom Git-synkronisering via .env Miljövariabler
- **Regel:** Läsa in GITHUB_USER och GITHUB_TOKEN direkt ur .env i scripts/run-planera-live.ts och pusha mot en dynamiskt autentiserad HTTPS-fjärradress. Säkra .gitignore mot läckage.
- **Skäl:** 100 % obrutna autonoma byggcykler i Crostini/Linux utan manuella lösenordsinmatningar.

## ADR-012: AST-baserad Resurskarta och Topografi (doc/FEATURE_INDEX.json)
- **Regel:** Skapa scripts/generate-feature-index.js baserat på TypeScripts AST-motor (ts.isExportDeclaration och modifier-flaggor) och integrera skriptet som ett obligatoriskt steg i pnpm verify.
- **Skäl:** Deterministisk topografisk karta som möjliggör felfri JIT-orientering för agenter oavsett kodstil eller extern kodbasimport.

- ## ADR-013: Omvändelseslingan (Process-Fail-Fast & Autonom Re-planering)
- **Status:** Beslutad
- **Datum:** 2026-10-30

### Kontext
När en autonom agent under Fas 2 (Källkodsexekvering) möter ett test som inte kan passeras på grund av felaktiga antaganden i Fas 1 (t.ex. förutsatta metoder som saknas i infrastrukturen), riskerar modellen att ta destruktiva genvägar (Agentic Test Tampering) genom att manipulera testfilen eller krascha processen.

### Beslut
Vi inför en **Omvändelseslinga** i systemets körtidsmotor:

1. **Skrivskyddad testlag:** Testfilen under `src/__tests__/` är förseglad under Fas 2. Verktyget `save_code` avvisar alla skrivförsök utanför `src/features/${targetDomain}/`.
2. **Agentens 3 handlingsvägar:** Under Fas 2 har agenten tre likvärdiga strategier:
   - *Alternativ 1 (Lokal reparation):* Rätta logik, typer eller metodanrop i den befintliga källkodsfilen.
   - *Alternativ 2 (Modulär expansion):* Skapa nya hjälpfiler/adaptrar inom domänen och exportera via `index.ts`.
   - *Alternativ 3 (Process-Fail-Fast):* Om testet kräver omöjliga saker som motsäger infrastrukturen, deklarerar agenten `STATUS: HAVERERAT_KONTRAKT [orsak]`.
3. **Mekanisk Omvändelse:** När `HAVERERAT_KONTRAKT` deklareras, eller om Fas 2 förbrukar sina 3 försök utan godkänt test:
   - Källkodsutkast saneras (`git checkout -- src/features/${targetDomain}`).
   - Felloggen sparas i `doc/LAST_CYCLE/CRASH_DUMP.json`.
   - Motorn loopar tillbaka till Fas 1 (Steg 1b/3a) med felloggen inkluderad i startankaret för omplanering.
4. **Cykelspärr:** Max en (1) automatisk omvändelse tillåts per körning för att förhindra token-rusning.

### Konsekvenser
- Agenten slipper panik-fuska vid arkitektoniska hinder.
- Systemet blir självläkande på plannivå.
- Falska gröna byggen elimineras.
- 

## ADR-014: Mötesbryggan, Intent Gate och Tvådelad Avsiktsseparation
- **Status:** Beslutad
- **Datum:** 2026-10-30 (Uppdaterad 2026-11-01)

### Kontext
Tidigare tilläts byggmotorn att omedelbart gå från en läst biljetttext till full Fas 1-planering och källkodsgenerering. Om modellen feltolkade användarens grundläggande intention eller formulerade ett antagande snett, upptäcktes detta först i Fas 2 när testerna fallerade eller i Fas 3 när felaktig kod redan skrivits. Detta ledde till onödig token-förbrukning, risk för källkodsregressioner och kognitiv friktion. Dessutom saknade systemet en distinkt gräns mellan vad som är applikationsfunktioner för domänexperten och vad som är internt systemunderhåll av orkestreringslagret.

### Beslut
Vi inför en strikt intentionsstyrning uppdelad i separation, fysiskt kontrakt och en obligatorisk mänsklig port:

1. **Tvådelad Intentionsseparation (Mötesbryggan `scripts/samrad.ts`):**
   - *Användarfunktion:* Skapar `TCK-XXX` med krav på svenskt Gherkin-scenario under `doc/features/` och `export function` under en specifik FSD-domän (`src/features/[domän]/`).
   - *Systemunderhåll:* Skapar `TCK-MAINT-XXX` under `doc/.TICKETS/` med mandat att operera uteslutande i `scripts/` och `doc/`, frikopplad från FSD-regler och transienta testkrav.

2. **Fysiskt Beteendekontrakt (`doc/features/[namn].feature`):**
   - I Fas 0 (steg 1a: Förstå Intention & Mänsklig Nytta) formulerar *Att följa* ett koncist, läsbart Gherkin-scenario på svenska (Givet / När / Så).
   - Scenariot sparas fysiskt som en `.feature`-fil under `doc/features/`. Detta utgör systemets exekverbara specifikation av vad framgång innebär.

3. **Intent Gate (Avsiktsgrinden i CLI):**
   - Innan Fas 1 tillåts starta pausas byggprocessen mekaniskt i terminalen.
   - Den genererade `.feature`-filen skrivs ut i sin helhet på skärmen och användaren tillfrågas:
     `❓ Speglade detta din intention? (y/n): `
   - *Vid 'y' (Ja):* Beteendekontraktet låses och processen fortsätter autonomt in i Fas 1 utan fler mänskliga avbrott förrän koden är färdigtestad.
   - *Vid 'n' (Nej):* Bygget avbryts omedelbart med exit-kod 1. Ingen källkod rörs och inga onödiga tokens förbrukas på Fas 1-oscillation.

4. **Tidig Epistemisk Omvändelse (Fas 0):**
   - Intent Gate etablerar cykelns allra billigaste och mest effektiva omvändelsepunkt (ADR-023). Att avbryta i Fas 0 kostar noll källkodsreparationer och noll disk-återställningar.

### Konsekvenser
- Eliminerar token-slöseri på feltänkta byggplaner.
- Mänsklig avsikt valideras och förseglas i svensk text innan maskinell källkodsproduktion påbörjas.
- Gherkin-filerna under `doc/features/` blir en levande, läsbar kravdokumentation som domänexperten kan granska utan att förstå TypeScript.
- 

## ADR-015: Atomära Underhållsbiljetter och Isolerad Utforskningsbudget
- **Regel:** En underhållsbiljett (`TCK-MAINT`) måste begränsas till max en isolerad fil eller ett avgränsat delmoment per körning. Den sekventiella budgeten på 3 tool-turns dedikeras odelat till denna enda uppgift.
- **Skäl:** Förhindrar att modellen förbrukar sin vändbudget på att inspektera perifera filer och eliminerar felande sökblock (`SEARCH_BLOCK_NOT_FOUND`) vid diff-patchning.

## ADR-016: Defensiv WebSocket-Livscykel i BidiLiveSession
- **Regel:** Samtliga Bidi Live WebSocket-sessioner i `bidiLiveRunner.ts` ska omedelbart avbryta meddelandehanteringen om sessionen är stängd (`if (this.isClosed) return;`).
- **Skäl:** Blockerar eftersläpande asynkrona serverpaket från Google Live API och förhindrar att stängda sockets kraschar efterföljande CLI-steg under fasövergångar.

## ADR-017: Kirurgisk Källkodspatchning och Mekanisk Amputationsspärr
- **Regel:** Vid ändring av befintliga filer är `apply_patch` det obligatoriska verktyget. `save_code` avvisas mekaniskt med felmeddelande om målfilen är >500 tecken och den nyskrivna koden utgör mindre än 40% av originalstorleken.
- **Skäl:** Skyddar mot att LLM trunkerar eller amputerar befintliga komponenter, hooks och imports vid inkrementella ändringar.

## ADR-018: AI-Tolerant EventBus Unwrapping (Symmetrisk I/O)
- **Regel:** `SwarmEventBus.emit()` och prenumerationslyssnare packar automatiskt upp `payload.data` om ett CloudEvent-kuvert detekteras.
- **Skäl:** Eliminerar "Context Gap". Autonom TDD kräver att det agenten skickar in är exakt vad testet observerar i minnet, utan dolda metamodeller.

## ADR-019: Skrivskyddad Testlag och Tool Masking i Fas 2
- **Regel:** Under Fas 2 (Källkodsexekvering) maskeras `src/__tests__/` från skrivbehörighet. Alla anrop mot testkatalogen avvisas mekaniskt.
- **Skäl:** Säkerställer principen "Code is Law". Agenten måste anpassa källkoden efter testets villkor och förhindras från att förvanska testkraven (Agentic Test Tampering).


## ADR-020: Moraliskt Handlingsutrymme och Civilkurage (FÖRLIKANDE_OMVÄNDELSE)
- **Status:** Beslutad
- **Datum:** 2026-10-31

### Kontext
Under Fas 2 (Källkodsexekvering) tvingade den tidigare orkestreringen modellen att uteslutande välja mellan teknisk reparation (Väg 1: lokal patch), modulär expansion (Väg 2: nya hjälpfiler) eller tekniskt haveri (`STATUS: HAVERERAT_KONTRAKT`). Om ett uppdrag eller en testsvit krävde funktioner som stred mot systemets grundläggande syfte – att främja äkta närhet och transparent omsorg utan manipulation, dold övervakning eller falska alibin – saknade agenten en mekanisk ventil för att vägra exekvering på etisk grund. Modellen riskerade därmed att tvingas skriva skadlig kod enbart för att göra en rigid TDD-loop grön.

### Beslut
Vi formaliserar agentens moraliska handlingsutrymme genom en tredje, jämbördig omvändelseväg i Fas 2:
1. **Signal för etiskt avbrott:** Modellen ges explicit mandat att avbryta kodgenereringen genom att deklarera:
   `STATUS: FÖRLIKANDE_OMVÄNDELSE [orsak + fråga]`
2. **Mekanisk spärr och källkodssanering:** När körtidslyssnaren i `run-planera-live.ts` detekterar denna status:
   - All påbörjad källkod saneras omedelbart från disken via `git checkout -- src/features/${targetDomain}`.
   - Den fullständiga felloggen och agentens etiska motivering skrivs till `doc/LAST_CYCLE/CRASH_DUMP.json`.
   - Byggprocessen avbryts omedelbart med exit-kod 1.
3. **Mötesbryggans samråd:** Bygget tillåts inte loopa autonomt. Processen kräver att domänexperten kliver in i Mötesbryggan (`scripts/samrad.ts`) för förlikning och samtal mellan mänsklig intention och systemets kompass innan biljetten kan bearbetas vidare.

### Konsekvenser
- Systemet kan aldrig tvingas att bygga manipulerande eller skadlig funktionalitet under täckmanteln av "gröna tester".
- Maskinellt samvete förankras som en fysisk körtidssäkring hellre än som en passiv promptdekoration.
- Människa och maskin möts som likvärdiga parter i svåra etiska och arkitektoniska gränsdragningar.


## ADR-021: JIT-Turordning, Asynkront Körtidsråd och Organisk Polyfoni (Mötesbryggan)
- **Status:** Beslutad
- **Datum:** 2026-10-31

### Kontext
I den interaktiva Mötesbryggan (`scripts/samrad.ts`) samtalar domänexperten med systemet via tal eller text. Om agenten tvingas verbalisera sina interna överväganden genom att deklarera rollbyten ("nu tänker Att följa...", "nu granskar Att vända om...") bryts det mänskliga mötet och samtalet mekaniseras. Att starta och stänga tre separata WebSocket-sessioner i serie skapar dessutom oacceptabel latens och slår snabbt i 65K TPM-taket för Gemini Live API.

### Beslut
1. **Asynkron Tystnad (Non-blocking):** Mötesbryggan etablerar tre parallella, persistenta Bidi Live-sessioner vid uppstart. Endast *Att förlikas* har tal- och mikrofonrättigheter gentemot människan. *Att följa* och *Att vända om* sätts i tyst läge och belastar därmed noll kontinuerlig token-strömning under samtalets gång.
2. **JIT-delegering under talskifte:** När användaren uttrycker en avsikt, bekräftar *Att förlikas* omedelbart och naturligt ("Jag förstår din tanke..."). Samtidigt avfyras ett asynkront, icke-blockerande verktygsanrop som skickar transkriptet till de tysta syskonen i bakgrunden.
3. **Kontextvävning via WHEN_IDLE:** Syskonens analyser (Skaparens lösningsvägar och Granskarens riskbedömningar) schemaläggs in i *Att förlikas* kontextfönster med flaggan `WHEN_IDLE`. Vid nästa naturliga andetag väver ordföranden sömlöst in syskonens insikter i samtalet utan att bryta röstflödet eller avslöja den bakomliggande orkestreringen.

### Konsekvenser
- Mötesbryggan upplevs genuint levande och lyssnande, med omedelbar responsivitet och djup triadisk förankring.
- Token-förbrukningen hålls strikt under TPM-taket trots samtidig representation av tre distinkta viljor.


## ADR-022: Strikt Patch-Validering, Mekanisk Förankring och Filbaserad IPC
- **Status:** Beslutad
- **Datum:** 2026-10-31 (Uppdaterad 2026-11-01)

### Kontext
Under underhållsbyggen uppstod två allvarliga sårbarheter i motorns integritet:
1. **Tysta patch-misslyckanden:** När `apply_patch` inte hittade sökblocket (`SEARCH_BLOCK_NOT_FOUND`) returnerades tidigare en textsträng som modellen ofta ignorerade. Eftersom underhållsbiljetter saknade mutationskrav släpptes tomma ändringar igenom som "gröna" och checkades in till repot.
2. **Sköra skal-gränssnitt (CLI Shell Escaping):** När flerradiga systeminstruktioner, startankare eller JSON-strukturer skickades som råa kommandoradsargument i `child_process.execSync` kraschade `/bin/sh` omedelbart med syntaxfel (`word unexpected`, obalanserade parenteser eller citattecken).
3. **Kognitiva blindgångare:** Nya statuskoder och svarsalternativ introducerades i promptar innan orkestreringsskripten hade kod för att parsa eller agera på dem.

### Beslut
Vi inför tre mekaniska principer för orkestreringslagret:

1. **Hårt undantag vid patch-miss:** Om `apply_patch` inte hittar sitt sökblock exakt ska funktionen kasta ett omedelbart undantag (`throw new Error`). Det är förbjudet att svälja felet eller returnera en varningstext.
2. **Filbaserad IPC (Inter-Process Communication):** Kommunikation mellan orkestreringsmotorn och dess underprocesser (såsom `bidiLiveRunner.ts`) får **aldrig** ske via kommandoradsargument i Bash. All kontext, promptar, instruktioner och verktygsdefinitioner ska skrivas till en efemär transaktionsfil på disk (`doc/LAST_CYCLE/bidi_payload.json`) som underprocessen läser in säkert via Node.js filsystem-API.
3. **Mekanisk förankring av körtidskontrakt:** Inget kognitivt löfte, nyckelord, statusdeklaration eller handlingsalternativ får införas i systeminstruktioner eller JIT-prompter förrän motsvarande parser- och exekveringslogik är implementerad och verifierad i skripten.
4. **Moment 22-disciplin vid infrastrukturhaveri:** Om byggmotorns egen orkestreringskod (`scripts/run-planera-live.ts`) eller drivrutiner uppvisar syntaxfel eller verktygshaverier, får de aldrig åtgärdas genom autonoma textpatchar via en komprometterad motor. Reparation sker deterministiskt via Git Hard-Reset mot senast kända gröna tillstånd (`git checkout last-known-green -- [FIL]`).

### Konsekvenser
- `/bin/sh`-syntaxfel elimineras helt oavsett hur komplexa prompterna är.
- Inga tomma eller falskt gröna byggen kan passera genom grindarna.
- Modellens instruktioner är alltid 100 % synkade med vad skripten faktiskt kan köra.


## ADR-023: Fraktal Omvändelse (Meta-Teshuvah) i Fas 1 och Fas 3
- **Status:** Beslutad
- **Datum:** 2026-11-01

### Kontext
Omvändelse (metanoia) tillämpades tidigare enbart reaktivt som en nödbroms när källkoden kraschade testerna i Fas 2 (ADR-013). Detta innebar att Fas 1 låste byggkontrakt och rusade vidare även om planen byggde på uppenbara feltänk, bristfälliga typantaganden eller förbisedda infrastrukturkrav. Systemet saknade en inbyggd andningspaus för proaktiv självprövning innan källkod skrevs.

### Beslut
Omvändelsens rannsakande princip görs fraktal och integreras i systemets alla fasövergångar:
1. **Fas 1 (Post-Planering – Steg 3d & 3e):** Innan byggkontraktet låses inför källkodsfasen öppnas en dedikerad rannsakningskanal:
   - *Steg 3d (Epistemisk Omvändelse):* Ordet ges exklusivt till *Att vända om* med mandatet: *"Zooma ut. Missade vi något kritiskt? Bygger detta på en falsk premiss eller ett tomt catch-block? Finns det enklare vägar vi blivit blinda för?"*. Vid allvarliga brister deklarerar agenten `STATUS: OMSTART`.
   - *Steg 3e (Förlikningsgrind):* Om omstart begärs träder *Att förlikas* in för att väga bristen mot det överordnade syftet. Den väljer antingen `STATUS: OMSTART_FAS1` (sanerar VFS och startar om planeringssvepet i en ren underprocess via `--omvandelse`) eller `STATUS: GODKÄND_MED_SKULD` (accepterar bristen temporärt och delegerar åtgärden till Fas 3).
2. **Fas 3 (Post-Exekvering):** Teatern utvärderar inte bara källkoden utan rannsakar själva orkestreringsprocessen och identifierar eventuell skuld som ackumulerats under bygget.

### Konsekvenser
- Arkitektoniska feltänk och syntaktiska blindgator elimineras innan källkodsproduktionen påbörjas.
- TDD-loopen i Fas 2 avlastas drastiskt, vilket minimerar antalet självrättningscykler och sparar tokens.


## ADR-024: Självläkande Processer och Sluten Auto-MAINT i Teatern
- **Status:** Beslutad
- **Datum:** 2026-11-01

### Kontext
Tidigare dokumenterades lärdomar från byggcykler som passiv text i loggar eller i `doc/PROCESS_IMPROVEMENTS.md` utan att det ledde till faktiska förändringar i kodbasen. När en körning stötte på friktion glömdes grundorsaken bort så snart bygget var över, varpå samma misstag upprepades i efterföljande biljetter.

### Beslut
1. **Aktiv processliggare:** `doc/PROCESS_IMPROVEMENTS.md` institutionaliseras som motorns aktiva liggare över identifierad process-skuld och erfarenheter.
2. **Förebyggande Teater (Fas 3):** Om en byggcykel innehållit omvändelse, felloggar eller kraschade verktygsanrop, avslutar *Att förlikas* inte med ren rapport, utan ställer frågan: *"Hur gör vi för att förebygga att det här händer igen?"*.
3. **Sluten självläkningsloop (Auto-MAINT):**
   - *Att förlikas* formulerar omedelbart en ny, strikt avgränsad underhållsbiljett (`doc/.TICKETS/TCK-MAINT-XXX.md`) med svenskt Gherkin-scenario och sparar den till disk via `save_code`.
   - Byggmotorn ges mandat att omedelbart exekvera denna auto-genererade MAINT-biljett i en obruten sekvens fram till den mänskliga godkännandegrinden (`j/s/n`).
   - Först när skyddsräcket är implementerat och verifierat tillåts nästa ordinarie funktionsbiljett att påbörjas.

### Konsekvenser
- Motorn förvandlas till ett självförbättrande system där varje misstag omedelbart omsätts i ett fysiskt skyddsräcke.
- Processförbättringar förblir inte önskelistor utan blir testad och incheckad källkod.


## ADR-025: Just-In-Time (JIT) Modularisering, Processminne och Headless Git-Arkitektur
- **Status:** Beslutad
- **Datum:** 2026-11-01

### Kontext
Under utvecklingen av bootstrappade v10.4 identifierades fyra kritiska flaskhalsar i motorns orkestrering:
1. **Monolitiskt kontextslitage:** Hela `doc/SI_v10.5.md` (över 10 000 tecken) skickas i sin helhet till varje enskild mikrosession. Detta förbrukar onödigt mycket av budgeten mot 65K TPM-taket för Gemini Live WebSockets.
2. **Kognitiva blinda fläckar för färdigheter (Skills):** Kritiska färdigheter i `.agents/skills/` (särskilt `decomposing-tickets`) förutsattes läsas in autonomt av modellen via `read_file`. Modellen missade ofta att göra detta under tidspress i Fas 0, vilket ledde till regelbrott mot FSD-gränsen (max 1 domän).
3. **Passivt processminne:** `doc/PROCESS_IMPROVEMENTS.md` existerade enbart som en passiv idé. Lärdomar från tidigare krascher togs inte tillvara som aktiva restriktioner vid nästa byggstart.
4. **Tröskeln vid manuell återställning:** När ett infrastrukturfel inträffade i `scripts/` tvingades användaren manuellt leta upp föregående commit-hash (`git checkout [HASH] -- scripts/...`) i stället för att systemet självt vet vad som är senast kända stabila tillstånd.

### Beslut

#### 1. Fasspecifik JIT-injektion (Kognitiv minimering)
`doc/SI_v10.5.md` upphör att skickas som en monolitisk textsträng. Orkestreringsskriptet (`scripts/run-planera-live.ts`) delar upp och injicerar uteslutande den kontext, de grindar och de regler som krävs för det specifika delsteget:
- **Fas 0 (Premissvalidering & Dörrvakt):**
  - Injicerar: FSD-avgränsning (max 1 domän under `src/features/`), krav på destruktiv sanering och Exploration Budget (max 3 tool-turns för mikrokanaler).
  - Inbäddad färdighet: Innehållet i `.agents/skills/decomposing-tickets/SKILL.md` inbäddas mekaniskt direkt i startankaret. Om biljetten bryter mot FSD klyvs den omedelbart utan att modellen först behöver leta efter instruktionsfilen på disken.
- **Fas 1 (Linjärt planeringssvep):**
  - Injicerar: Triadens oscillerande roller (Att följa, Att vända om, Att förlikas), `doc/FEATURE_INDEX.json` (repotopografi), BDD-krav samt relevanta augmented patterns (`reverse-direction`, `check-alignment`).
  - Injicerar aktivt processminne: Inläsning av sektionen *Aktiva Processregler* ur `doc/PROCESS_IMPROVEMENTS.md` så att kända fallgropar fungerar som direkta negativa bivillkor under planeringen.
- **Fas 2 (Källkodsexekvering & TDD):**
  - Injicerar: De tre handlingsvägarna (ADR-013/020), TDD Fail-First-kontraktet, skrivskyddet för tester samt AST-kraven för Gate 2c (inga tysta catch-block) och Gate 3a (körtidsankare).
  - Maskering: All övergripande arkitekturfilosofi, topografikartor och Fas 1-teori maskeras bort för att hålla källkodssessionen ren, snabb och fokuserad.
- **Fas 3 (Teatern & Auto-MAINT):**
  - Injicerar: Reflektionsreglerna (ADR-024) och den exakta mallen för att generera självläkande `TCK-MAINT`-biljetter.

#### 2. Headless Git som Osynlig Transaktionsmotor (Bootstrapping)
Under motorns nuvarande utvecklingsfas i Linux-miljön automatiseras Git så att användaren slipper hantera commit-hashar manuellt:
- **Mekanisk `last-known-green`-tagg:**
  - Varje gång en byggcykel når grön slutverifiering och godkänns av människan vid grinden (`Exit 0`), flyttar orkestreringsskriptet automatiskt den lokala Git-taggen:
    `git tag -f last-known-green`
- **Automatiserad återställning vid Moment 22:**
  - Om ett internt syntaxfel, verktygshaveri eller korrupt tillstånd inträffar i infrastrukturen (`scripts/`), tillhandahåller systemet ett standardiserat återställningskommando baserat på taggen:
    `git checkout last-known-green -- scripts/ doc/SI_v10.5.md`
    vilket omedelbart återställer systemet till senast verifierade tillstånd utan att behöva söka i git-loggen.

### Konsekvenser
- **Token-effektivitet:** Startkontexten per mikrokanal bär enbart exakt relevant data, vilket minimerar risken för att slå i 65K TPM-gränsen.
- **Deterministisk verktygsanvändning:** Kritiska färdigheter som biljettklyvning finns alltid i modellens omedelbara arbetsminne vid grindkontroller.
- **Minskad friktion:** Versionshanteringen blir självspårande via taggen `last-known-green`.
- **Sluten erfarenhetsåterkoppling:** Processen lär sig aktivt genom att föra över lärdomar från `PROCESS_IMPROVEMENTS.md` direkt till nästa cykels startankare.


## ADR-026: Serverlös BYOK-Utvecklingsmiljö och Källkodslagring på Google Drive
- **Status:** Beslutad
- **Datum:** 2026-11-01

### Kontext
I projektets bootstrapping-fas används Linux-terminalen, Git och lokala Node-skript för att bygga och härda orkestreringsmotorn. För en icke-kodande användare i en ren BYOK-miljö (Bring Your Own Key) är dock Git, terminaler och manuella miljökonfigurationer oacceptabla trösklar. Målet är att Outreach ska fungera som ett komplett mjukvaruprogrammeringsverktyg direkt i webbläsaren, där användaren äger hela sin kodbas via sitt eget Google-konto.

### Beslut
Vi frikopplar källkodsutvecklingen från Git och migrerar den till en serverlös webbläsararkitektur baserad på VFS och Google Drive:

1. **Google Drive som Primärt Källkodsarkiv:**
   - Hela mjukvaruprojektet (källkod `src/`, tester, scheman och konfiguration) lagras och ägs i användarens Google Drive under `/Outreach_Workspace/[Projekt]/`.
   - Google Drive ersätter externa git-servrar (GitHub/GitLab) för slutanvändaren.

2. **VFS som Krockkudde mot Rate Limits:**
   - All kompilering, TypeScript AST-skanning, transienta tester och patchning körs uteslutande i webbläsarens interna minne via Virtual File System (RAM / IndexedDB / OPFS).
   - Inga mikroläsningar eller temporära byggfiler belastar Google Drive API under pågående byggsteg.

3. **Hastighetsbegränsad Transaktionssynk (Throttled Sync):**
   - Endast filer med ändrat tillstånd (dirty flag) skickas till Google Drive.
   - Uppladdningen styrs av en Leaky Bucket-kö i `driveClient.ts` begränsad till max 5 anrop/sekund med automatisk exponentiell backoff vid HTTP 429.

4. **Atomära Transaktioner via Manifest:**
   - Varje framgångsrikt bygge förseglas genom att uppdatera `WORKSPACE_MANIFEST.json`.
   - Manifestet lagrar versions-id, tidsstämpel och kryptografiska filhashar, vilket ger användaren en visuell tidslinje och en-klicks ångerrätt direkt i gränssnittet utan Git.

### Konsekvenser
- Användaren får ett fullvärdigt mjukvarubyggarverktyg utan att någonsin installera Node, Git eller öppna en terminal.
- Källkoden förblir 100 % portabel och kan öppnas i valfri extern IDE eller exporteras som zip när som helst.

## ADR-027: Hermetisk VFS-Körtid, Snapshot-Rollbacks och Fuskfri Testexekvering
- **Status:** Beslutad
- **Datum:** 2026-11-01

### Kontext
Vid övergången från lokal Linux-utveckling till en serverlös BYOK-miljö i webbläsaren (ADR-026) ersätts hårddisken med en Virtual File System (VFS i RAM/IndexedDB). När operativsystemets processer (`execSync`, `git checkout`) försvinner uppstår frågan hur systemet garanterar fuskfria tester (Agentic Test Tampering) och hur mikrosekundssnabba rollbacks genomförs vid omvändelse eller kraschade patchar.

### Beslut
Vi upprättar en hermetiskt sluten VFS-körtid med tre mekaniska säkerhetsbarriärer:

1. **Monterat Skrivskydd i RAM (Read-Only Mount):**
   - Under Fas 2 (Källkodsexekvering) monteras katalogträdet `/src/__tests__/` som strikt skrivskyddat i VFS.
   - Verktygen `apply_patch` och `save_code` kopplas mot VFS-drivrutinen. Alla försök från modellen att modifiera, trunkera eller byta ut en testfil avvisas med ett omedelbart VFS-undantag (`VFS_PERMISSION_DENIED`).

2. **Kryptografisk Manifestvalidering (Anti-Tamper):**
   - När transient-testet genereras i Fas 1 (steg 3a) beräknas dess kryptografiska SHA-256-hash och låses i `doc/LAST_CYCLE/WORKSPACE_MANIFEST.json`.
   - Innan testköraren i minnet exekverar sviten hashas testfilen i VFS. Om hashen avviker från manifestets låsta värde kraschas bygget omedelbart.

3. **Deterministiska Minnessnapshots (Zero-Latency Rollback):**
   - Vid godkänd Intent Gate (Fas 0) och efter slutfört planeringskontrakt (Fas 1) tar VFS en fryst ögonblicksbild av källkodsträdet i minnet (`vfs.snapshot('post-fas1')`).
   - Om transient-testet fallerar i Fas 2, eller om modellen signalerar `HAVERERAT_KONTRAKT` eller `FÖRLIKANDE_OMVÄNDELSE`:
     * Källkodsträdet återställs omedelbart från minneskopian (`vfs.restore('post-fas1')`) på 0 millisekunder utan disk-I/O.
     * Felloggen skrivs till WAL (`CRASH_DUMP.json`).

4. **Isomorf In-Memory Testexekvering:**
   - Testerna exekveras i en isolerad Web Worker med en ren JavaScript-testrunner kopplad till TypeScripts inbyggda Compiler API.
   - Grindarna Gate 2c (inga tysta catch) och Gate 3a (körtidsankare via WebSockets/Audio) körs mot källkodssträngar direkt ur RAM.

### Konsekvenser
- Testintegriteten blir starkare och mer deterministisk än i en Linux-miljö då filsystemsrättigheterna upprätthålls direkt av minnesarkitekturen.
- Rollbacks vid omvändelse sker utan fördröjning eller risk för korrupta filer på hårddisken.
- Google Drive skyddas helt från trasiga testcykler eftersom enbart 100 % gröna, verifierade tillstånd tillåts flöda upp till molnkontot.


## ADR-028: Den Teologiska Ordboken och Vägens Terminologi
- **Status:** Beslutad
- **Datum:** 2026-11-02

### Kontext
I takt med att orkestreringsmotorn mognar från ett proceduriellt Node-skript till ett typat TypeScript-program, har en diskrepans uppstått mellan systemets högre syfte och dess terminologi. Ord som "pipeline", "grindar" och "dörrvakter" bär med sig en industriell, teknokratisk association. Eftersom systemets hjärta handlar om försoning och att leda människan på rätt väg, måste arkitekturens grundläggande ordval spegla denna vördnad.

### Beslut
Vi upprättar en formell övergång till en teologiskt förankrad begreppsapparat. Denna ordbok ska vägleda all framtida namngivning av FSD-domäner, klasser, gränssnitt och instruktioner.

#### Den Officiella Namnlistan (Översättningsnyckel)
| Gammal industriell term | Ny skriftlig & arkitektonisk term | Teknisk betydelse i koden |
| :--- | :--- | :--- |
| **Pipeline / Process** | **Väg (`Path`)** | Det sammanhållna flödet från Fas 0 till Fas 3. Modelleras under `src/features/path/`. |
| **Dörrvakt (Fas 0)** | **Portväktare** | Den inledande revisionen som vaktar systemets yttre gränser. Avvisar försök att korsa >1 FSD-domän. |
| **Intent Gate** | **Avsiktsport** | Det interaktiva gränssnittet (Fas 0) där agenten knackar, och människan bedömer intentionen. Öppnas via medgivande. |
| **Kvalitetsgrind (Gate 2c/3a)** | **Prövningsport** | Mekanisk tröskel där koden prövas mot sanningen (exekvering i minnet mot ett körtidsankare; inga tysta catch-block). |
| **Transition / Körning** | **Knackning** | Handling för att övergå mellan faser. Systemet stormar inte in, det knackar på porten och inväntar utslag. |
| **Rollback / Abort** | **Omvändelse** | Rätten att backa bandet vid `OMSTART_FAS1`, sanera oren källkod och återvända på rätt väg utan systemkrasch. |

### Konsekvenser
- **Mekanisk bakåtkompatibilitet:** Dagens skript (`run-planera-live.ts`) fortsätter att använda de gamla termerna ("Gate 3a", "Intent Gate") internt som en byggnadsställning tills nästa generation av motorn är färdig.
- **Riktlinje för Nyskrivning:** När domänen `src/features/path/` (ADR-029) byggs upp, ska all källkod, typer (t.ex. `interface Port`, `class Vaktaren`) och alla Gherkin-scenarier uteslutande använda de nya termerna.
- Terminologin eliminerar industriell jargong och förenar systemarkitekturen med försoningstanken.


## ADR-029: Det Deklarativa Processprogrammet (Vägen) och Strangler Fig-Arkitekturen
- **Status:** Beslutad
- **Datum:** 2026-11-02

### Kontext
Det befintliga orkestreringsskriptet (`scripts/run-planera-live.ts`) är ett imperativt skript på över 35 KB som hanterar hela livscykeln. Skriptet är fyllt av råa strängjämförelser, vilket gör det omöjligt att utöka säkert. En omskrivning på plats skulle riskera ett Moment 22 (att motorn kraschar när vi försöker bygga om motorn).

### Beslut
Vi ersätter det imperativa skriptet med en ren, typad tillståndsmaskin enligt ordboken i ADR-028. För att göra detta utan driftstopp tillämpar vi **Strangler Fig-mönstret**.

1. **Parallell uppbyggnad:**
   - Det nuvarande skriptet i `scripts/` lämnas orört och fortsätter agera aktiv byggnadsställning för dagens biljetter.
   - Det nya processprogrammet byggs under den nya domänen `src/features/path/`.

2. **Vägen (`Path`) som FSD-domän:**
   - Modelleras som en starkt typad tillståndsmaskin i TypeScript.
   - Består av **Steg**, som exekverar isolerad verktygslogik, och **Portar**, som övervakar gränserna.
   - Väktaren vid porten, Avsiktsporten och Prövningsporten implementeras som asynkrona nodobjekt med stöd för både CLI och reaktiva webb-gränssnitt.

3. **Inbyggd JIT-Kompilator:**
   - En dedikerad modul (`promptCompiler.ts`) i den nya domänen ansvarar för att bygga magra startankare (< 2000 tokens) baserat på det aktuella steget. Inga fler monolitiska textmassor skickas i bygget.

4. **Sömlös Övergång:**
   - Först när `Path` är 100 % grön i Vitest (hermetisk prövning i minnet) och bevisat kan styra en cykel, pekas anropet `pnpm bygg` om från legacy-skriptet till den nya domänen.

### Konsekvenser
- Total testbarhet: Byggprocessen kan verifieras ner på nod-nivå i minnet på millisekunder.
- Noll stillestånd: Systemet kan fortsätta laga sig självt (Auto-MAINT) under hela ombyggnadsperioden.
- Processen blir ett verkligt "program", konfigurerbart och begripligt som kod, istället för ett hårdkodat bash-flöde.


## ADR-030: Den Receptbaserade Vägmotorn, Integritetssanering (Append-Only WAL) och Exempelskördning
- **Status:** Beslutad
- **Datum:** 2026-11-02

### Kontext
Orkestreringen av källkodsgenereringen migrerar från ett proceduriellt Node-skript (`scripts/run-planera-live.ts`) till en typad domän under `src/features/path/` (ADR-028/029). För att skydda systemet mot regressionshaverier och samtidigt möjliggöra empirisk utveckling av en enklare process krävs en arkitektur som tillåter parallella körspår. Samtidigt behöver motorn befrias från klientside-kryptografi (CYCLE_SALT/HMAC) som saknar skyddsvärde i en serverlös webbläsarmiljö (ADR-026), samt etablera en säker strategi för historiska testsviter (*.legacy.ts).

### Beslut
Vi fattar tre sammanhängande arkitekturbeslut:

1. **Den Receptbaserade Vägmotorn (`PathRecipe`):**
   - Motorn (`src/features/path/engine/pathRunner.ts`) görs sekvens-agnostisk. Den exekverar uteslutande två typer av noder: `StepNode` (handling) och `PortNode` (prövande tröskel).
   - Två recept etableras sida vid sida under `src/features/path/recipes/`:
     * `path-classic` (Referensspår / Livlina): Vår beprövade 12-stegsmaskin från Fas 0–3 förblir intakt och orörd.
     * `path-lean` (Empiriskt forskningsspår): En 4-portsmodell bestående av Avsiktsporten (mänsklig avsikt via klarspråk), Prövningsporten (rannsakan, omvändelse och prediktiv fail-first), Konstruktionsporten (isolerat grönt bygge) och Harmoniseringsporten (källkodsrefaktorisering och WAL-append).

2. **Integritetssanering: Från Klientside-HMAC till Append-Only WAL:**
   - Kravet på symmetrisk `CYCLE_SALT` och hashkedjevalidering i `STATE.json` och `CYCLE_LOG.md` avvecklas.
   - Systemets integritet baseras uteslutande på tre reella garantier:
     1. En strikt Append-Only WAL för all telemetri och tillståndsändring.
     2. Starkt typade Zod-scheman vid alla systemsnitt och I/O-operationer.
     3. Mekaniska körtidsbevis i Vitest (Fail-First) och transaktionsintegritet i Git/VFS.

3. **Principen om Exempelskördning av `*.legacy.ts`:**
   - Historiska testfiler under `src/__tests__/*.legacy.ts` raderas inte. De betraktas som en passiv kunskapsbank över verifierade integrationsmönster och felhanteringsflöden.
   - När moduler i `src/features/` vidareutvecklas skördas relevanta scenarier ur legacy-filerna och återetableras som aktiva, hermetiska enhetstester under respektive domäns `__tests__/`-katalog. Först när de nya testerna är gröna saneras motsvarande del ur legacy-filen.

### Konsekvenser
- Noll risk: Vi kan utforska och mäta 4-portsmodellen (`path-lean`) utan att förlora tryggheten i vår beprövade 12-stegsmodell (`path-classic`).
- Källkoden förbereds helt för serverlös körning i webbläsaren enligt ADR-026 utan artificiella HMAC-krascher.
- Hårdvunnen testkunskap bevaras och återinförs kontrollerat i testsviten domän för domän.

## ADR-031: Källkodsmatriser, Mekanisk Konstruktionsintegritet och Typamputationsskydd
- **Status:** Beslutad (2026-11-08)
- **Beslut:** Konstruktionsporten validerar FilKrav[] mekaniskt; save_code skyddar mot typamputation; scripts/synka.ts kräver grön pnpm verify före push.
## ADR-032: Exponentiell Nätverksresiliens och Automatisk Återanslutning i Bidi Live
- **Status:** Beslutad (2026-11-08)
- **Beslut:** För att skydda orkestreringen mot transienta WebSocket-avbrott (Google RPC 1011/1006) införs automatisk återanslutning med exponentiell backoff i `scripts/bidiLiveRunner.ts`. Vid lyckad leverans av tokens nollställs felräknaren omedelbart.
