# Steg 1b: Kartlägga Beroenden & Aktiva Vektorer (TCK-022b)

## 1. Aktiva Vektorer & Skills
- **active_vectors**: `mcp_bridge`, `bidi_mcp_wiring`, `non_blocking_routing`, `floor_release`, `swarm_event_bus`
- **active_skill**: `gemini-api` (Gemini Live Bidi Function Calling och Asynchronous Non-blocking Tools)

## 2. Berörda Domäner & Filer
- **Domän**: `src/features/mcp_bridge/`
- **Exklusiva källkodsfiler som berörs i Fas 2**:
  - `src/features/mcp_bridge/orchestrator/mcpSwarmBridge.ts`:
    - `getBidiFunctionDeclarations()` för dynamisk verktygsdeklaration (`liveConfig.tools`).
    - `handleIncomingToolCall(call, agentId?)`: Utför asynkron routing till `mcpServer`, genererar blixtsnabbt `NON_BLOCKING` Bidi-svar.
    - CloudEvents 1.0 emission av `mcp.tool.execution.completed` med `agentId`, `toolName`, `status` och `output` till `SwarmEventBus`.
  - `src/__tests__/transient_TCK-022b.test.ts`:
    - Transient testsvit (< 3s) som verifierar:
      * Blixtsnabbt `NON_BLOCKING`-svar vid mockat `toolCall`.
      * Publicering av `mcp.tool.execution.completed` på `SwarmEventBus` vid slutförd bakgrundsexekvering.
      * Dynamisk verktygsdeklarationsmappning till Gemini Live format.
      * AST- och radgränser (< 250 rader).

## 3. FSD- & Arkitekturbegränsningar
- Rör inga filer under `src/features/gemini_live_swarm/` direkt från denna ticket. Kommunikationen sker löst kopplad via `SwarmEventBus`.
- AST-gräns: Max 250 rader per `.ts`-fil.
- Noll mockar i produktionskoden.
