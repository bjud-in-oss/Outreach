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
  agentId: string;
  toolName: string;
  status: 'COMMITTED' | 'ERROR';
  success: boolean;
  output: any;
  error?: string;
  envelope: EventEnvelope;
  bidiResponse: BidiGenerateContentToolResponse;
}

export interface IncomingToolCall {
  id: string;
  name: string;
  args?: Record<string, any>;
}

export interface BidiFunctionDeclaration {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export interface ToolRoutingResult {
  toolCallId: string;
  immediateBidiResponse: BidiGenerateContentToolResponse;
  executionPromise: Promise<ToolExecutionResult>;
}

function createBidiToolResponse(id: string, name: string, output: any): BidiGenerateContentToolResponse {
  const resp = { output };
  const raw: BidiGenerateContentToolResponse = {
    functionResponses: [{ id, name, response: resp }],
    behavior: 'NON_BLOCKING',
  };
  return BidiGenerateContentToolResponseSchema.parse(raw);
}

/**
 * TCK-003 & TCK-022b: McpSwarmBridge
 * Orkestreringsbrygga mellan MCP Server och Gemini Live WebSocket-kabeln.
 * Matar kabeln med NON_BLOCKING tool responses och publicerar mcp.tool.execution.completed.
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

  public getBidiFunctionDeclarations(): BidiFunctionDeclaration[] {
    return this.mcpServer.getRegisteredTools().map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema as Record<string, any>,
    }));
  }

  public routeToolCallNonBlocking(call: IncomingToolCall, agentId = 'unknown'): ToolRoutingResult {
    const id = call.id || `call-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const pendingMsg = { status: 'PENDING', message: `Verktygsanrop för ${call.name} körs asynkront.` };
    const immediateBidiResponse = createBidiToolResponse(id, call.name, pendingMsg);
    const executionPromise = this.executeTool(call.name, call.args || {}, id, agentId);

    return {
      toolCallId: id,
      immediateBidiResponse,
      executionPromise,
    };
  }

  public async executeTool(
    toolName: string,
    toolArgs: Record<string, any> = {},
    toolCallId?: string,
    agentId = 'unknown'
  ): Promise<ToolExecutionResult> {
    const id = toolCallId || `call-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const startEnvelope: EventEnvelope = {
      id: `evt-mcp-start-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      source: 'outreach/mcp_bridge',
      type: 'mcp.tool.execution.started',
      specversion: '1.0',
      datacontenttype: 'application/json',
      time: new Date().toISOString(),
      data: { toolCallId: id, agentId, toolName, args: toolArgs },
    };
    this.eventBus.publish(startEnvelope);

    const mcpResponse = await this.mcpServer.handleJsonRpcRequest({
      jsonrpc: '2.0',
      id,
      method: 'tools/call',
      params: { name: toolName, arguments: toolArgs },
    });

    const isError = Boolean(mcpResponse.error) || Boolean(mcpResponse.result?.isError);
    const output = mcpResponse.error ? mcpResponse.error.message : mcpResponse.result;
    const status: 'COMMITTED' | 'ERROR' = isError ? 'ERROR' : 'COMMITTED';
    const bidiResponse = createBidiToolResponse(id, toolName, output);

    const completedEnvelope: EventEnvelope = {
      id: `evt-mcp-complete-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      source: 'outreach/mcp_bridge',
      type: isError ? 'mcp.tool.execution.failed' : 'mcp.tool.execution.completed',
      specversion: '1.0',
      datacontenttype: 'application/json',
      time: new Date().toISOString(),
      data: {
        toolCallId: id,
        agentId,
        toolName,
        status,
        success: !isError,
        output,
        bidiBehavior: bidiResponse.behavior,
        timestamp: new Date().toISOString(),
      },
    };
    this.eventBus.publish(completedEnvelope);

    return {
      toolCallId: id,
      agentId,
      toolName,
      status,
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
