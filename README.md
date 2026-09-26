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

### 4. Gemini Live Swarm (`src/features/gemini_live_swarm`)
- Drivs av `@google/genai` (Gemini 2.5 Flash).
- Multi-agent pipeline med 4 roller:
  - **Orchestrator**: Samordning, stegplanering och konsensus.
  - **Researcher**: Marknads- och målgruppsanalys.
  - **Outreach Writer**: Personlig brevsyntes.
  - **Critic**: Etik-, GDPR- och relevansgranskning med kvalitetsbetyg.

---

## 🛠️ Kom igång & Installation

### Förutsättningar
- Node.js >= 18
- Google AI Studio API-nyckel (`GEMINI_API_KEY`)
- (Valfritt för skarp Google Drive synk) Google Workspace OAuth Access Token

### Snabbstart (pnpm / npm)
```bash
# 1. Installera beroenden
pnpm install

# 2. Planera ny funktionalitet (skapar eller analyserar tickets)
pnpm planera
# eller rikta mot specifik bygg-ticket:
pnpm planera TCK-004

# 3. Lås upp och verkställ efter godkänd Token Gate
pnpm genomfor [REQUIRED_TOKEN]

# 4. Kör arkitektur- och kontraktsvalidering
pnpm verify

# 5. Kör isolerade TDD-enhetstester
pnpm test

# 6. Initiera Google Drive Workspace lokalt
node scripts/init-drive-workspace.js

# 7. Starta utvecklingsservern
pnpm dev
```

---

## 🧭 SI v10.0 Utvecklingsrutiner & Token Gate

Outreach Samordningsmotor styrs av de strikta utvecklings- och processkontrakten i **SI v10.0** och **AGENTS.md v10.0**:

### 1. Tvåfasig Exekvering (Fas 1 Planera ➔ Fas 2 Genomför)
- **Fas 1 (Planering under `doc/`):**
  - Vid `pnpm planera` utan ticket-kod körs användarorientering och nedbrytning via skillen `decomposing-tickets`.
  - Vid `pnpm planera TCK-XXX` körs ett linjärt Fas 1-svep (`1a_forsta.md` ➔ `1b_kartlagga.md` ➔ `2e_syntetisera.md` ➔ `3c_fil_operativ_kallkodsspecifikation.md`).
  - Alla GROW-risknoder (*State*, *Contract*, *Resilience*) analyseras och besvaras internt utan chattavbrott.
  - Inga filer under `src/` rörs under Fas 1.
- **Token Gate (Spärr vid Steg 3c):**
  - När alla målkonflikter lösts och mättnad uppnåtts (`MÄTTNAD: JA`) genereras en unik engångskod i `doc/LAST_CYCLE/REQUIRED_TOKEN.txt`.
  - Agenten stannar obligatoriskt vid Steg 3c och presenterar statusrad, användarnytta, systembeteende och godkännandekoden för mänsklig granskning (HITL).
- **Fas 2 (Verkställande via `pnpm genomfor`):**
  - Kommandot `pnpm genomfor [REQUIRED_TOKEN]` validerar godkännandekoden mot `REQUIRED_TOKEN.txt` och skapar `doc/LAST_CYCLE/APPROVAL.md`.
  - Först då tillåts källkodsändringar under den aktuella modulen i `src/features/`.
  - Ett transient mikro-E2E-test (`src/__tests__/transient_TCK-XXX.test.ts`) skapas och exekveras i minnet (< 3s).
  - Vid godkänt kvitto konsolideras testet till regressionssviten och ärendet markeras slutfört.

### 2. Oberoende Arkitekturvalidering (`pnpm verify`)
- Skriptet `scripts/verify-architecture.js` kontrollerar oberoende av chattkontexten:
  - Att aktiva tickets i `doc/TICKETS.md` är giltiga.
  - Att `doc/FEATURE_INDEX.json` är synkad.
  - Att Zod-scheman och `EventEnvelope`-kontrakt uppfylls.
  - Att ingen kod har skrivits i `src/features/` utan giltig `APPROVAL.md`.
  - Genererar ett kryptografiskt verifieringskvitto i `doc/LAST_CYCLE/VERIFY_RECEIPT.json`.

---

## 🧭 Beslutsstöd & Scenariodialoger via Wayfinder (`/wayfinder`)

Systemet tillämpar en strikt separation mellan **besluts-tickets** och **bygg-tickets**:

| Typ | Syfte | Plats | Kodändring i `src/` |
| :--- | :--- | :--- | :--- |
| **Besluts-ticket** | Scenariofrågor, vägval, arkitekturanalys | Wayfinder-kartan & dialog | ❌ Nej |
| **Bygg-ticket** | Konkret implementation bunden till 1 FSD-domän | `doc/TICKETS/TCK-XXX.md` | ✅ Ja (i Fas 2) |

### När används `/wayfinder`?
- **Skingra strategisk dimma:** När kravbilden är oklar eller när flera arkitektoniska alternativ står mot varandra.
- **Scenarioanalys:** Ställ scenariofrågor på svenska för att belysa konsekvenser för tillstånd, kontrakt och driftsäkerhet innan utvecklingsresurser allokeras.
- **Skapa bygg-tickets:** När ett scenario är färdigutrett registreras avgränsade bygg-tickets i `doc/TICKETS.md`, redo för `pnpm planera TCK-XXX`.

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
