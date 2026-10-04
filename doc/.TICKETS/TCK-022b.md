# Building Ticket TCK-022b: Bidi WebSocket Live MCP Wiring & Event-Driven Floor Release

## Mål & Kontext
Koppla ihop Svärmens Bidi WebSocket-kabel (`liveConfig.tools`) med `mcpServer` i `mcpSwarmBridge.ts`. Fånga inkommande `toolCall`-händelser, routa dem asynkront med omedelbara `NON_BLOCKING` röstsvar samt publicera `mcp.tool.execution.completed` på `SwarmEventBus` så att DSP-mixern och FloorController automatiskt frigör röstgolvet när bakgrundsarbete har slutförts.

## Domän & Avgränsning
- Domän: src/features/mcp_bridge/
- Exklusiva filer:
  - src/features/mcp_bridge/orchestrator/mcpSwarmBridge.ts
  - src/__tests__/transient_TCK-022b.test.ts (ny)

## Detaljerade Funktionella Krav
1. **Verktygsdeklaration (liveConfig):**
   - Hämta dynamiskt `mcpServer.listTools()` och mappa in dem i Bidi-kabelns konfiguration vid start.

2. **Icke-blockerande Tool Routing (`mcpSwarmBridge.ts`):**
   - Lyssna efter typen `toolCall` från Svärmens WebSocket-sessioner.
   - Routa anropet direkt till `mcpServer.callTool()`.
   - **NON_BLOCKING:** Returnera omedelbart ett `BidiGenerateContentToolResponse` med `state: 'NON_BLOCKING'` till Svärmen, så att den auditiva försoningsdialogen kan fortsätta i högtalarna medan källkoden (t.ex. `apply_code_patch`) uppdateras i bakgrunden.

3. **Event-Driven Floor Release Signalering:**
   - När ett asynkront verktygsanrop slutförs (t.ex. när `driveStore.applyPatch` returnerar status `COMMITTED` eller `ERROR`), publicera händelsen `mcp.tool.execution.completed` på `SwarmEventBus`.
   - Inkludera `agentId`, `toolName` och `status` i event-payloaden så att `FloorController` kan bekräfta att agenten "tar ner handen" och frigör röstgolvet för nästa kraft.

## Operativt Delta (Bevara vs Sanera)
- **Bevara:** FSD-gränsen. Rör inga Live Swarm-filer direkt härifrån, utan exportera en ren händelselyssnare/router och CloudEvents-emittent.
- **Sanera/Ersätt:** Ersätt ev. synkron väntelogik i bryggan med eventdriven `NON_BLOCKING`-routing.

## Destruktiva Handlingssteg
- Bygg om `mcpSwarmBridge.ts` för att hantera Bidi `toolCall`-routing och CloudEvent-emission vid slutförd verktygsexekvering.

## Testkriterier
- pnpm verify passerar utan fel.
- Transient test src/__tests__/transient_TCK-022b.test.ts verifierar:
  * Blixtsnabbt `NON_BLOCKING`-svar vid mockat `toolCall`.
  * Publicering av `mcp.tool.execution.completed` på `SwarmEventBus` när bakgrundsexekveringen slutförts.