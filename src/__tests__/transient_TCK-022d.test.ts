import fs from 'node:fs';
import path from 'node:path';
import { checkAstMetrics, checkNoProductionMocks } from '../../scripts/drivers/ts.js';
import { GeminiLiveSession } from '../features/gemini_live_swarm/session/geminiLiveSession.ts';
import { SwarmEventBus } from '../features/gemini_live_swarm/bus/swarmEventBus.ts';

export async function runTransientTCK022dTests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];
  const rootDir = process.cwd();

  function assert(condition: boolean, msg: string) {
    if (!condition) throw new Error(msg);
  }

  // Test 1: Parallell 3-agent Bidi uppkoppling och sanerat thinkingConfig ({ thinkingLevel: 'high' })
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
    assert(connectCalls.length === 3, `Förväntade 3 parallella connect-anrop, fick ${connectCalls.length}`);

    // Kontrollera att alla 3 har korrekt thinkingConfig
    for (const call of connectCalls) {
      assert(
        call.config.thinkingConfig?.thinkingLevel === 'high',
        'thinkingConfig ska vara { thinkingLevel: "high" }'
      );
      assert(
        call.config.thinkingConfig?.thinking_level === undefined,
        'thinkingConfig får inte innehålla felaktig thinking_level-nyckel'
      );
      assert(
        call.config.thinkingConfig?.thinkingLevel !== 'HIGH',
        'thinkingLevel ska vara gemener "high"'
      );
    }

    // Kontrollera att sessioner sparats för alla 3 kanaler
    const agentSessions = session.getAgentSessions();
    assert(agentSessions.size === 3, 'Alla 3 agent-sessioner ska finnas i agentSessions-mappen');
    assert(Boolean(session.getAgentSession('forlikas')), 'forlikas-session ska finnas');
    assert(Boolean(session.getAgentSession('folja')), 'folja-session ska finnas');
    assert(Boolean(session.getAgentSession('vanda_om')), 'vanda_om-session ska finnas');

    await session.disconnectLive();
    results.push({ name: 'Parallell 3-agent Live connect och strikt thinkingConfig { thinkingLevel: "high" }', passed: true });
  } catch (err: any) {
    results.push({ name: 'Parallell 3-agent Live connect och strikt thinkingConfig { thinkingLevel: "high" }', passed: false, error: err.message });
  }

  // Test 2: Inkommande agentmeddelanden routas korrekt till sin respektive ljudkanal och triggar floor preemption
  try {
    const bus = new SwarmEventBus();
    const session = new GeminiLiveSession('test-api-key', bus);

    // Skapa en kort giltig 24kHz PCM-bas64 sträng (10ms sinus)
    const pcmSamples = new Int16Array(240);
    for (let i = 0; i < pcmSamples.length; i++) pcmSamples[i] = Math.round(Math.sin(i / 10) * 10000);
    const bytes = new Uint8Array(pcmSamples.buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    const base64Audio = btoa(binary);

    const audioMsg = {
      serverContent: {
        modelTurn: { parts: [{ inlineData: { data: base64Audio } }] },
      },
    };

    // folja börjar tala och tilldelas golvet efter arbitreringsfönstret (15 ms)
    session.handleAgentMessage('folja', audioMsg);

    await new Promise((resolve) => setTimeout(resolve, 25));
    assert(session.getCurrentSpeaker() === 'folja', 'folja ska ha röstgolvet initialt');

    // forlikas (prio 1) avbryter folja (prio 3) direkt (preemption < 20ms)
    let preemptedEmitted = false;
    bus.subscribe('swarm.floor.preempted', () => { preemptedEmitted = true; });

    session.handleAgentMessage('forlikas', audioMsg);

    assert(session.getCurrentSpeaker() === 'forlikas', 'forlikas ska ha tagit över röstgolvet via preemption');
    assert(preemptedEmitted, 'swarm.floor.preempted ska ha emitterats');

    // forlikas avslutar sin tur
    session.handleAgentMessage('forlikas', {
      serverContent: { turnComplete: true },
    });

    assert(session.getCurrentSpeaker() === null, 'Röstgolvet ska vara frigjort efter turnComplete');

    await session.disconnectLive();
    results.push({ name: 'Meddelanderouting till respektive ljudkanal och preemption i stereosvärmen', passed: true });
  } catch (err: any) {
    results.push({ name: 'Meddelanderouting till respektive ljudkanal och preemption i stereosvärmen', passed: false, error: err.message });
  }

  // Test 3: AST-kvalitet, radantal och noll produktion-mockar för geminiLiveSession.ts
  try {
    const relPath = 'src/features/gemini_live_swarm/session/geminiLiveSession.ts';
    const fullPath = path.join(rootDir, relPath);
    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n').length;
    assert(lines <= 250, `${relPath} har ${lines} rader (> 250)`);

    const astMetrics = checkAstMetrics(relPath, content);
    assert(astMetrics.valid, astMetrics.error || `${relPath} felade AST-kontroll`);

    const mockCheck = checkNoProductionMocks(relPath, content);
    assert(mockCheck.valid, mockCheck.error || `${relPath} innehåller otillåtna produktionsmockar`);

    results.push({ name: 'AST- och mock-regler för geminiLiveSession.ts efter 3-agent parallellisering', passed: true });
  } catch (err: any) {
    results.push({ name: 'AST- och mock-regler för geminiLiveSession.ts efter 3-agent parallellisering', passed: false, error: err.message });
  }

  return results;
}
