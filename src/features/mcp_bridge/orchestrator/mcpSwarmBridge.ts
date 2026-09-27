import { McpServer, createUnifiedMcpServer } from '../server/mcpServer.ts';
import {
  BidiGenerateContentToolResponse,
  BidiGenerateContentToolResponseSchema,
  McpToolDefinition,
} from '../contracts/mcpSchema.ts';
import { SwarmEventBus, getGlobalSwarmEventBus } from '../../gemini_live_swarm/bus/swarmEventBus.ts';
import { EventEnvelope } from '../../../shared/contracts/envelope.ts';

export interface ToolExecutionResult {
  toolCallId: string;
  toolName: string;
  success: boolean;
  output: any;
  error?: string;
  envelope: EventEnvelope;
  bidiResponse: BidiGenerateContentToolResponse;
}

/**
 * TCK-003: McpSwarmBridge
 * Orkestreringsbrygga mellan MCP Server och Gemini Live WebSocket-kabeln.
 * Matar automatiskt kabeln med NON_BLOCKING tool responses.
 */
export class McpSwarmBridge {
  private mcpServer: McpServer;
  private eventBus: SwarmEventBus;

  constructor(mcpServer?: McpServer, eventBus?: SwarmEventBus) {
    this.mcpServer = mcpServer || createUnifiedMcpServer();
    this.eventBus = eventBus || getGlobalSwarmEventBus();
  }

  public getAvailableTools(): McpToolDefinition[] {
    return this.mcpServer.getRegisteredTools();
  }

  public hasTool(name: string): boolean {
    return this.mcpServer.hasTool(name);
  }

  /**
   * Exekverar ett verktygsanrop och genererar automatiskt ett NON_BLOCKING Bidi-svar
   * för WebSocket-kabeln samt sänder CloudEvents 1.0 till eventbussen.
   */
  public async executeTool(
    toolName: string,
    toolArgs: Record<string, any> = {},
    toolCallId?: string
  ): Promise<ToolExecutionResult> {
    const id = toolCallId || `call-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // 1. Publicera starthändelse (CloudEvents 1.0)
    const startEnvelope: EventEnvelope = {
      id: `evt-mcp-start-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      source: 'outreach/mcp_bridge',
      type: 'mcp.tool.execution.started',
      specversion: '1.0',
      datacontenttype: 'application/json',
      time: new Date().toISOString(),
      data: {
        toolCallId: id,
        toolName,
        args: toolArgs,
      },
    };
    this.eventBus.publish(startEnvelope);

    // 2. Anropa MCP JSON-RPC 2.0
    const mcpResponse = await this.mcpServer.handleJsonRpcRequest({
      jsonrpc: '2.0',
      id,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: toolArgs,
      },
    });

    const isError = Boolean(mcpResponse.error);
    const output = mcpResponse.error ? mcpResponse.error.message : mcpResponse.result;

    // 3. Skapa BidiGenerateContentToolResponse med behavior: 'NON_BLOCKING'
    const bidiResponseRaw: BidiGenerateContentToolResponse = {
      functionResponses: [
        {
          id,
          name: toolName,
          response: {
            output: output as any,
          },
        },
      ],
      behavior: 'NON_BLOCKING',
    };

    // Validera med Zod (Fail-Fast)
    const bidiResponse = BidiGenerateContentToolResponseSchema.parse(bidiResponseRaw);

    // 4. Publicera sluthändelse (CloudEvents 1.0)
    const completedEnvelope: EventEnvelope = {
      id: `evt-mcp-complete-${Date.now()}-${Math.random().toString(36).substring(7)}`,
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
        bidiBehavior: bidiResponse.behavior,
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

let globalMcpSwarmBridge: McpSwarmBridge | null = null;

export function getGlobalMcpSwarmBridge(): McpSwarmBridge {
  if (!globalMcpSwarmBridge) {
    globalMcpSwarmBridge = new McpSwarmBridge();
  }
  return globalMcpSwarmBridge;
}
