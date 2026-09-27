# Arkitekturbeslut: Model Context Protocol Bridge (`mcp_bridge`)

Detta dokument samlar alla domänspecifika arkitekturbeslut för MCP-bryggan och verktygsexponering enligt ADR-004 och AGENTS.md v10.0.

---

## ADR-MCP-001: Strikt JSON-RPC 2.0 Protokollvalidering
- **Datum**: 2026-09-23
- **Status**: Beslutat & Implementerat
- **Kontext**: Model Context Protocol förutsätter standardiserad kommunikation via JSON-RPC 2.0. Felaktigt formaterade meddelanden kan krascha anropande agenter eller leda till tysta fel.
- **Beslut**: Validera varje inkommande MCP-anrop (`tools/list`, `tools/call`, `resources/list`) och utgående svar mot strikta Zod-scheman (`mcpRequestSchema`, `mcpResponseSchema`). Alla fel returneras med officiella JSON-RPC felkoder (t.ex. -32600 Invalid Request, -32601 Method not found, -32602 Invalid params).
- **Konsekvens**: 100% protokollkompatibilitet med alla externa MCP-kompatibla verktyg och klienter.

---

## ADR-MCP-002: Modulärt Registreringsmönster för Verktygshandlers
- **Datum**: 2026-09-23
- **Status**: Beslutat & Implementerat
- **Kontext**: När nya funktioner tillkommer i Outreach Samordningsmotor (t.ex. Drive-operationer, WAL-frågor eller Svärmstyrning) måste de kunna exponeras som MCP-verktyg utan att kärnservern sväller.
- **Beslut**: Implementera ett pluggbart registeringsgränssnitt i `McpServer` där verktygsdefinitioner (`McpToolDefinition`) registreras med sitt JSON-schema och en associerad exekverings-handler.
- **Konsekvens**: Hög modularitet, ren separation mellan protokollhantering och domänspecifik affärslogik.

---

## ADR-MCP-003: Djupintegration med Gemini Live Swarm och NON_BLOCKING WebSocket-exekvering
- **Datum**: 2026-09-27
- **Status**: Beslutat & Implementerat (TCK-003)
- **Kontext**: Autonom fleragentorkestrering kräver att agenter kan anropa MCP-verktyg (Google Drive, WAL-logg, Kvalitetsgranskning) utan att blockera Gemini Live WebSocket-kabeln eller kräva manuell användarinteraktion mellan stegen.
- **Beslut**:
  1. Skapa `McpSwarmBridge` som integrerar `createUnifiedMcpServer()` med `SwarmEventBus`.
  2. Implementera asynkron verktygsexekvering som returnerar `BidiGenerateContentToolResponse` med `behavior: 'NON_BLOCKING'`.
  3. Publicera CloudEvents 1.0 händelser (`mcp.tool.execution.started`, `mcp.tool.execution.completed`) för full telemetrisk spårbarhet.
  4. Injicera bryggan i `SwarmOrchestrator` så att enheterna *Att följa Guds son* och *Att vända om till Gud* autonomt kan persistera utkast och granska tonfall.
- **Konsekvens**: Oavbruten autonom verktygsexekvering över WebSocket-kabeln med full händelsespårbarhet och noll UI-blockering.
