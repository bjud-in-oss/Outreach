import { describe, it, expect } from 'vitest';
import { McpServer, createStandardMcpServer } from '../server/mcpServer';
import { summarizeRegisteredTools } from '../tools/mcpToolRegistryHelper';

describe('MCP Bridge TCK-057 Tests', () => {
  it('should respond to tools/list with registered tools', async () => {
    const server = createStandardMcpServer();
    const response = await server.handleJsonRpcRequest({
      jsonrpc: '2.0',
      id: 'req-1',
      method: 'tools/list',
      params: {},
    });

    expect(response.result).toBeDefined();
    const tools = (response.result as any).tools;
    expect(tools).toBeDefined();
    // createStandardMcpServer registers 3 tools initially
    expect(tools.length).toBeGreaterThanOrEqual(3);
  });

  it('should execute tools/call correctly', async () => {
    const server = new McpServer();
    server.registerTool(
      {
        name: 'echo_tool',
        description: 'Ekar tillbaka ett meddelande',
        inputSchema: { type: 'object', properties: { text: { type: 'string' } } },
      },
      async (args) => {
        return { content: [{ type: 'text', text: `Echo: ${args.text}` }] };
      }
    );

    const response = await server.handleJsonRpcRequest({
      jsonrpc: '2.0',
      id: 'req-2',
      method: 'tools/call',
      params: {
        name: 'echo_tool',
        arguments: { text: 'Hej Samordning' },
      },
    });

    expect(response.result).toBeDefined();
    const content = (response.result as any).content;
    expect(content).toBeDefined();
    expect(content[0].text).toBe('Echo: Hej Samordning');
  });

  it('should return JSON-RPC -32601 for unknown method', async () => {
    const server = new McpServer();
    const response = await server.handleJsonRpcRequest({
      jsonrpc: '2.0',
      id: 'req-3',
      method: 'non_existent_method',
      params: {},
    });

    expect(response.error).toBeDefined();
    expect(response.error?.code).toBe(-32601);
  });

  it('should summarize registered tools', () => {
    const server = createStandardMcpServer();
    
    // We expect summarizeRegisteredTools to be implemented in mcpToolRegistryHelper.ts
    const summary = summarizeRegisteredTools(server);
    
    expect(summary).toBeDefined();
    expect(typeof summary.count).toBe('number');
    expect(Array.isArray(summary.names)).toBe(true);
    expect(summary.count).toBeGreaterThan(0);
    expect(summary.names.length).toBe(summary.count);
    expect(summary.names).toContain('drive_create_file');
  });
});
