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
