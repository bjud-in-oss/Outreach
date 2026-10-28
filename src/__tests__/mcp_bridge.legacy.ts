import { McpServer, createStandardMcpServer } from '../features/mcp_bridge/server/mcpServer.ts';

export async function runMcpBridgeTests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results = [];

  // Test 1: JSON-RPC 2.0 tools/list request
  try {
    const server = createStandardMcpServer();
    const response = await server.handleJsonRpcRequest({
      jsonrpc: '2.0',
      id: 'req-1',
      method: 'tools/list',
      params: {},
    });

    const hasTools = response.result?.tools && response.result.tools.length >= 3;
    results.push({ name: 'MCP Server responds to tools/list with registered tools', passed: Boolean(hasTools) });
  } catch (err) {
    results.push({ name: 'MCP Server responds to tools/list with registered tools', passed: false, error: String(err) });
  }

  // Test 2: tools/call exekvering
  try {
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

    const passed = response.result?.content?.[0]?.text === 'Echo: Hej Samordning';
    results.push({ name: 'MCP Server executes tools/call correctly', passed });
  } catch (err) {
    results.push({ name: 'MCP Server executes tools/call correctly', passed: false, error: String(err) });
  }

  // Test 3: Okänd metod kastar -32601 Method not found
  try {
    const server = new McpServer();
    const response = await server.handleJsonRpcRequest({
      jsonrpc: '2.0',
      id: 'req-3',
      method: 'non_existent_method' as any,
      params: {},
    });

    const passed = response.error?.code === -32601;
    results.push({ name: 'Unknown method returns JSON-RPC -32601 error', passed });
  } catch (err) {
    results.push({ name: 'Unknown method returns JSON-RPC -32601 error', passed: false, error: String(err) });
  }

  return results;
}
