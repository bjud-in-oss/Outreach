# 2b Modellera: MCP Bridge & Gemini Live Swarm djupintegration (TCK-003)

## 1. Modellering av WebSocket-verktygsprotokoll (`mcpSchema.ts`)

### Gemini Live Bidi Tool Kontrakt
I enlighet med Gemini 3.8 Live API-specifikationen för asynkron verktygsexekvering:
```typescript
export interface BidiFunctionCall {
  id: string;
  name: string;
  args: Record<string, any>;
}

export interface BidiFunctionResponse {
  id: string;
  name: string;
  response: {
    output: Record<string, any> | string;
  };
}

export interface BidiGenerateContentToolResponse {
  functionResponses: BidiFunctionResponse[];
  behavior: 'NON_BLOCKING';
}
```

---

## 2. Modellering av `McpSwarmBridge` (`orchestrator/mcpSwarmBridge.ts`)

```typescript
export interface ToolExecutionResult {
  toolCallId: string;
  toolName: string;
  success: boolean;
  output: any;
  error?: string;
  envelope?: EventEnvelope;
  bidiResponse: BidiGenerateContentToolResponse;
}

export class McpSwarmBridge {
  private mcpServer: McpServer;
  private eventBus: SwarmEventBus;

  constructor(mcpServer?: McpServer, eventBus?: SwarmEventBus) {
    this.mcpServer = mcpServer || createUnifiedMcpServer();
    this.eventBus = eventBus || getGlobalSwarmEventBus();
  }

  public async executeTool(
    toolName: string,
    toolArgs: Record<string, any>,
    toolCallId?: string
  ): Promise<ToolExecutionResult> {
    const id = toolCallId || `call-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // 1. Publicera start-händelse
    this.eventBus.publish({
      id: `evt-tool-start-${Date.now()}`,
      source: 'outreach/mcp_bridge',
      type: 'mcp.tool.execution.started',
      specversion: '1.0',
      datacontenttype: 'application/json',
      time: new Date().toISOString(),
      data: { toolCallId: id, toolName, args: toolArgs },
    });

    // 2. Exekvera anrop över MCP JSON-RPC 2.0
    const mcpResponse = await this.mcpServer.handleJsonRpcRequest({
      jsonrpc: '2.0',
      id,
      method: 'tools/call',
      params: { name: toolName, arguments: toolArgs },
    });

    const isError = Boolean(mcpResponse.error);
    const output = mcpResponse.error ? mcpResponse.error.message : mcpResponse.result;

    // 3. Skapa Bidi NON_BLOCKING tool response för WebSocket-kabeln
    const bidiResponse: BidiGenerateContentToolResponse = {
      functionResponses: [
        {
          id,
          name: toolName,
          response: { output: output as any },
        },
      ],
      behavior: 'NON_BLOCKING',
    };

    // 4. Publicera sluthändelse
    const completedEnvelope: EventEnvelope = {
      id: `evt-tool-complete-${Date.now()}`,
      source: 'outreach/mcp_bridge',
      type: isError ? 'mcp.tool.execution.failed' : 'mcp.tool.execution.completed',
      specversion: '1.0',
      datacontenttype: 'application/json',
      time: new Date().toISOString(),
      data: {
        toolCallId: id,
        toolName,
        success: !isError,
        output,
      },
    };
    this.eventBus.publish(completedEnvelope);

    return {
      toolCallId: id,
      toolName,
      success: !isError,
      output,
      error: mcpResponse.error?.message,
      envelope: completedEnvelope,
      bidiResponse,
    };
  }
}
```

---

## 3. Modellering av `createUnifiedMcpServer()`

Binder samman:
1. `drive_save_draft` (Sparar utkast i Drive)
2. `drive_list_templates` (Hämtar mallar)
3. `drive_create_file` (Skapar godtycklig Drive-fil)
4. `wal_get_stats` (Hämtar transaktionsstatus från WAL)
5. `wal_query_recent` (Hämtar historik från WAL)
6. `outreach_evaluate_tone` (Kvalitetsgranskning)
