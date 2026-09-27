# 3c Fil-operativ Källkodsspecifikation (TCK-003)

## 1. Översikt över Förändringskedjan (Fas 2)

Följande filer är specificerade för källkodsändring under Fas 2 så snart godkännandekoden (`TCK-003-MCP-SWARM-BRIDGE-TOKEN`) bekräftats via `pnpm genomfor`:

---

### Fil 1: `src/features/mcp_bridge/contracts/mcpSchema.ts` (MODIFIERING)
- **Förändringar**:
  1. Definiera och exportera Zod-scheman och TypeScript-typer för:
     - `BidiFunctionCallSchema`: `{ id: z.string(), name: z.string(), args: z.record(z.any()) }`
     - `BidiFunctionResponseSchema`: `{ id: z.string(), name: z.string(), response: z.object({ output: z.any() }) }`
     - `BidiGenerateContentToolResponseSchema`: `{ functionResponses: z.array(BidiFunctionResponseSchema), behavior: z.literal('NON_BLOCKING') }`
  2. Exportera typerna `BidiFunctionCall`, `BidiFunctionResponse`, `BidiGenerateContentToolResponse`.

---

### Fil 2: `src/features/mcp_bridge/server/mcpServer.ts` (MODIFIERING)
- **Förändringar**:
  1. Implementera fabriken `createUnifiedMcpServer(driveClient?: GoogleDriveClient, walEngine?: WalEngine): McpServer`.
  2. Registrera verktyg från samtliga källor:
     - Drive: `drive_save_draft`, `drive_list_templates`, `drive_create_file`
     - WAL: `wal_get_stats`, `wal_query_recent`
     - Granskning: `outreach_evaluate_tone`
  3. Säkerställ strikt JSON-RPC 2.0 Fail-Fast felhantering.

---

### Fil 3: `src/features/mcp_bridge/orchestrator/mcpSwarmBridge.ts` (NY FIL I FAS 2)
- **Förändringar**:
  1. Skapa klassen `McpSwarmBridge` med beroenden till `McpServer` och `SwarmEventBus`.
  2. Implementera metoden `executeTool(toolName, toolArgs, toolCallId?)`.
  3. Publicera CloudEvents 1.0 händelser:
     - `mcp.tool.execution.started`
     - `mcp.tool.execution.completed` / `mcp.tool.execution.failed`
  4. Skapa och returnera `BidiGenerateContentToolResponse` med `behavior: 'NON_BLOCKING'`.

---

### Fil 4: `src/features/mcp_bridge/index.ts` (MODIFIERING)
- **Förändringar**:
  1. Exportera `McpSwarmBridge` och relaterade typer.
  2. Exportera `createUnifiedMcpServer`.
  3. Exportera Bidi WebSocket-scheman och typer.

---

### Fil 5: `src/features/gemini_live_swarm/coordinator/swarmOrchestrator.ts` (MODIFIERING)
- **Förändringar**:
  1. Injicera valfri instans av `McpSwarmBridge` i `SwarmOrchestrator`.
  2. Tillåt verktygsexekvering under kampanjsteg (t.ex. anropa `drive_save_draft` när `ATT_FOLJA` skapar ett utkast, och anropa `outreach_evaluate_tone` när `ATT_VANDA_OM` granskar).
  3. Spara genererade verktygssvar i delad kontext och bifoga CloudEvents.

---

### Fil 6: `src/features/mcp_bridge/doc/DECISIONS.md` (MODIFIERING)
- **Förändringar**:
  1. Dokumentera **ADR-MCP-003: Djupintegration med Gemini Live Swarm och NON_BLOCKING WebSocket-exekvering**.

---

### Fil 7: `src/__tests__/transient_TCK-003.test.ts` (NY TRANSIENT TESTFIL I FAS 2)
- **Testomfång** (< 3s i minnet):
  1. Validera att `createUnifiedMcpServer()` registrerar samtliga 6 verktyg från Drive och WAL.
  2. Validera att `McpSwarmBridge.executeTool()` exekverar verktyget och returnerar `BidiGenerateContentToolResponse` med `behavior: 'NON_BLOCKING'`.
  3. Validera att `SwarmEventBus` tar emot händelserna `mcp.tool.execution.started` och `mcp.tool.execution.completed`.
  4. Validera att `SwarmOrchestrator` kan köra kampanjflödet med automatisk verktygsexekvering.

---

### Fil 8: `doc/TICKETS.md` & `doc/TICKETS/TCK-003.md` (UPPDATERING I FAS 2)
- Uppdatera status till `[VERIFIERAD]` när Fas 2 slutförts och testerna passerat.
