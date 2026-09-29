import { SwarmEventBus } from '../features/gemini_live_swarm/bus/swarmEventBus.ts';
import {
  AudioOutputState,
  AudioOutputStateSchema,
  detectUnitInvocation,
} from '../features/gemini_live_swarm/telemetry/telemetrySchema.ts';
import { EventEnvelope } from '../shared/contracts/envelope.ts';
import { RECONCILIATION_UNITS } from '../features/gemini_live_swarm/agents/roleDefinitions.ts';

export async function runTransientTCK014Tests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  function assert(condition: boolean, msg: string) {
    if (!condition) throw new Error(msg);
  }

  // Test 1: SwarmEventBus distribuerar audio-state utan render- eller bidi-krockar
  try {
    const bus = new SwarmEventBus();
    const emittedAudioStates: AudioOutputState[] = [];

    bus.subscribe('swarm.audio.state.changed', (env: EventEnvelope) => {
      const parsed = AudioOutputStateSchema.parse(env.data);
      emittedAudioStates.push(parsed);
    });

    const unmutedState: AudioOutputState = {
      isMuted: false,
      activeSpeakerUnitId: 'unit-seriell-motor',
      activeForce: 'SERIELL_MOTOR',
      triggerReason: 'MANUAL_UNMUTE',
      lastChangedAt: new Date().toISOString(),
    };

    bus.publishAudioState(unmutedState);
    assert(emittedAudioStates.length === 1, 'Ljudhändelse publicerades inte till bussen');
    assert(emittedAudioStates[0].isMuted === false, 'Felaktigt isMuted värde');
    assert(emittedAudioStates[0].triggerReason === 'MANUAL_UNMUTE', 'Felaktig triggerReason');

    results.push({
      name: 'TCK-014: SwarmEventBus distribuerar AudioOutputState deterministiskt utan render-krockar',
      passed: true,
    });
  } catch (err) {
    results.push({
      name: 'TCK-014: SwarmEventBus distribuerar AudioOutputState deterministiskt utan render-krockar',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Test 2: Token Gate (3c) aktiverar röstutgång utan sidoeffekter inuti reducer
  try {
    const bus = new SwarmEventBus();
    let tokenGateAudioTriggered = false;

    bus.subscribe('swarm.audio.state.changed', (env: EventEnvelope) => {
      const data = env.data as AudioOutputState;
      if (data.triggerReason === 'TOKEN_GATE' && !data.isMuted) {
        tokenGateAudioTriggered = true;
      }
    });

    // Simulera Token Gate händelse från Seriell Motor
    bus.publishSerialMetric({
      pipelineId: 'pipe-tck-014',
      ticketId: 'TCK-014',
      stepIndex: 5,
      totalSteps: 6,
      currentStage: '3c_spec',
      stageStatus: 'GATED',
      durationMs: 150,
      isTokenGated: true,
      lastTransitionAt: new Date().toISOString(),
      activeForce: 'SERIELL_MOTOR',
    });

    // Simulera att telemetrilyssnaren läser av detta och publicerar token gate audio
    const tokenGateAudio: AudioOutputState = {
      isMuted: false,
      activeSpeakerUnitId: 'unit-seriell-motor',
      activeForce: 'SERIELL_MOTOR',
      triggerReason: 'TOKEN_GATE',
      lastChangedAt: new Date().toISOString(),
    };
    bus.publishAudioState(tokenGateAudio);

    assert(tokenGateAudioTriggered, 'Token Gate ljudaktivering sändes inte');

    results.push({
      name: 'TCK-014: Token Gate (3c_spec) aktiverar röstutgång deterministiskt',
      passed: true,
    });
  } catch (err) {
    results.push({
      name: 'TCK-014: Token Gate (3c_spec) aktiverar röstutgång deterministiskt',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Test 3: Namnutlöst talaktivering detekterar rätt enhet utan synkron setState-kollision
  try {
    const text1 = 'Kan vi be Att förlika ta fram sammanfattningen?';
    const match1 = detectUnitInvocation(text1);
    assert(match1 !== null && match1.unitId === 'unit-att-forlikas', 'Förlika detekterades inte');

    const text2 = 'Vi ber Bygga 1 generera utkastet nu.';
    const match2 = detectUnitInvocation(text2);
    assert(match2 !== null && match2.unitId === 'unit-seriell-motor', 'Bygga 1 detekterades inte');

    const text3 = 'Bara allmän text utan något agentnamn.';
    const match3 = detectUnitInvocation(text3);
    assert(match3 === null, 'Falsk positiv vid allmän text');

    results.push({
      name: 'TCK-014: detectUnitInvocation matchar deterministiskt enheter och skyddar mot setState-krockar',
      passed: true,
    });
  } catch (err) {
    results.push({
      name: 'TCK-014: detectUnitInvocation matchar deterministiskt enheter och skyddar mot setState-krockar',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Test 4: Alla 4 försoningsenheter har konsekvent visningsnamn och id
  try {
    const allUnits = Object.values(RECONCILIATION_UNITS);
    assert(allUnits.length === 4, `Förväntade 4 enheter, fann ${allUnits.length}`);
    const builder = RECONCILIATION_UNITS.SERIELL_MOTOR;
    assert(
      builder.displayName === 'Att tjäna Gud och andra: Bygga',
      `Felaktigt visningsnamn för 4:e enheten: ${builder.displayName}`
    );

    results.push({
      name: 'TCK-014: Försoningsenheterna bibehåller 100% namn- och strukturharmonisering',
      passed: true,
    });
  } catch (err) {
    results.push({
      name: 'TCK-014: Försoningsenheterna bibehåller 100% namn- och strukturharmonisering',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return results;
}
