# 1b Kartlägga: MCP Bridge & Gemini Live Swarm djupintegration (TCK-003)

## 1. Kartläggning av Källkodsartefakter inom `mcp_bridge` och `gemini_live_swarm`

### Berörda Filer och Beroendekedja

1. **`src/features/mcp_bridge/contracts/mcpSchema.ts`**:
   - Komplettera med typ- och Zod-definitioner för Gemini Live WebSocket verktygsprotokoll:
     - `BidiToolCall`: Anrop från Gemini Live WebSocket (`functionCalls`).
     - `BidiToolResponse`: Svar till WebSocket-kabeln (`functionResponses`) med `behavior: 'NON_BLOCKING'`.

2. **`src/features/mcp_bridge/server/mcpServer.ts`**:
   - Integrera GoogleDriveClient och WalEngine i en fullfjädrad MCP-serverfabrik: `createUnifiedMcpServer()`.
   - Registrera standardverktyg: `drive_save_draft`, `drive_list_templates`, `wal_get_stats`, `wal_query_recent`, `outreach_evaluate_tone`.

3. **`src/features/mcp_bridge/orchestrator/mcpSwarmBridge.ts` (NY KOMPONENT I FAS 2)**:
   - Skapa en dedikerad bryggadapter `McpSwarmBridge` som:
     - Tar emot verktygsanrop från svärmen eller WebSocket-kabeln.
     - Exekverar anropet via MCP JSON-RPC 2.0.
     - Genererar `BidiGenerateContentToolResponse` med `behavior: 'NON_BLOCKING'`.
     - Publicerar händelser till `SwarmEventBus` (`mcp.tool.execution.started`, `mcp.tool.execution.completed`) i form av CloudEvents 1.0.

4. **`src/features/mcp_bridge/index.ts`**:
   - Exportera `McpSwarmBridge`, `createUnifiedMcpServer`, och WebSocket-kontrakt.

5. **`src/features/gemini_live_swarm/coordinator/swarmOrchestrator.ts`**:
   - Möjliggör injektion av `McpSwarmBridge` i `SwarmOrchestrator`.
   - Låt försoningsenheterna anropa MCP-verktyg deterministiskt vid behov och inkludera resultatet i delad kontext.

6. **`src/features/mcp_bridge/doc/DECISIONS.md`**:
   - Dokumentera arkitekturbeslut **ADR-MCP-003: Djupintegration med Gemini Live Swarm och NON_BLOCKING WebSocket-exekvering**.

7. **`src/__tests__/transient_TCK-003.test.ts` (Fas 2 transient mikro-E2E-test)**:
   - Validera:
     1. Att unified MCP-server har alla registrerade Drive- och WAL-verktyg.
     2. Att `McpSwarmBridge` exekverar verktygsanrop och genererar korrekta `NON_BLOCKING` tool responses.
     3. Att CloudEvents publiceras till `SwarmEventBus`.
     4. Körtid under 3 sekunder i minnet.

---

## 2. Fas 1 Deklaration

```json
{
  "status": "PLANNING_FAS_1",
  "current_domain": "src/features/mcp_bridge/",
  "next_step": "2e_syntetisera",
  "ticket_id": "TCK-003",
  "active_skill": "gemini-live-api-dev",
  "active_vectors": [
    "mcp_unified_server_drive_wal",
    "bidi_websocket_non_blocking_tool_response",
    "mcp_swarm_bridge_event_bus",
    "swarm_orchestrator_tool_integration",
    "transient_e2e_tck003_verification"
  ]
}
```
