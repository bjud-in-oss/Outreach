# Building Ticket TCK-022b: Bidi WebSocket Live MCP Wiring

## Mål & Kontext
Koppla ihop Svärmens Bidi WebSocket-kabel (`liveConfig.tools`) med `mcpServer`. Fånga inkommande `toolCall`-händelser och dirigera dem genom `mcpSwarmBridge.ts` med omedelbara `NON_BLOCKING` röstsvar så ljudet aldrig fryser vid verktygsexekvering.

## Domän & Avgränsning
- Domän: src/features/mcp_bridge/
- Exklusiva filer:
  - src/features/mcp_bridge/orchestrator/mcpSwarmBridge.ts
  - src/__tests__/transient_TCK-022b.test.ts (ny)

## Detaljerade Funktionella Krav
1. **Verktygsdeklaration (liveConfig):**
   - Hämta dynamiskt `mcpServer.listTools()` och mappa in dem i Bidi-kabelns konfiguration vid start.
2. **Icke-blockerande Routing (`mcpSwarmBridge.ts`):**
   - Lyssna efter typen `toolCall` från Svärmen.
   - Routa direkt till `mcpServer.callTool()`.
   - **Kritiskt:** Returnera omedelbart ett `BidiGenerateContentToolResponse` med `state: 'NON_BLOCKING'` till Svärmen, så att den auditiva försoningsdialogen kan fortsätta medan koden (t.ex. `apply_code_patch`) körs i bakgrunden (driveStore).

## Operativt Delta (Bevara vs Sanera)
- **Bevara:** FSD-gränsen. Rör inga Live Swarm-filer direkt härifrån, utan exportera en ren händelselyssnare/router.

## Destruktiva Handlingssteg
- Modifiera/skapa `mcpSwarmBridge.ts` för att enbart hantera Tool Call-rutningen.

## Testkriterier
- pnpm verify passerar utan fel.
- Transient test src/__tests__/transient_TCK-022b.test.ts verifierar att ett mockat `toolCall` genererar ett blixtsnabbt `NON_BLOCKING`-svar och asynkront anropar `mcpServer`.