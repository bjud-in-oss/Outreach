import fs from 'node:fs';
import path from 'node:path';
import { checkAstMetrics, checkNoProductionMocks } from '../../scripts/drivers/ts.js';
import { McpSwarmBridge } from '../features/mcp_bridge/orchestrator/mcpSwarmBridge.ts';
import { createUnifiedMcpServer } from '../features/mcp_bridge/server/mcpServer.ts';
import { driveStore } from '../features/google_drive_sync/model/driveStore.ts';
import { WalEngine } from '../features/wal_logger/engine/walEngine.ts';
import { SwarmEventBus } from '../features/gemini_live_swarm/bus/swarmEventBus.ts';

export async function runTransientTCK022bTests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];
  const rootDir = process.cwd();

  function assert(condition: boolean, msg: string) {
    if (!condition) throw new Error(msg);
  }

  // Test 1: Bidi Function Declarations hämtas dynamiskt från MCP Server
  try {
    const wal = new WalEngine();
    const server = createUnifiedMcpServer(undefined, wal, driveStore);
    const bus = new SwarmEventBus();
    const bridge = new McpSwarmBridge(server, bus);

    const declarations = bridge.getBidiFunctionDeclarations();
    assert(declarations.length >= 5, 'Minst 5 verktyg ska deklareras för Bidi-kabeln');

    const patchDecl = declarations.find((d) => d.name === 'apply_code_patch');
    assert(Boolean(patchDecl), 'apply_code_patch ska finnas med i Bidi function declarations');
    assert(Boolean(patchDecl?.parameters?.properties), 'Parametrar ska innehålla inputSchema properties');

    results.push({ name: 'Dynamisk generering av Bidi functionDeclarations från MCP-server', passed: true });
  } catch (err: any) {
    results.push({ name: 'Dynamisk generering av Bidi functionDeclarations från MCP-server', passed: false, error: err.message });
  }

  // Test 2: Blixtsnabbt omedelbart NON_BLOCKING-svar vid toolCall
  try {
    const wal = new WalEngine();
    const server = createUnifiedMcpServer(undefined, wal, driveStore);
    const bus = new SwarmEventBus();
    const bridge = new McpSwarmBridge(server, bus);

    const startTime = Date.now();
    const routing = bridge.routeToolCallNonBlocking(
      {
        id: 'call-bidi-test-123',
        name: 'wal_get_stats',
        args: {},
      },
      'agent-forlikas'
    );
    const immediateElapsed = Date.now() - startTime;

    assert(immediateElapsed < 50, `Omedelbart svar tog för lång tid: ${immediateElapsed}ms`);
    assert(routing.immediateBidiResponse.behavior === 'NON_BLOCKING', 'Svarsbeteende måste vara NON_BLOCKING');
    assert(routing.immediateBidiResponse.functionResponses[0].id === 'call-bidi-test-123', 'ID måste matcha anropet');

    const result = await routing.executionPromise;
    assert(result.success, 'Asynkron exekvering ska lyckas');
    assert(result.status === 'COMMITTED', 'Status ska vara COMMITTED');

    results.push({ name: 'Blixtsnabbt omedelbart NON_BLOCKING röstsvar vid inkommande toolCall', passed: true });
  } catch (err: any) {
    results.push({ name: 'Blixtsnabbt omedelbart NON_BLOCKING röstsvar vid inkommande toolCall', passed: false, error: err.message });
  }

  // Test 3: Publicering av mcp.tool.execution.completed på SwarmEventBus
  try {
    const wal = new WalEngine();
    const server = createUnifiedMcpServer(undefined, wal, driveStore);
    const bus = new SwarmEventBus();
    const bridge = new McpSwarmBridge(server, bus);

    const testFile = 'src/test_mcp_routing.ts';
    driveStore.setVfsFile(testFile, 'const x = 1;\nconst y = 2;\n');

    let completedEventData: any = null;
    bus.subscribe('mcp.tool.execution.completed', (env) => {
      completedEventData = env.data;
    });

    const toolCallObj = {
      id: 'call-patch-routing-456',
      name: 'apply_code_patch',
      args: {
        filePath: testFile,
        searchBlock: 'const y = 2;',
        replaceBlock: 'const y = 42;',
      },
    };
    const routing = bridge.routeToolCallNonBlocking(toolCallObj, 'agent-vanda-om');

    await routing.executionPromise;

    assert(Boolean(completedEventData), 'mcp.tool.execution.completed ska ha publicerats på eventbussen');
    assert(completedEventData.toolCallId === 'call-patch-routing-456', 'Korrekt toolCallId i event');
    assert(completedEventData.agentId === 'agent-vanda-om', 'Korrekt agentId för röstgolvsfrigörelse');
    assert(completedEventData.toolName === 'apply_code_patch', 'Korrekt toolName i event');
    assert(completedEventData.status === 'COMMITTED', 'Status i event ska vara COMMITTED');

    const updatedContent = driveStore.getVfsFile(testFile);
    assert(Boolean(updatedContent?.includes('const y = 42;')), 'VFS-filen ska ha uppdaterats asynkront');

    results.push({ name: 'Publicering av mcp.tool.execution.completed med agentId på SwarmEventBus', passed: true });
  } catch (err: any) {
    results.push({ name: 'Publicering av mcp.tool.execution.completed med agentId på SwarmEventBus', passed: false, error: err.message });
  }

  // Test 4: AST- och radgränser (< 250 rader) och inga produktionsmockar
  try {
    const relPath = 'src/features/mcp_bridge/orchestrator/mcpSwarmBridge.ts';
    const fullPath = path.join(rootDir, relPath);
    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n').length;
    assert(lines <= 250, `${relPath} har ${lines} rader (> 250)`);

    const astMetrics = checkAstMetrics(relPath, content);
    assert(astMetrics.valid, astMetrics.error || `${relPath} felade AST-kontroll`);

    const mockCheck = checkNoProductionMocks(relPath, content);
    assert(mockCheck.valid, mockCheck.error || `${relPath} innehåller otillåtna produktionsmockar`);

    results.push({ name: 'AST- och radgränser (< 250 rader) samt noll produktionsmockar respekterade', passed: true });
  } catch (err: any) {
    results.push({ name: 'AST- och radgränser (< 250 rader) samt noll produktionsmockar respekterade', passed: false, error: err.message });
  }

  return results;
}
