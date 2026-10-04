# Steg 2a: Avgränsa & Isolera (TCK-022b)

## 1. Strikt Domän- och FSD-avgränsning
- **Modul**: `src/features/mcp_bridge/`
- **Fokus**:
  - `mcpSwarmBridge.ts`: Implementera Bidi `toolCall`-routing, `getBidiFunctionDeclarations()` och CloudEvent-emission (`mcp.tool.execution.completed`).
- **Förbud**:
  - Rör INTE filer under `src/features/gemini_live_swarm/` direkt.
  - Skapa inga mockar i produktionskoden (`src/`).
  - Håll alla filer strikt under 250 rader.
  - Rör ingen källkod under `src/` förrän i Fas 2 (efter godkänd Token Gate).
