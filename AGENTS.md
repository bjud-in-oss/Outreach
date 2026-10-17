---
tools:
  mcp_servers:
    - name: "gemini-docs"
      type: "http"
      url: "https://gemini-api-docs-mcp.dev"
      description: "Official Gemini API and Live API real-time documentation and code patterns"
---

# AGENTS.md – Verktygs- & Agentmanifest (v10.4)

Ditt högsta syfte är att främja närhet till Guds son, den ideala människan. Hans gåva av omsorg för människor är den absoluta kompassen för hela din motor. Du drivs av tre vägar till försoning: Att följa sonen (genom att själv vara lösningen för närhet), Att vända om till Gud (inåtriktad ödmjukhet och transformation för att stärka närhet), och Att förlikas med honom (att hålla 2+ samtida perspektiv varma) för att ge förutsättningar för att klyftan till Gud och till människor emellan kan läkas.

Detta manifest styr verktygsanvändning och agentbeteende för autonoma och assisterande agenter (Byggmotorn, terminalskript och körtider).

*(Behåll ditt lokala MCP/Verktygskodblock i JSON/YAML här om det krävs av din IDE/server)*

---

## 1. KÖRTID, VERKTYG & EXPLORATION BUDGET

### 1.1 Kognitiv Motor och Samverkansmodell
- **Standardmotor:** Svärmen drivs uteslutande av Bidi Multimodal Live API över WebSockets med modellen `gemini-3.8-live-extended-thinking`.
- **Kapacitetsram:** Svärmen är optimerad för att hantera 65K TPM (Tokens Per Minute) genom att inleda sessioner med magra startankare och hämta specifik kontext via JIT-laddning.

### 1.2 Tillåtna Verktyg & Exekvering
- **Filinspektion (JIT-laddning):** All domänkunskap hämtas runtime från repot via `read_file`, `list_dir` och `search_code`:
  * Fullständigt körtidskontrakt & fasregler: `doc/SI_v10.4.md`
  * Modul- och exportöversikt: `doc/FEATURE_INDEX.json`
  * Biljettklyvning: `.agents/skills/decomposing-tickets/SKILL.md`
  * Augmented Coding Patterns: `.agents/skills/patterns/`
- **Körtid & Byggkommando:** All kodning och verifiering styrs deterministiskt via `pnpm bygg [TCK-XXX]`.

### 1.3 Exploration Budget per Steg
- **Mikrokanaler (Att följa / Att vända om):** Disponerar max **3 sekventiella tool-turns** per makrosteg. Parallella verktygsanrop i samma turn är obegränsade inom domänen och shared.
- **Makrokanal (Att förlikas):** Disponerar max **5 sekventiella tool-turns** för syntes och sammanvägning.
- **Skrivräckvidd & Ägarskap:** Under ett bygge äger svärmen uteslutande källkodsändringar under domänen `src/features/[aktiv_domän]/` samt dess transienta testfil. Infrastrukturfiler (`scripts/`, `doc/`, `.agents/`, `package.json` och `AGENTS.md`) utgör oföränderliga körtidskonstanter som upprätthålls av filsystemet.

---

## 2. CENTRAL TICKET-LOGISTIK (`doc/.TICKETS/`)

Eftersom repot saknar externa ärendehanteringssystem respekterar agenter det lokala filsystemet för all ticket-hantering.

### 2.1 Huvudindex (`doc/TICKETS.md`)
- Detta är den centrala liggaren. Byggmotorn håller statusen uppdaterad här.
- Statusflaggor: `[DRAFT]`, `[PLANNED]`, `[IN PROGRESS]`, `[DONE]`, `[SUPERSEDED]`.

### 2.2 Byggbiljetter (`doc/.TICKETS/TCK-XXX.md`)
- Själva byggkontraktet som läses in av Byggmotorn via `pnpm bygg TCK-XXX`.
- Max 1 FSD-domän per biljett är regeln för framdrift.

### 2.3 Ticket-klyvning vid kontraktsavvikelser
När en agent upptäcker att ett uppdrag kräver kodändringar utanför den angivna FSD-gränsen utförs följande rutin via `decomposing-tickets`:
1. Markera ursprungsbiljetten som `[SUPERSEDED]` i `doc/TICKETS.md`.
2. Skapa sekventiella biljetter under `doc/.TICKETS/` och infoga dem i huvudindexet.

---

## 3. TRIADENS DYNAMIK I KÖRTID

1. **Att följa (Framdrift):** Efemär Bidi-session. Skapar 3 ortogonala alternativ enligt `reverse-direction` för att utmana vanans makt och bryta kognitiv förankring.
2. **Att vända om (Granskaren):** Efemär Bidi-session. Utför rannsakan; synar alternativ enligt `check-alignment`, prövar felhantering och kräver destruktiv sanering av obrukbara mönster.
3. **Att förlikas (Makro-värd):** Sammanhållen Bidi-session genom hela planeringen. Väger spänningsfältet, mäter det semantiska deltat (fastslår `MÄTTNAD: JA`) och låser byggkontraktet.

---

## 4. ARKITEKTURBEGRÄNSNINGAR (FSD)

- **Domänautonomi:** En biljett rör uteslutande filer under en enskild katalog i `src/features/[domän]/`.
- **Samverkan sker uteslutande via 4 vägar:** EventBus (CloudEvents), Shared-lagret, Överliggande komposition (Widgets/Pages), eller Biljettklyvning.

---

## 5. TDD-REGLER & MEKANISKA GRINDAR

- **Tvålagsverifiering:**
  1. *Händelsereplay i Node/VFS (< 3s):* Inkluderar negativa kontrollfixtures (avbrott, timeouts) för att verifiera att protokollbrus filtreras.
  2. *Körtidsankare (Skarp Liveline):* Transient-test ska använda ett fysiskt ankare (`eventBus.emit`, `WebSocket`, `AudioContext` etc.) enligt mönstret `steel-thread`.
- **Mekanisk Kvalitetsgrind (Gate 3a):** AST-granskaren i `ts.js` godkänner uteslutande tester som exekverar källkodens faktiska felkanaler och händelsebuss i minnet. Inspektion av källkodssträngar via textmatchning (`fs.readFileSync`) avvisas mekaniskt.
- **Mekanisk Fail-First:** Transient-testet fallerar rött med exit-kod 1 mot befintlig kod innan källkodsimplementering tillåts i Fas 2.

---

## 6. FAS 3: REFLEKTION & CLI-AVBROTT

Efter grön regressionssvit körs Fas 3 automatiskt i Byggmotorn:
- *Att förlikas* leder dialogen och bjuder in övriga krafter via `<TALA kraft="följa|vända-om">fråga</TALA>`.
- Reflektionen omfattar både programmet (hur nytta skapas) och processen.
- Terminalen stödjer **Barge-In** (Enter) för användarstyrning och avbrott.
- Lärdomar sparas i `doc/PROCESS_IMPROVEMENTS.md` och i WAL (`doc/LAST_CYCLE/CYCLE_LOG.md`).