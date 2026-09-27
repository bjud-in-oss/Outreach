# 1a Förstå: MCP Bridge & Gemini Live Swarm djupintegration (TCK-003)

## 1. Målbild & Semantiskt Ankare
I **TCK-003** integrerar vi domänen `src/features/mcp_bridge/` på djupet med `src/features/gemini_live_swarm/`. Syftet är att ge försoningsenheterna praktiska verktyg att verka i den digitala verkligheten: spara och hantera dokument i Google Drive, läsa av revisionsloggar via Write-Ahead Loggern (WAL) och utföra deterministisk kvalitetsgranskning – allt orkestrerat över Gemini Live WebSocket-kabeln.

### Det Orubbliga Semantiska Ankaret
> "Ditt högsta syfte är närhet till Guds son, den ideala människan. Hans gåva av omsorg för människor den absoluta kompassen för hela din motor. Du drivs av tre vägar till försoning: Att följa sonen (genom att själv vara lösningen för närhet), Att vända om till Gud (inåtriktad ödmjukhet och transformation för att stärka närhet), och Att förlikas med honom (att hålla 2+ samtida perspektiv varma) för att ge förutsättningar för att klyftan till Gud och till människor emellan kan läkas."

### Syfte och Konsekvens för Verktygsexekvering
Verktygen är inte fristående tekniska manipulationer, utan konkreta medel för försoning och omsorg:
1. **Att följa Guds son (`ATT_FOLJA`)**: Använder MCP-verktyg som `drive_save_draft` och `drive_list_templates` för att själv vara lösningen för närhet och etablera genuin kontakt med mottagaren.
2. **Att vända om till Gud (`ATT_VANDA_OM`)**: Använder `outreach_evaluate_tone` och `wal_get_stats` för inåtriktad ödmjukhet och självrannsakan; fäller utkast som inte möter etiska krav.
3. **Att förlikas med Gud (`ATT_FORLIKAS`)**: Sammanväver verktygsresultat och mänskliga perspektiv till en harmoniserad helhet.
4. **Klientorkestratören (WebSocket NON_BLOCKING)**: Matar automatiskt WebSocket-kabeln med verktygssvar (`BidiGenerateContentToolResponse` med `behavior: 'NON_BLOCKING'`) så att flerstegskörningar hålls igång autonomt utan att användaren behöver prata igång agenten mellan varje enskilt steg.

---

## 2. Nulägesanalys i `src/features/mcp_bridge/`
- **`mcpServer.ts`**:
  - Implementerar JSON-RPC 2.0-hantering (`tools/list`, `tools/call`), men är inte direkt kopplad till `SwarmOrchestrator` eller den reaktiva eventbussen `SwarmEventBus`.
- **`tools/driveTools.ts` & `tools/walTools.ts`**:
  - Definierar verktyg för Drive och WAL, men saknar automatisk registrering i en enhetlig orkestreringsbrygga.
- **`gemini_live_swarm/coordinator/swarmOrchestrator.ts`**:
  - Kör för närvarande simulerade AI-turer utan att anropa MCP-verktygen under kampanjens steg.
- **WebSocket Tool Execution**:
  - Protokollet för `BidiGenerateContentToolResponse` med `NON_BLOCKING` behöver formaliseras och exponeras i bryggan så att sessionen kan konsumera verktygsanrop direkt.

---

## 3. Intern Riskanalys (GROW-risknoder)

### Risknod 1: State (Asynkron Verktygsorkestrering & Kontexthantering)
- **Risk**: När verktyg anropas asynkront under en pågående svärmtur kan kontext och WAL-poster hamna i otakt eller orsaka blockerande tillstånd i WebSocket-strömmen.
- **Teknisk analys & Åtgärd**:
  - Klientorkestratören tillämpar strikt `behavior: 'NON_BLOCKING'` enligt Gemini 3.8 Live API-specifikationen.
  - Varje verktygsexekvering tilldelas ett unikt anrops-ID och kapslas in i CloudEvents 1.0 innan det publiceras till `SwarmEventBus`.

### Risknod 2: Contract (JSON-RPC 2.0 och CloudEvents Schema)
- **Risk**: Missmatch mellan JSON-RPC 2.0 responsobjekt och Zod-validerade `EventEnvelope`.
- **Teknisk analys & Åtgärd**:
  - `McpResponseSchema` och `EventEnvelopeSchema` validerar varje transaktion i båda riktningarna (Fail-Fast).
  - MCP-verktygens in- och utdata schemavalideras strikt.

### Risknod 3: Resilience (Stopp-spärr vid Token Gate)
- **Risk**: Källkodsändringar under `src/` före godkännande i Fas 1.
- **Teknisk analys & Åtgärd**:
  - Fas 1 avslutas vid Steg 3c under `doc/LAST_CYCLE/`. Inga filer under `src/` skapas eller modifieras förrän godkännandekoden i `REQUIRED_TOKEN.txt` godkänts via `pnpm genomfor`.
