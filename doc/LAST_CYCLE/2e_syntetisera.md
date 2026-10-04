# Steg 2e: Syntetisera & Förlika Målkonflikter (TCK-022b)

## 1. Målkonflikter & Förlikning
- **Konflikt 1**: Hur returnerar vi ett omedelbart `NON_BLOCKING` röstsvar till WebSocket-kabeln innan verktygets långsamma I/O eller filpatchning är färdig?
  - **Förlikning**: Bidi WebSocket-protokollet i Gemini 3.8 tillåter asynkrona svar med `behavior: 'NON_BLOCKING'`. `mcpSwarmBridge.ts` returnerar ett omedelbart ack-svar (`{ output: { status: 'PENDING', message: 'Verktygsexekvering påbörjad i bakgrunden.' } }`) så att talsyntesen inte stannar upp. Den egentliga MCP-exekveringen körs asynkront och emitterar `mcp.tool.execution.completed` när den är klar.
- **Konflikt 2**: Hur signalerar vi till FloorController utan att bryta Feature-Sliced Design (FSD)?
  - **Förlikning**: `mcp_bridge` ska INTE importera `FloorController` direkt från `gemini_live_swarm`. I stället publicerar `mcpSwarmBridge.ts` standardiserade CloudEvents 1.0 (`mcp.tool.execution.completed`) på den gemensamma `SwarmEventBus`. Detta bevarar en strikt enkelriktad FSD-arkitektur där `gemini_live_swarm` reaktivt prenumererar på bussen utan cirkulära beroenden.
- **Konflikt 3**: Radgränser i `mcpSwarmBridge.ts` (< 250 rader).
  - **Förlikning**: `mcpSwarmBridge.ts` är för närvarande 138 rader. Med utökad routing, Bidi-deklaration och händelse-emission landar filen på ca 170-190 rader, vilket är väl under AST-taket på 250 rader.

## 2. Slutsats & Mättnad
Alla målkonflikter och FSD-gränser är fullständigt förlikade och syntetiserade.
MÄTTNAD: JA
