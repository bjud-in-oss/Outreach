# Arkitekturbeslut: Model Context Protocol Bridge (`mcp_bridge`)

Detta dokument samlar alla domänspecifika arkitekturbeslut för MCP-bryggan och verktygsexponering enligt ADR-004 och AGENTS.md v10.0.

---

## ADR-MCP-001: Strikt JSON-RPC 2.0 Protokollvalidering
- **Regel:** Validera varje inkommande MCP-anrop (`tools/list`, `tools/call`, `resources/list`) och utgående svar mot strikta
- **Skäl:** Säkrar modulär integritet och FSD-kontrakt.

## ADR-MCP-002: Modulärt Registreringsmönster för Verktygshandlers
- **Regel:** Implementera ett pluggbart registeringsgränssnitt i `McpServer` där verktygsdefinitioner (`McpToolDefinition`) registreras med sitt JSON-schema och en associerad exekverings-handler.
- **Skäl:** Säkrar modulär integritet och FSD-kontrakt.

## ADR-MCP-003: Djupintegration med Gemini Live Swarm och NON_BLOCKING WebSocket-exekvering
- **Regel:** Skapa `McpSwarmBridge` som integrerar `createUnifiedMcpServer()` med `SwarmEventBus`.; Implementera asynkron verktygsexekvering som returnerar `BidiGenerateContentToolResponse` med `behavior: 'NON_BLOCKING'`.; Publicera CloudEvents 1.0 händelser (`mcp.tool.
- **Skäl:** Säkrar modulär integritet och FSD-kontrakt.

## ADR-MCP-004: MCP Tool Wrapper för Kirurgisk Kodpatchning & Strukturerade System-Nudges
- **Regel:** 
- **Skäl:** Säkrar modulär integritet och FSD-kontrakt.

## ADR-MCP-005: Bidi WebSocket Live MCP Wiring & Event-Driven Floor Release
- **Regel:** Dynamisk Bidi Tools Deklaration**: Implementera `getBidiFunctionDeclarations()` i `McpSwarmBridge` som direkt mappar alla registrerade...; Icke-blockerande Tool Routing**: Implementera `routeToolCallNonBlocking` som omedelbart returnerar ett ack-svar med...
- **Skäl:** Säkrar modulär integritet och FSD-kontrakt.
