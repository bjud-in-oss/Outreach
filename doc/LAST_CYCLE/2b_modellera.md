# Steg 2b: Modellera Bidi MCP Routing & Floor Release (TCK-022b)

## 1. Bidi Function Declarations Modell
```typescript
export interface BidiFunctionDeclaration {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface BidiToolsConfig {
  functionDeclarations: BidiFunctionDeclaration[];
}
```

## 2. Inkommande Tool Call & Asynkront Flöde
```typescript
export interface IncomingToolCall {
  id: string;
  name: string;
  args?: Record<string, unknown>;
}

export interface ToolRoutingResult {
  toolCallId: string;
  immediateBidiResponse: BidiGenerateContentToolResponse;
  executionPromise: Promise<ToolExecutionResult>;
}
```
1. När `handleIncomingToolCall(call, agentId?)` anropas:
   - Skapa och returnera ett omedelbart `BidiGenerateContentToolResponse` med `behavior: 'NON_BLOCKING'`.
   - Starta den asynkrona exekveringen i bakgrunden (`mcpServer.handleJsonRpcRequest`).
   - När exekveringen är klar: publicera `mcp.tool.execution.completed` (eller `mcp.tool.execution.failed`) på `SwarmEventBus` med:
     ```typescript
     {
       toolCallId: call.id,
       agentId: agentId || 'unknown',
       toolName: call.name,
       status: isError ? 'ERROR' : 'COMMITTED',
       output,
       timestamp: new Date().toISOString(),
     }
     ```
   - Detta tillåter `FloorController` att lyssna på `mcp.tool.execution.completed` för att verifiera att bakgrundsarbetet är klart och att agenten kan släppa golvet om så önskas.
