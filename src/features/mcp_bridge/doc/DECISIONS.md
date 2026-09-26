# Domänbeslut: Model Context Protocol (MCP) Bridge

Detta dokument beskriver arkitekturbeslut specifika för domänen `mcp_bridge`.

---

## MCP-ADR-001: JSON-RPC 2.0 Standard och Fail-Fast Verktygsexekvering
- **Datum**: 2026-09-23
- **Status**: Beslutat & Implementerat
- **Kontext**: Externa agenter och AI-modeller behöver interagera med samordningsmotorn via ett öppet protokoll utan proprietära beroenden.
- **Beslut**:
  - Implementera Model Context Protocol (MCP) specifikationen över strikt JSON-RPC 2.0.
  - Exponera metoderna `tools/list` och `tools/call`.
  - Returnera standardiserade JSON-RPC felkoder (t.ex. `-32601 Method not found`, `-32602 Invalid params`).
- **Konsekvens**: Universell interoperabilitet med Claude Desktop, Cursor, Gemini Live och andra MCP-kompatibla klienter.
