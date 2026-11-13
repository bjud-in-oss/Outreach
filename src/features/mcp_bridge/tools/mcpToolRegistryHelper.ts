import { McpServer } from '../server/mcpServer';
import { McpToolDefinition } from '../../mcp_bridge/contracts/mcpSchema';

export function summarizeRegisteredTools(server: McpServer): { count: number; names: string[] } {
  const tools = server.getRegisteredTools();
  return {
    count: tools.length,
    names: tools.map((t: McpToolDefinition) => t.name)
  };
}
