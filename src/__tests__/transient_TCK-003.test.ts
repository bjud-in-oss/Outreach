import { createUnifiedMcpServer } from '../features/mcp_bridge/server/mcpServer.ts';
import { McpSwarmBridge } from '../features/mcp_bridge/orchestrator/mcpSwarmBridge.ts';
import { BidiGenerateContentToolResponseSchema } from '../features/mcp_bridge/contracts/mcpSchema.ts';
import { SwarmEventBus } from '../features/gemini_live_swarm/bus/swarmEventBus.ts';
import { SwarmOrchestrator } from '../features/gemini_live_swarm/coordinator/swarmOrchestrator.ts';
import { GeminiLiveSession } from '../features/gemini_live_swarm/session/geminiLiveSession.ts';
import { EventEnvelope } from '../shared/contracts/envelope.ts';

export async function runTransientTCK003Tests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  function assert(condition: boolean, msg: string) {
    if (!condition) throw new Error(msg);
  }

  // Test 1: createUnifiedMcpServer registers tools from Drive, WAL, and Quality Evaluation
  try {
    const server = createUnifiedMcpServer();
    const tools = server.getRegisteredTools();
    const toolNames = tools.map((t) => t.name);

    assert(tools.length >= 6, `Förväntade minst 6 verktyg, fick ${tools.length}`);
    assert(toolNames.includes('drive_create_file'), 'Saknar drive_create_file');
    assert(toolNames.includes('drive_save_draft'), 'Saknar drive_save_draft');
    assert(toolNames.includes('drive_list_templates'), 'Saknar drive_list_templates');
    assert(toolNames.includes('wal_query_recent'), 'Saknar wal_query_recent');
    assert(toolNames.includes('wal_get_stats'), 'Saknar wal_get_stats');
    assert(toolNames.includes('outreach_evaluate_tone'), 'Saknar outreach_evaluate_tone');

    results.push({
      name: 'TCK-003: createUnifiedMcpServer registrerar samtliga verktyg från Drive, WAL och Kvalitetsanalys',
      passed: true,
    });
  } catch (err) {
    results.push({
      name: 'TCK-003: createUnifiedMcpServer registrerar samtliga verktyg från Drive, WAL och Kvalitetsanalys',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Test 2: McpSwarmBridge executes tool and produces valid NON_BLOCKING Bidi response
  try {
    const bus = new SwarmEventBus();
    const bridge = new McpSwarmBridge(createUnifiedMcpServer(), bus);

    const res = await bridge.executeTool(
      'drive_create_file',
      {
        fileName: 'TestKampanj.md',
        folder: 'Campaigns',
        content: '# Test innehåll',
      },
      'call-test-123'
    );

    assert(res.success === true, 'Verktygsexekvering misslyckades');
    assert(res.toolName === 'drive_create_file', 'Fel toolName i resultat');
    assert(res.toolCallId === 'call-test-123', 'Fel toolCallId i resultat');

    // Validera NON_BLOCKING i Bidi-svar
    assert(res.bidiResponse.behavior === 'NON_BLOCKING', 'behavior måste vara NON_BLOCKING');
    assert(res.bidiResponse.functionResponses.length === 1, 'Förväntade 1 functionResponse');
    assert(res.bidiResponse.functionResponses[0].name === 'drive_create_file', 'Fel namn i Bidi response');

    // Kontraktsvalidering via Zod (Fail-Fast)
    BidiGenerateContentToolResponseSchema.parse(res.bidiResponse);

    results.push({
      name: 'TCK-003: McpSwarmBridge exekverar verktyg med NON_BLOCKING Bidi-svar och Zod-validering',
      passed: true,
    });
  } catch (err) {
    results.push({
      name: 'TCK-003: McpSwarmBridge exekverar verktyg med NON_BLOCKING Bidi-svar och Zod-validering',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Test 3: CloudEvents published to SwarmEventBus
  try {
    const bus = new SwarmEventBus();
    const bridge = new McpSwarmBridge(createUnifiedMcpServer(), bus);

    const receivedEvents: EventEnvelope[] = [];
    bus.subscribe('mcp.tool.*', (evt) => {
      receivedEvents.push(evt);
    });

    await bridge.executeTool('outreach_evaluate_tone', {
      draftText: 'Kära kollega, vi vill gärna utforska ett samarbete.',
      recipientProfile: 'VD & Grundare',
    });

    assert(receivedEvents.length >= 2, `Förväntade minst 2 händelser (started, completed), fick ${receivedEvents.length}`);
    const types = receivedEvents.map((e) => e.type);
    assert(types.includes('mcp.tool.execution.started'), 'Saknar mcp.tool.execution.started');
    assert(types.includes('mcp.tool.execution.completed'), 'Saknar mcp.tool.execution.completed');

    results.push({
      name: 'TCK-003: CloudEvents 1.0 sänds reaktivt till SwarmEventBus vid verktygsanrop',
      passed: true,
    });
  } catch (err) {
    results.push({
      name: 'TCK-003: CloudEvents 1.0 sänds reaktivt till SwarmEventBus vid verktygsanrop',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Test 4: SwarmOrchestrator integration with McpSwarmBridge
  try {
    const bus = new SwarmEventBus();
    const bridge = new McpSwarmBridge(createUnifiedMcpServer(), bus);
    const mockSession = {
      getLiveStatus: () => 'IDLE',
      generateAgentTurn: async (p: any) => ({
        agentRole: p.role,
        thought: 'Testanalys',
        content: `Kampanjutkast för ${p.role}: Målgrupp och strategi.`,
        score: 9.5,
      }),
    } as unknown as GeminiLiveSession;
    const orchestrator = new SwarmOrchestrator(mockSession, bridge);

    assert(orchestrator.getMcpBridge() === bridge, 'McpBridge är inte korrekt kopplad till orkestratorn');

    const plan = orchestrator.createCampaignPlan({
      title: 'Skandinavisk Värme',
      targetAudience: 'Skolledare och rektorer',
      valueProposition: 'Omsorgsbaserad gemenskap och närhet',
    });

    const envelopes: EventEnvelope[] = [];
    await orchestrator.executeCampaign(plan, undefined, (env) => {
      envelopes.push(env);
    });

    assert(plan.status === 'COMPLETED', `Planstatus förväntades vara COMPLETED, fick ${plan.status}`);
    assert(plan.finalDraft !== undefined, 'finalDraft saknas efter kampanjkörning');
    assert(envelopes.length >= 3, `Förväntade minst 3 steg-kuvert, fick ${envelopes.length}`);

    results.push({
      name: 'TCK-003: SwarmOrchestrator exekverar kampanj i samverkan med McpSwarmBridge och verktygsstöd',
      passed: true,
    });
  } catch (err) {
    results.push({
      name: 'TCK-003: SwarmOrchestrator exekverar kampanj i samverkan med McpSwarmBridge och verktygsstöd',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return results;
}
