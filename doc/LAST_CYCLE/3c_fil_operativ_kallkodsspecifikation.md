# Steg 3c: Filoperativ Källkodsspecifikation (TCK-022b)

## 1. GROW Specifikation
- **Goal (Mål)**: Integrera Svärmens Bidi WebSocket-kabel (`liveConfig.tools`) med `mcpServer` i `mcpSwarmBridge.ts`. Tillhandahålla dynamiska Bidi-funktionsdeklarationer, omedelbar `NON_BLOCKING` röstrespons vid `toolCall` och publicering av `mcp.tool.execution.completed` med `agentId`, `toolName` och `status` via `SwarmEventBus` för automatisk röstgolvsfrigörelse.
- **Reality (Nuläge)**: `mcpSwarmBridge.ts` har en synkron `executeTool`-metod som väntar på MCP JSON-RPC innan den skapar Bidi-svaret. Det saknas dynamisk export av `functionDeclarations` för Bidi `liveConfig.tools` samt specifik händelse-signalering för `agentId` vid golvfrigörelse.
- **Options (Alternativ)**: Synkrona blockerande svar vs asynkron `NON_BLOCKING`-routing med CloudEvents 1.0. Vi väljer omedelbara `NON_BLOCKING`-svar för att garantera att talströmmen aldrig klickar eller pausar under verktygskörning.
- **Will (Plan & Åtagande)**: Utöka `mcpSwarmBridge.ts` med `getBidiFunctionDeclarations`, `routeToolCallNonBlocking`, och `mcp.tool.execution.completed`-emission, samt etablera en transient testsvit `src/__tests__/transient_TCK-022b.test.ts`.

## 2. Operativt Delta (Bevara vs Sanera)
- **Bevara**:
  - Existerande `executeTool`-metod för direkt anrop.
  - Zod-scheman i `src/features/mcp_bridge/contracts/mcpSchema.ts`.
  - Feature-Sliced Design: Ingen direktkoppling till `gemini_live_swarm` i importledet.
- **Sanera / Ersätta**:
  - Ersätt synkron låsning av röstkabeln vid verktygsanrop med asynkron `NON_BLOCKING`-routing.

## 3. Zod- och Typkontrakt
```typescript
import { z } from 'zod';

export const ToolExecutionCompletedDataSchema = z.object({
  toolCallId: z.string(),
  agentId: z.string().default('unknown'),
  toolName: z.string(),
  status: z.enum(['COMMITTED', 'ERROR']),
  success: z.boolean(),
  output: z.unknown(),
  timestamp: z.string(),
});
export type ToolExecutionCompletedData = z.infer<typeof ToolExecutionCompletedDataSchema>;
```

## 4. Destruktiva Handlingssteg
- Bygga ut `src/features/mcp_bridge/orchestrator/mcpSwarmBridge.ts` med asynkron `NON_BLOCKING` tool-routing och event-driven floor release.
- Skapa `src/__tests__/transient_TCK-022b.test.ts`.
