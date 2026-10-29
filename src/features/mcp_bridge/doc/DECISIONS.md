# Arkitekturbeslut: Model Context Protocol Bridge (`mcp_bridge`)

Detta dokument samlar alla domänspecifika arkitekturbeslut för MCP-bryggan och verktygsexponering enligt ADR-004 och AGENTS.md v10.0.

---


## ADR-MCP-001: Strikt JSON-RPC 2.0 Protokollvalidering
- **Regel:** Validera varje inkommande MCP-anrop (`tools/list`, `tools/call`, `resources/list`) och utgående svar mot strikta Zod-scheman (`mcpRequestSchema`, `mcpResponseSchema`). Alla fel ret
- **Skäl:** 100% protokollkompatibilitet med alla externa MCP-kompatibla verktyg och klienter.

## ADR-MCP-002: Modulärt Registreringsmönster för Verktygshandlers
- **Regel:** Implementera ett pluggbart registeringsgränssnitt i `McpServer` där verktygsdefinitioner (`McpToolDefinition`) registreras med sitt JSON-schema och en associerad exekverings-handle
- **Skäl:** Hög modularitet, ren separation mellan protokollhantering och domänspecifik affärslogik.

## ADR-MCP-003: Djupintegration med Gemini Live Swarm och NON_BLOCKING WebSocket-exekvering
- **Regel:** - **Datum**: 2026-09-27 - **Status**: Beslutat & Implementerat (TCK-003)
- **Skäl:** Oavbruten autonom verktygsexekvering över WebSocket-kabeln med full händelsespårbarhet och noll UI-blockering.

## ADR-MCP-004: MCP Tool Wrapper för Kirurgisk Kodpatchning & Strukturerade System-Nudges
- **Regel:** - **Datum**: 2026-10-04 - **Status**: Beslutat & Implementerat (TCK-021b)
- **Skäl:** Robust och självläkande kodpatchning via MCP utan risk för sessionstapp eller kraschade verktygsanrop.

## ADR-MCP-005: Bidi WebSocket Live MCP Wiring & Event-Driven Floor Release
- **Regel:** - **Datum**: 2026-10-04 - **Status**: Beslutat & Implementerat (TCK-022b)
- **Skäl:** Blixtsnabb respons (< 50 ms) för röstkabeln, noll ljudfrysningar vid filpatchning och deterministisk händelsebaserad rös
