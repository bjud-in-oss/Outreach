# Arkitekturbeslut: Model Context Protocol Bridge (`mcp_bridge`)

Detta dokument samlar alla domänspecifika arkitekturbeslut för MCP-bryggan och verktygsexponering enligt ADR-004 och AGENTS.md v10.0.

---

## ADR-MCP-001: Strikt JSON-RPC 2.0 Protokollvalidering
- **Regel:** Validera varje inkommande MCP-anrop (`tools/list`, `tools/call`, `resources/list`) och utgående svar mot strikta Zod-scheman (`mcpRequestSchema`, `mcpResponseSchema`). Alla fel returneras med officiella JSON-RPC felkoder (t.ex. -32600 Invalid Request,
- **Skäl:** 100% protokollkompatibilitet med alla externa MCP-kompatibla verktyg och klienter.

## ADR-MCP-002: Modulärt Registreringsmönster för Verktygshandlers
- **Regel:** Implementera ett pluggbart registeringsgränssnitt i `McpServer` där verktygsdefinitioner (`McpToolDefinition`) registreras med sitt JSON-schema och en associerad exekverings-handler.
- **Skäl:** Hög modularitet, ren separation mellan protokollhantering och domänspecifik affärslogik.

## ADR-MCP-003: Djupintegration med Gemini Live Swarm och NON_BLOCKING WebSocket-exekvering
- **Regel:** 1. Skapa `McpSwarmBridge` som integrerar `createUnifiedMcpServer()` med `SwarmEventBus`.; Implementera asynkron verktygsexekvering som returnerar `BidiGenerateContentToolResponse` med `behavior: 'NON_BLOCKING'`.; Publicera CloudEvents 1.0 händelser (`mcp.tool.
- **Skäl:** Oavbruten autonom verktygsexekvering över WebSocket-kabeln med full händelsespårbarhet och noll UI-blockering.

## ADR-MCP-004: MCP Tool Wrapper för Kirurgisk Kodpatchning & Strukturerade System-Nudges
- **Regel:** 1. **Zod-schema med Prompt-Beskrivning**: `ApplyCodePatchSchema` deklarerar `searchBlock` med explicit prompt-instruktion som vägleder...; **Transaktionell WAL-spårbarhet**: Innan VFS-patchning loggas `code.patch.applied` som `PENDING` i `WalEngine`,;
- **Skäl:** Robust och självläkande kodpatchning via MCP utan risk för sessionstapp eller kraschade verktygsanrop.

## ADR-MCP-005: Bidi WebSocket Live MCP Wiring & Event-Driven Floor Release
- **Regel:** 1. **Dynamisk Bidi Tools Deklaration**: Implementera `getBidiFunctionDeclarations()` i `McpSwarmBridge` som direkt mappar alla registrerade...; **Icke-blockerande Tool Routing**: Implementera `routeToolCallNonBlocking` som omedelbart returnerar ett ack-svar...
- **Skäl:** Blixtsnabb respons (< 50 ms) för röstkabeln, noll ljudfrysningar vid filpatchning och deterministisk händelsebaserad röstgolvsfrigörelse.
