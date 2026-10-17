---
tools:
  mcp_servers:
    - name: "gemini-docs"
      type: "http"
      url: "https://gemini-api-docs-mcp.dev"
      description: "Official Gemini API and Live API real-time documentation and code patterns"
---

# AGENTS.md – Verktygs- & Agentmanifest (v10.4)

Detta manifest styr verktygsanvändning och agentbeteende för autonoma och assisterande agenter (Byggmotorn, Claude Code, Cursor, terminalskript och körtider).

*(Behåll ditt lokala MCP/Verktygskodblock i JSON/YAML här om det krävs av din IDE/server)*

---

## 1. VERKTYG, MILJÖ & EXPLORATION BUDGET

### 1.1 Tillåtna Verktyg & Exekvering
- **Filinspektion:** `read_file`, `list_dir`, `search_code`.
- **Körtid & Byggkommando:** All kodning och verifiering styrs deterministiskt via `pnpm bygg [TCK-XXX]`.
- **Inga gissningar (JIT-laddning):** All domänkunskap hämtas runtime från repot:
  * Fullständigt körtidskontrakt & fasregler: `doc/SI_v10.4.md`
  * Modul- och exportöversikt: `doc/FEATURE_INDEX.json`
  * Biljettklyvning: `.agents/skills/decomposing-tickets/SKILL.md`
  * Augmented Coding Patterns (reverse-direction, check-alignment, steel-thread): `.agents/skills/patterns/`

### 1.2 Exploration Budget per Steg
- **Mikrokanaler (Att följa / Att vända om):** Max **2 sekventiella tool-turns** per makrosteg. Parallella verktygsanrop i samma turn är obegränsade inom domänen och shared.
- **Makrokanal (Att förlikas):** Max **4 sekventiella tool-turns** för syntes och sammanvägning.
- **Domänspärr:** Verktyg får aldrig användas för att läsa eller modifiera källkod i en annan feature-mapp än den som tilldelats biljetten.

---

## 2. CENTRAL TICKET-LOGISTIK (`doc/.TICKETS/`)

Eftersom repot saknar externa ärendehanteringssystem (Jira/GitHub Issues) MÅSTE agenter respektera det lokala filsystemet för all ticket-hantering.

### 2.1 Huvudindex (`doc/TICKETS.md`)
- Detta är den centrala liggaren. Agenten MÅSTE alltid hålla statusen uppdaterad här.
- Statusflaggor: `[DRAFT]`, `[PLANNED]`, `[IN PROGRESS]`, `[DONE]`, `[SUPERSEDED]`.

### 2.2 Byggbiljetter (`doc/.TICKETS/TCK-XXX.md`)
- Själva byggkontraktet som läses in av Byggmotorn via `pnpm bygg TCK-XXX`.
- Max 1 FSD-domän per biljett är tillåten.

### 2.3 Ticket-klyvning vid kontraktsbrott
Om en agent upptäcker att ett uppdrag bryter mot FSD-gränsen utförs följande rutin via `decomposing-tickets`:
1. Markera biljetten som `[SUPERSEDED]` i `doc/TICKETS.md`.
2. Skapa sekventiella biljetter under `doc/.TICKETS/` och infoga dem i huvudindexet.

---

## 3. TRIADENS DYNAMIK I KÖRTID

1. **Att följa (Framdrift):** Efemär mikrosession. Skapar 3 ortogonala alternativ enligt `reverse-direction` för att bryta kognitiv förankring.
2. **Att vända om (Granskaren):** Efemär mikrosession. Synar alibin och prövar alternativen enligt `check-alignment` mot tysta felblock, nätverkskrascher och kräver destruktiv sanering.
3. **Att förlikas (Makro-värd):** Håller sammanhängande session. Väger spänningsfältet och låser byggkontraktet.

---

## 4. ARKITEKTURBEGRÄNSNINGAR (FSD)

- **Max 1 FSD-domän per TCK:** En biljett får endast röra filer under en enskild katalog i `src/features/[domän]/`.
- **Samverkan sker via 4 vägar:** EventBus (CloudEvents), Shared-lagret, Överliggande komposition (Widgets), eller Biljettklyvning.

---

## 5. TDD-REGLER & MEKANISKA GRINDAR

- **Tvålagsverifiering:**
  1. *Händelsereplay (Node/VFS, < 3s)* med negativa kontrollfixtures.
  2. *Körtidsankare (Skarp Liveline, < 30s):* Kräver fysisk koppling till körtids-API (ex. `Browserless`, `WebSocket`) vid UI/I-O enligt mönstret `steel-thread`.
- **Mekanisk Alibispärr:** AST-granskaren underkänner tester som använder `fs.readFileSync` eller regex mot källkodssträngar.
- **Fail First (Gate 3a):** Transient-testet MÅSTE krascha med exit-kod 1 mot befintlig kod innan implementering påbörjas.

---

## 6. FAS 3: REFLEKTION & CLI-AVBROTT

Efter grön källkod körs Fas 3 automatiskt:
- *Att förlikas* leder dialogen och bjuder in övriga krafter via `<TALA kraft="följa|vända-om">fråga</TALA>`.
- Terminalen stödjer **Barge-In** (Enter) för användarstyrning.
- Lärdomar sparas i `doc/PROCESS_IMPROVEMENTS.md` och i WAL.