# Outreach Samordningsmotor

Ett autonomt, distribuerat och händelsestyrt samordningssystem för automatiserad outreach, byggt för sömlös integration med Google Workspace, modellkontextprotokoll (MCP), feltolerant transaktionsloggning (WAL) och Gemini Live multi-agent svärmintelligens.

---

## ✉️ Det Personliga Brevet: Varför denna Samordningsmotor Finns

> *Kära kollega och systembyggare,*
> 
> *När vi betraktar dagens landskap av AI-verktyg och outreach-automation ser vi ofta två ytterligheter: antingen stängda, opaka molntjänster där användaren förlorar insyn och ägarskap över sina data – eller fragmenterade skript som saknar tillförlitlighet och havererar vid minsta nätverkshicka.*
> 
> *Denna samordningsmotor föddes ur en grundläggande övertygelse: **Automation måste vara transparent, motståndskraftig och samarbetsvillig.***
> 
> 1. * **Ägarskap i Google Drive**: Din data och dina kampanjdokument ska bo där du redan arbetar. Genom att etablera en självläkande katalogstruktur (`/Outreach_Workspace/`) direkt i Google Drive stannar dina tillgångar i ditt ekosystem, kontrollerade av dina egna behörigheter.*
> 2. * **Transparens genom Write-Ahead Logging (WAL)**: Ingenting sker i det fördolda. Varje agenttanke, varje verktygsanrop och varje dokumentändring skrivs först som ett oföränderligt, kryptografiskt länkat händelsekuvert (`EventEnvelope`). Om systemet startas om eller webbläsaren laddas om, vet motorn exakt vad som slutförts och vad som behöver återhämtas.*
> 3. * **Kollektiv intelligens genom Svärmorkestrering**: Ett bra personligt brev skrivs inte av en ensam röst i ett vakuum. Vår Gemini Live Swarm delar upp ansvaret mellan en nyfiken Fältanalytiker, en empatisk Kommunikatör och en obarmhärtigt ärlig Kvalitetsgranskare som eliminerar spam och fluff innan ett enda ord når mottagaren.*
> 4. * **Öppna gränssnitt via MCP**: Genom att omfamna Model Context Protocol (MCP) bygger vi inte en sluten ö. Vilken modern AI-agent som helst kan docka in via standardiserade JSON-RPC 2.0-anrop och interagera med både Drive och transaktionsloggen.*
> 
> *Detta är inte bara kod – det är en digital kollega som respekterar dina mottagares tid, din organisations integritet och principerna för robust mjukvaruhantverk.*
> 
> *Med värme och framtidstro,*  
> **Teamet bakom Outreach Samordningsmotor**

---

## 🏛️ Systemarkitektur & Kärnpelare

```
                          ┌────────────────────────┐
                          │   OPERATÖRSPANEL (UI)  │
                          │   (React / Tailwind)   │
                          └───────────┬────────────┘
                                      │
           ┌──────────────────────────┼──────────────────────────┐
           │                          │                          │
           ▼                          ▼                          ▼
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│  GEMINI LIVE SWARM  │    │     WAL LOGGER      │    │     MCP BRIDGE      │
│  - Researcher       │───▶│  - Append-Only Log  │◀───│  - JSON-RPC 2.0     │
│  - Outreach Writer  │    │  - Crash Recovery   │    │  - Tools/List & Call│
│  - Critic           │    │  - Hash-chaining    │    │  - Drive & WAL tools│
│  - Orchestrator     │    └──────────┬──────────┘    └─────────────────────┘
└─────────────────────┘               │
                                      ▼
                          ┌────────────────────────┐
                          │   GOOGLE DRIVE SYNC    │
                          │   - In-memory OAuth    │
                          │   - Multipart Upload   │
                          │   - /Outreach_Workspace│
                          └────────────────────────┘
```

### 1. Google Drive Sync (`src/features/google_drive_sync`)
- Direkt kommunikation med Google Drive API v3.
- Skapar automatiskt hierarkin:
  - `Campaigns/`: Aktiva kampanjbrev och målgruppsdokument.
  - `Templates/`: Återanvändbara brev- och uppdragsmallar.
  - `Logs/`: Synkade revisionsloggar från WAL.
  - `Artifacts/`: Forskning och referensmaterial från agenterna.
- In-memory tokenhantering enligt säkerhetsstandarder – inga permanenta lagringar av hemligheter i `localStorage`.

### 2. Write-Ahead Logging (`src/features/wal_logger`)
- Garanterar atomär och deterministisk händelsehistorik.
- Allt kapslas i `EventEnvelope` (CloudEvents 1.0).
- Inkluderar `WalReplayer` för automatisk återhämtning av oavslutade operationer efter krascher.

### 3. MCP Bridge (`src/features/mcp_bridge`)
- Fullständigt stöd för Model Context Protocol över JSON-RPC 2.0.
- Exponerade standardverktyg:
  - `drive_create_file`: Skapa eller uppdatera filer i Drive.
  - `wal_query_recent`: Hämta och granska transaktioner.
  - `outreach_evaluate_tone`: Kvalitetsgranskning av utkast.

### 4. Gemini Live Swarm & SI v10.0 Agentkrafter (`src/features/gemini_live_swarm`)
- Drivs av `@google/genai` (Gemini 2.5 Flash) och reaktiv händelsebuss (`SwarmEventBus`).
- Strukturerad kring de tre samverkande kärnkrafterna och den 4:e linjära exekveringsmotorn:
  - **`ATT_FORLIKAS` (Orkestratör & Dörrvakt / Wayfinder 1a)**: Beslutsarkitekt som hanterar Wayfinder-orientering, sammanfogar insikter i 2e (MÄTTNAD: JA), låser kontrakt vid 3c (Token Gate) och skyddar källkoden.
  - **`ATT_FOLJA` (Skapare & Exekutör / Teknisk orientering)**: Drivande kraft som karterar FSD-moduler och exekverar domänlogik linjärt från 1a till 3c i ett obrutet framåtsträvande svep.
  - **`ATT_VANDA_OM` (Granskare / Intern riskanalys & Mikro-E2E)**: Oberoende bakgrundsgranskare som stresstestar kontrakt, tillämpar Fail Fast och validerar transienta mikro-E2E-tester (<3s).
  - **`SERIELL_MOTOR` (Fristående linjär SI v10.0-motor)**: Helautomatiserad motor som kör hela kedjan 1a -> 1b -> 2e -> 3c -> 4 linjärt i ett obrutet svep och rapporterar telemetri i realtid.

---

## 🛠️ Kom igång & Installation

### Förutsättningar
- Node.js >= 18
- pnpm (eller npm)
- Google AI Studio API-nyckel (`GEMINI_API_KEY`)
- (Valfritt för skarp Google Drive synk) Google Workspace OAuth Access Token

### Installation med pnpm & Wayfinder
```bash
# 1. Installera beroenden med pnpm (rekommenderat) eller npm
pnpm install
# (eller npm install)

# 2. Installera Matt Pococks Wayfinder-skill för besluts- och ticket-orientering
npx skills@latest add mattpocock/skills --skill=wayfinder -y

# 3. Kör arkitektur- och kontraktsvalidering
pnpm verify
# (eller npm run verify)

# 4. Kör isolerade TDD-enhetstester (< 3s)
pnpm test
# (eller npm test)

# 5. Initiera Google Drive Workspace lokalt
node scripts/init-drive-workspace.js

# 6. Starta utvecklingsservern
pnpm dev
# (eller npm run dev)
```

---

## 🧭 Wayfinder & Beslutsstyrning (`doc/TICKETS.md`)

Systemet tillämpar **Matt Pococks Wayfinder-metod** under Steg 1a (Dubbel Orientering):

1. **Vid oklara eller övergripande önskemål utan ticket-kod (`TCK-XXX`)**:
   - `/wayfinder`-läget aktiveras under kraften `ATT_FORLIKAS`.
   - Scenariofrågor ställs på svenska, antaganden klargörs och dimma skingras utan att källkoden under `src/` rörs.
   - Avgränsade bygg-tickets med tydlig definition-of-done registreras i `doc/TICKETS.md`.
2. **Vid aktiv ticket-kod (`TCK-XXX`)**:
   - Teknisk orientering tar vid via `ATT_FOLJA`.
   - Moduler karteras i `src/features/` och processkedjan drivs fram till Token Gate (Steg 3c).
   - Realtidsstatus och arkitekturkvitton synkroniseras mot `MasterDevelopmentPlan` i gränssnittet.

---

## 🧪 Testning & Kvalitetssäkring

Alla moduler levereras med isolerade TDD-tester under `src/__tests__/`:
```bash
npm test
```
- `envelope.test.ts`: Validerar CloudEvents schema och avvisar felaktiga format (Fail Fast).
- `wal_logger.test.ts`: Verifierar hash-kedjor, append-only och crash recovery.
- `drive_sync.test.ts`: Testar in-memory token, MIME-typer och mapphierarkier.
- `mcp_bridge.test.ts`: Verifierar JSON-RPC 2.0 protokoll, felkoder och verktygsanrop.
- `gemini_swarm.test.ts`: Testar agentroller och planexekvering.
