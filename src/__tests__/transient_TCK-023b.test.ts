import fs from 'node:fs';
import path from 'node:path';
import { checkAstMetrics, checkNoProductionMocks } from '../../scripts/drivers/ts.js';
import { SwarmEventBus } from '../features/gemini_live_swarm/bus/swarmEventBus.ts';
import { GeminiLiveSession } from '../features/gemini_live_swarm/session/geminiLiveSession.ts';
import { SwarmOrchestrator } from '../features/gemini_live_swarm/coordinator/swarmOrchestrator.ts';
import { REFLECTION_MODE_EVENT } from '../features/gemini_live_swarm/ui/reflectionStateHelper.ts';

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

export async function runTransientTCK023bTests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];
  const rootDir = process.cwd();

  // Test 1: Single Live WebSocket för Host (Att förlikas) med High-Thinking
  try {
    const bus = new SwarmEventBus();
    const session = new GeminiLiveSession('test-api-key', bus);
    const connectCalls: any[] = [];
    const fakeConnect = async (agentConfig: any) => {
      connectCalls.push(agentConfig);
      return { sendRealtimeInput: () => {}, close: () => {} };
    };
    (session as any).aiClient = { live: { connect: fakeConnect } };

    const connected = await session.connectLive();
    assert(connected === true, 'connectLive ska returnera true');
    assert(connectCalls.length === 1, `Förväntade exakt 1 Host-anslutning, fick ${connectCalls.length}`);
    assert(connectCalls[0].config.thinkingConfig?.thinkingLevel === 'high', 'thinkingLevel ska vara high');
    assert(Boolean(session.getAgentSession('forlikas')), 'Host-session förlikas ska finnas');
    await session.disconnectLive();
    results.push({ name: 'TCK-023b: Single Live WebSocket exklusivt för Host (Att förlikas)', passed: true });
  } catch (err: any) {
    results.push({ name: 'TCK-023b: Single Live WebSocket exklusivt för Host (Att förlikas)', passed: false, error: err.message });
  }

  // Test 2: VAD-detektering sänder Turn Complete vid > 400 ms tystnad
  try {
    const bus = new SwarmEventBus();
    const session = new GeminiLiveSession('test-api-key', bus);
    let sentInput: any = null;
    (session as any).activeSdkSession = {
      sendRealtimeInput: (p: any) => { sentInput = p; },
    };
    const orchestrator = new SwarmOrchestrator(session, undefined, bus);

    let vadTurnCompleteEvent: any = null;
    bus.subscribe('swarm.live.vad.turn_complete', (env) => { vadTurnCompleteEvent = env.data; });

    assert(orchestrator.handleVadSilence(300) === false, 'Tystnad <= 400 ms ska inte trigga Turn Complete');
    assert(sentInput === null, 'Inget turnComplete ska sändas vid 300 ms');

    const triggered = orchestrator.handleVadSilence(450);
    assert(triggered === true, 'Tystnad > 400 ms ska trigga Turn Complete');
    assert(sentInput?.realtimeInput?.turnComplete === true, 'turnComplete ska finnas i realtimeInput');
    assert(Boolean(vadTurnCompleteEvent), 'swarm.live.vad.turn_complete händelse ska emitteras');
    assert(vadTurnCompleteEvent.action === 'TURN_COMPLETE_SENT', 'Korrekt åtgärd i VAD event');

    results.push({ name: 'TCK-023b: VAD sänder Turn Complete vid > 400 ms tystnad', passed: true });
  } catch (err: any) {
    results.push({ name: 'TCK-023b: VAD sänder Turn Complete vid > 400 ms tystnad', passed: false, error: err.message });
  }

  // Test 3: Bakgrunds-underagenter via @google/genai (High-Thinking) och syntes
  try {
    const bus = new SwarmEventBus();
    const session = new GeminiLiveSession('test-api-key', bus);
    const capturedPrompts: string[] = [];
    const fakeGenerate = async (cfg: any) => {
      capturedPrompts.push(cfg.contents);
      return { text: `Genererat svar för: ${cfg.contents.slice(0, 30)}` };
    };
    (session as any).aiClient = { models: { generateContent: fakeGenerate } };
    const orchestrator = new SwarmOrchestrator(session, undefined, bus);
    const synthesis = await orchestrator.synthesizeBackgroundAgents('Partnerskap och outreach');
    assert(capturedPrompts.length === 3, `Förväntade 3 anrop (2 underagenter + 1 host), fick ${capturedPrompts.length}`);
    assert(Boolean(synthesis.foljaOutput), 'foljaOutput ska finnas');
    assert(Boolean(synthesis.vandaOmOutput), 'vandaOmOutput ska finnas');
    assert(Boolean(synthesis.synthesis), 'Host synthesis ska finnas');
    results.push({ name: 'TCK-023b: Bakgrunds-underagenter med High-Thinking och syntes i Host', passed: true });
  } catch (err: any) {
    results.push({ name: 'TCK-023b: Bakgrunds-underagenter med High-Thinking och syntes i Host', passed: false, error: err.message });
  }

  // Test 4: Prenumeration på ReflectionMode & MÄTTNAD: JA
  try {
    const bus = new SwarmEventBus();
    const session = new GeminiLiveSession('test-api-key', bus);
    (session as any).aiClient = {
      models: {
        generateContent: async () => ({ text: 'Reflektionsinsikt' }),
      },
    };
    const orchestrator = new SwarmOrchestrator(session, undefined, bus);
    assert(orchestrator.getReflectionMode() === 'normal', 'Standard ska vara normal');

    bus.publish({
      id: 'evt-mode-1', source: 'ui/reflection', type: REFLECTION_MODE_EVENT,
      specversion: '1.0', datacontenttype: 'application/json', time: new Date().toISOString(),
      data: { mode: 'makro' },
    });
    assert(orchestrator.getReflectionMode() === 'makro', 'Orchestrator ska ha uppdaterat till makro');

    let reflectionCompletedEvent: any = null;
    bus.subscribe('swarm.reflection.completed', (env) => { reflectionCompletedEvent = env.data; });

    const reflectRes = await orchestrator.runReflectionPhase('Arkitektur och mognad');
    assert(reflectRes.iterations === 2, 'makro ska köra 2 iterationsvarv');
    assert(reflectRes.saturated === true, 'Reflektionen ska slå fast mättnad');
    assert(Boolean(reflectionCompletedEvent), 'swarm.reflection.completed ska emitteras');
    assert(reflectionCompletedEvent.saturation === 'JA', 'saturation ska vara JA i event');
    assert(orchestrator.getTokenThroughput() > 0, 'tokenThroughput ska vara positiv');
    results.push({ name: 'TCK-023b: ReflectionMode-styrning och MÄTTNAD: JA telemetri', passed: true });
  } catch (err: any) {
    results.push({ name: 'TCK-023b: ReflectionMode-styrning och MÄTTNAD: JA telemetri', passed: false, error: err.message });
  }

  // Test 5: AST- och radgränser (< 250 rader) samt noll produktionsmockar
  try {
    const files = [
      'src/features/gemini_live_swarm/coordinator/swarmOrchestrator.ts',
      'src/features/gemini_live_swarm/session/geminiLiveSession.ts',
    ];
    for (const rel of files) {
      const full = path.join(rootDir, rel);
      const content = fs.readFileSync(full, 'utf8');
      const ast = checkAstMetrics(full, content);
      assert(ast.valid, `AST-fel i ${rel}: ${ast.error}`);
      const mock = checkNoProductionMocks(full, content);
      assert(mock.valid, `Mock-fel i ${rel}: ${mock.error}`);
    }
    results.push({ name: 'TCK-023b: AST- och mock-regler respekterade för koordinationsmoduler', passed: true });
  } catch (err: any) {
    results.push({ name: 'TCK-023b: AST- och mock-regler respekterade för koordinationsmoduler', passed: false, error: err.message });
  }

  return results;
}
