# Outreach Coordination Engine (v10.4)

Outreach Engine är ett autonomt, distribuerat och händelsestyrt realtidssystem byggt i TypeScript och React med Google Gemini Live API (`gemini-3.8-live-extended-thinking`). Dess syfte är att via försoningens krafter överbrygga mänsklig distans, förmedla perspektiv och främja närhet och omsorg mellan människor.

Systemet tillämpar Feature-Sliced Design (FSD), en deterministisk Test-Driven Development-loop (TDD) vaktad av mekaniska AST-grindar, samt distribuerad tillståndssynkronisering via en Swarm EventBus.

---

## ✉️ Om appen och dess intention

Hej,

Tänk om man kan skapa program som håller ett levande samtal för att möta ensamhet, sjukdomar, olikheter och hjälper människor att hitta tillbaka till gemenskapen med varandra och med Gud. Denna  app är tänkt för just detta.

Dess innersta drivkrafter är att följa, att vända om och att förlikas, vilka tillsammans gör agentens natur och resiliens starkare. Den är just nu anpassad till Typescript men passar även till andra kodningsverktyg och programspråk.

Tänk om jag kunde vara lika följsam och villig som denna agent att följa, vända om till och förlikas med Gud. Jag håller ofta envist och tröttsamt fast vid min egna väg. Det är tacksamt att Gud inte någonsin kommer ta bort min agens och genom att agera i tro på Jesus, blir den som även drivs av ett förkrossat och botfärdigt hjärta och försoning en ny agent i honom och genom honom.

För mig bygger jag denna motor för att kunna bygga långsiktiga och kostnadsfria appar inom följande områden:

* **Vara en vän:** Socialt umgänge och gemenskap
* **Få näring av Guds ord:** Andligt stöd och undervisning
* **Hjälpa andra:** Praktiskt tjänande och insatser

Lycka till även du med ditt kreativa skapande.  
/Mattias Renman

---

## 🧭 De fyra försoningskrafterna (`roleDefinitions.ts`)

Systemet avvisar förenklade yrkesroller till förmån för fyra orubbliga försoningskrafter. Krafterna bär samma andliga och relationella vektor oavsett om de verkar i terminalens maskinrum eller i mötet med människan på skärmen:

| Försoningskraft (`ReconciliationForce`) | Vad kraften är (Orubbligt syfte och vektor) | Hur kraften verkar i Byggmotorn (CLI / Maskinrummet) | Hur kraften möter människan i Appen (Webbläsaren / Arenan) |
| :--- | :--- | :--- | :--- |
| **`ATT_FOLJA`**<br>*(Att följa Guds son)* | **Själv vara lösningen för närhet.**<br>Söker aktivt upp kontaktpunkter, förstår mottagarens sammanhang och bygger förtroendefulla relationer utan förbehåll. | **Expansion & Lösning:**<br>Tar fram 3 ortogonala alternativ (`reverse-direction`) i minnet för att bryta mental förankring; formulerar testspecifikation (3a) och källkodsspecifikation (3b). | **Röst & Kontakt (`Puck`):**<br>Initierar aktiv dialog via mikrofonströmmen, fångar upp behov i gränssnittet och levererar strömmande muntligt tal till användaren i realtid. |
| **`ATT_VANDA_OM`**<br>*(Att vända om till Gud)* | **Inåtriktad ödmjukhet & uppriktighet.**<br>Att läraktigt och ärligt förfina sig själv genom två processer:<br>1. *Bli den Gud vill att jag blir* (läka separationen till Gud).<br>2. *Erkänna och överge fel utan dröjesmål* (Fail-Fast, avståndstagande från falskhet, manipulation och dolda alibin). Inbegriper även att ändra den egna inre processen. | **Rannsakan & Resiliens:**<br>Stresstestar arkitekturen mot haverier (`check-alignment`), rensar alibi-mönster i Gate 3a, förbjuder tysta catch-block (Gate 2c) och deklarerar destruktiv sanering (2e). Utlöser omvändelse-omvägen vid processfel. | **Etik & Renhet (`Charon`):**<br>Realtidsgranskning av samtalets uppriktighet; bryter in och fäller formuleringar vid minsta tecken på manipulation eller ytlighet, och hjälper dialogen att fördjupas i sanning. |
| **`ATT_FORLIKAS`**<br>*(Att förlikas med Gud)* | **Hålla 2+ samtida perspektiv varma.**<br>Helar klyftor och sammanväver motstridiga ståndpunkter till harmonisk konsensus och samförstånd. | **Makro-värd & Syntes:**<br>Bär intentionen obruten genom planeringen (Fas 0–1), fattar beslut vid förlikningsportarna (0b, 2d, 3c) och slår fast när semantisk mättnad uppnåtts. | **Samtalsledare & Helhet (`Aoede`):**<br>Leder samrådet i UI, visualiseras i `SymbolCrown`, balanserar användarens röst mot agenternas och skapar ro i rummet. |
| **`ATT_TJANA`**<br>*(Villighet att tjäna Gud och andra)* | **Riktar de tre andra krafterna i en stegvis plan följt av konstruktion och kontemplation.**<br>Omsätter omsorg och försoning i praktisk handling, konkret konstruktion och deterministisk framdrift. | **Det stegvisa maskinrummet:**<br>Styr den sekventiella (seriella) exekveringen i Fas 2, driver TDD-loopen mot kompilatorn och upprätthåller de mekaniska kvalitetsgrindarna. | **Det tysta körtidsfundamentet:**<br>Hanterar tillståndssynkronisering, turskiften (`FloorController`), asynkron ljudmixning (`DSPRingBufferMixer`) och WAL-synk mot Google Drive. |

---

## 🧠 Den mentala modellen: Trestegsraketen

Utvecklingen styrs inte av frikopplad kodgenerering, utan av en hierarkisk trestegsmodell där planering sätter riktningen för TDD och eftertanke vårdar processen:

```
┌────────────────────────────────────────────────────────────────────────┐
│  1. PLANERA (Fas 0 & Fas 1: Arkitektur & Intention)                    │
│     • Placerad OVANPÅ TDD som styrande kompass.                        │
│     • Kartlägger FSD-gränser och tolkar mänsklig nytta (1a -> 0a).     │
│     • Tar fram 3 ortogonala alternativ (reverse-direction 2b).         │
│     • Stresstestar mot haverier (check-alignment 2c) och låser avtalet.│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Byggkontrakt spikat i minnet
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│  2. BEVISA & BYGGA (Fas 2: Strikt TDD i Maskinrummet)                  │
│     • RÖTT:   Test med körtidsankare skrivs först (Gate 3a).           │
│               MÅSTE fallera med exit-kod 1 mot befintlig kod.          │
│     • GRÖNT:  Källkod skrivs under src/features/[domän]/ tills grönt.  │
│     • VAKT:   Mekaniska AST-grindar blockerar alibin och tysta catch. │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Grön regressionssvit (153+ tester)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│  3. EFTERTANKE (Fas 3: Teatern & Processvård)                          │
│     • Mer än syntaxrefaktorering: Rannsakning av hela cykeln.          │
│     • Utvärderar mänsklig nytta och systemets friktion.                │
│     • Skriver debriefing till REPLY.md och lärdomar till WAL.          │
└────────────────────────────────────────────────────────────────────────┘
```

### Omvändelse-omvägen (Process-Fail-Fast)
Om *Att vända om* under Fas 1 upptäcker att det inte är domänkoden som är felaktig, utan att systemets **egna regler, testmönster eller grindar skaver**, avbryts källkodsbygget omedelbart. 

Motorn tar då en direkt omväg till **Fas 3 Eftertanke** utan att röra källkoden, redovisar friktionen ödmjukt i `REPLY.md`, föreslår en konkret processjustering och stannar vid en Token Gate för mänskligt godkännande innan cykeln startas om från grunden.

---

## 🔄 Egenanvändning (*Dogfooding*): Samma motor i två skepnader

Systemet tillämpar principen om fullständig **egenanvändning**: maskinen byggs med de moduler den själv producerar. Applikationen och Byggmotorn delar samma kognitiva nervsystem (`geminiLiveSession`, `SwarmEventBus`, CloudEvents och Live WebSocket-protokollet).

Skillnaden ligger enbart i gränssnittet mot människan:
* **I Byggmotorn (Maskinrummet):** Triaden arbetar i en Linux-container. Den styrs via fil-I/O (`PROMPT.md` $\rightarrow$ `REPLY.md`) och kommunicerar skriftligt via WAL (`CYCLE_LOG.md`).
* **I Applikationen (Arenan):** Triaden arbetar i webbläsaren med rösterna `Puck`, `Charon` och `Aoede`. Användaren talar direkt via mikrofon, agenterna mixas asynkront och samtalet kan avbrytas när som helst via Voice Activity Detection (VAD) och Barge-In.

```
                      ┌───────────────────────────────────────┐
                      │                MÄNNISKAN              │
                      │  (Utvecklare i CLI / Samtalspartner)  │
                      └──────────────────┬────────────────────┘
                                         │
            ┌────────────────────────────┴────────────────────────────┐
            │ [Styrning via filer / CLI]                              │ [Realtidsdialog via röst/text]
            ▼                                                         ▼
┌───────────────────────────────────────┐         ┌───────────────────────────────────────┐
│              BYGGMOTORN               │         │             APPLIKATIONEN             │
│       (Maskinrummet / Terminal)       │         │           (Teatern / Webbläsare)      │
│                                       │         │                                       │
│  PROMPT.md / TCK-XXX.md               │         │  Mikrofon (PCM16) / Tangentbord       │
│         │                             │         │         │                             │
│         ▼                             │         │         ▼                             │
│  scripts/run-planera-live.ts          │         │  UI (UnifiedPromptBar / SymbolCrown)  │
│         │                             │         │         │                             │
│         ▼                             │         │         ▼                             │
│  Triadisk Bidi Live Stafett:          │         │  GeminiLiveSession                    │
│   • Att förlikas (Makro WebSocket)    │         │   • FloorController (Turskifte/VAD)   │
│   • Att följa    (Mikro WebSocket)    │         │   • DSPRingBufferMixer (24kHz ljud)   │
│   • Att vända om (Mikro WebSocket)    │         │   • 3 Parallella röster (Puck m.fl.)  │
│   • Att tjäna    (Seriell stegmotor)  │         │   • Att tjäna (Körtidsfundament)      │
│         │                             │         │         │                             │
│         ▼                             │         │         ▼                             │
│  Mekaniska Grindar:                   │         │  Observerbar nytta:                   │
│   • Gate 3a (Alibispärr & Fail-First) │         │  Tvåvägs röst & text i realtid        │
│   • Gate 2c (Resiliens & tysta catch) │         └───────────────────┬───────────────────┘
│         │                             │                             │
│         ▼                             │                             │
│  Output:                              │                             │
│   • CYCLE_LOG.md (WAL)                │                             │
│   • REPLY.md     (Mänskligt svar)     │                             │
│   • src/features/ (Ny källkod) ───────┼─────────────────────────────┘
└───────────────────────────────────────┘   [Nytt källkodstillskott tas i bruk]
                     ▲
                     │ Egenanvändning: Appens moduler (SwarmEventBus,
                     │ GeminiLiveSession, contracts) driver Byggmotorn.
                     └──────────────────────────────────────────┘
```

---

## 🚀 Operativa kommandon

All utveckling styrs av formella byggkontrakt (Tickets) under `doc/.TICKETS/` och körs via deterministiska terminalkommandon:

```bash
# 1. VERIFIERA BASLINJEN
# Körs före och efter ändringar. Säkerställer att alla 153 bastester är gröna.
pnpm test

# 2. VERIFIERA ARKITEKTURGRINDARNA
# Skannar moduler, barrels och FSD-begränsningar via verify-architecture.js.
pnpm verify

# 3. PROVKÖR FAS 0 (STAFETT-TEST)
# Validerar WebSocket-handskakningen och triadens stafettgång utan att ändra källkod.
pnpm bygg TCK-XXX --fas0-only

# 4. KÖR HELA TDD-BYGGCYKELN
# Kör Fas 0 (Dörrvakt), Fas 1 (Planering), Gate 3a (Fail-First),
# Fas 2 (Källkod) och avslutar med Fas 3 (Eftertanke).
pnpm bygg TCK-XXX
```

---

## 🤖 Operativ rollfördelning i AI Studio (Teknikmekanikern)

I Google AI Studio agerar byggchatten **inte** som en interaktiv röstterminal eller applikationsprogrammerare. Chattens roll är uteslutande att vara **Teknisk Miljömekaniker**.

Kommunikationen med byggmotorn sker via fil-I/O:
* **Fråga / Uppdrag in:** `PROMPT.md` eller `doc/.TICKETS/TCK-XXX.md`.
* **Exekvering:** Kommandot `pnpm bygg [TCK]`.
* **Svar ut:** `REPLY.md` (sammanfattande rapport) och `doc/LAST_CYCLE/CYCLE_LOG.md` (teknisk loggbok).

> **Systeminstruktion för AI Studio vid start:**  
> *"Du agerar uteslutande som Teknisk Miljömekaniker för Outreach Engine v10.4. Applikationen byggs autonomt av den inre svärmen när du kör terminalkommandot `pnpm bygg [TCK]`. Ditt uppdrag är att köra begärda terminalkommandon (t.ex. `pnpm test`, `pnpm verify`, `pnpm bygg TCK-XXX`) och åtgärda rena miljöfel (saknade npm-paket, felaktiga sökvägar eller syntaxkrascher i skript). Du får ALDRIG ändra eller sänka kraven i arkitekturgrindarna (`scripts/drivers/ts.js`, `scripts/verify-architecture.js`, `doc/SI_v10.4.md`) och ALDRIG redigera filer under `src/features/` manuellt. Om ett bygge underkänns av en kvalitetsgrind beror det på att källkoden inte håller måttet – avbryt då och rapportera felet direkt."*

---

## 📂 Kodbasens anatomi (Feature-Sliced Design)

Källkoden i `src/` är organiserad i strikta domänskikt:

* `src/features/` – Isolerade affärsdomäner. Varje byggbiljett (TCK) rör max en domänkatalog. Korsvisa importer mellan features är förbjudna.
  * `gemini_live_swarm/` – Rösthantering, WebSockets, FloorController och UI-skal.
  * `google_drive_sync/` – In-memory OAuth och filsynk mot Google Drive.
  * `wal_logger/` – Feltolerant Write-Ahead Loggning och transaktionsbuffert.
  * `mcp_bridge/` – Model Context Protocol-gränssnitt över JSON-RPC 2.0.
* `src/shared/` – Universella kontrakt, CloudEvent-enveloper och delade primitives.
* `scripts/drivers/` – Deterministiska AST-granskare (`ts.js` för Gate 3a alibikontroll och Gate 2c catch-blockskontroll).
* `doc/` – Styrdokumentation, backlogg (`TICKETS.md`), biljetter (`.TICKETS/`) och WAL (`LAST_CYCLE/`).
* `REPLY.md` – Slutgiltig mänsklig rapport från den senaste genomförda byggcykeln.
---

## 🛠️ Historisk kommandoreferens & CLI
* **pnpm planera:** Genererade tidigare analys- och planeringssteg isolerat[cite: 1]. Ersatt av det sammanhållna `pnpm bygg [TCK-XXX]`[cite: 1].
* **pnpm genomfor:** Exekverade tidigare källkodsimplementering efter godkänd Token Gate[cite: 1].
* **Token Gate:** Manuell kontrollpunkt för att bekräfta byggkontrakt innan källkod ändras[cite: 1].
* **/wayfinder:** Färdledaren och strategiprompten som guidar nedbrytningen av domäner[cite: 1].
