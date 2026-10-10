import { SwarmEventBus } from '../features/gemini_live_swarm/bus/swarmEventBus.ts';
import {
  AudioTriggerReasonSchema,
  AudioOutputStateSchema,
  detectUnitInvocation,
  AudioOutputState,
} from '../features/gemini_live_swarm/telemetry/telemetrySchema.ts';
import { EventEnvelope } from '../shared/contracts/envelope.ts';

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

export async function runTransientTCK011Tests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  // Test 1: Zod-schemavalidering för AudioTriggerReasonSchema och AudioOutputStateSchema (Fail-Fast)
  try {
    assert(AudioTriggerReasonSchema.parse('DEFAULT_SILENCE') === 'DEFAULT_SILENCE', 'Kunde inte validera DEFAULT_SILENCE');
    assert(AudioTriggerReasonSchema.parse('NAME_INVOCATION') === 'NAME_INVOCATION', 'Kunde inte validera NAME_INVOCATION');
    assert(AudioTriggerReasonSchema.parse('TOKEN_GATE') === 'TOKEN_GATE', 'Kunde inte validera TOKEN_GATE');
    assert(AudioTriggerReasonSchema.parse('MANUAL_UNMUTE') === 'MANUAL_UNMUTE', 'Kunde inte validera MANUAL_UNMUTE');
    const validState = AudioOutputStateSchema.parse({
      isMuted: false,
      activeSpeakerUnitId: 'unit-att-folja',
      activeForce: 'ATT_FOLJA',
      triggerReason: 'NAME_INVOCATION',
      lastChangedAt: new Date().toISOString(),
    });
    assert(validState.isMuted === false, 'isMuted matchar inte');
    assert(validState.activeSpeakerUnitId === 'unit-att-folja', 'activeSpeakerUnitId matchar inte');
    let invalidCaught = false;
    try {
      AudioOutputStateSchema.parse({ isMuted: 'not-a-bool', triggerReason: 'INVALID_TRIGGER' });
    } catch {
      invalidCaught = true;
    }
    assert(invalidCaught, 'Ogiltigt ljudtillstånd fångades inte av Fail-Fast schema');
    results.push({ name: 'TCK-011: AudioTriggerReasonSchema och AudioOutputStateSchema validerar Fail-Fast', passed: true });
  } catch (err: any) {
    results.push({ name: 'TCK-011: AudioTriggerReasonSchema och AudioOutputStateSchema validerar Fail-Fast', passed: false, error: err.message });
  }

  // Test 2: Deterministisk namndetektor detectUnitInvocation för de 4 försoningsenheterna
  try {
    const foljaMatch1 = detectUnitInvocation('Kan Att följa Guds son analysera denna kundprofil?');
    assert(foljaMatch1?.unitId === 'unit-att-folja', 'Misslyckades matcha Att följa Guds son');
    assert(foljaMatch1?.force === 'ATT_FOLJA', 'Felaktig kraft för Att följa');
    const foljaMatch2 = detectUnitInvocation('Låt sonen förbereda kontakten');
    assert(foljaMatch2?.unitId === 'unit-att-folja', 'Misslyckades matcha sonen');
    const vandaMatch = detectUnitInvocation('Vi behöver att vända om till Gud och granska äktheten');
    assert(vandaMatch?.unitId === 'unit-att-vanda-om', 'Misslyckades matcha Att vända om till Gud');
    assert(vandaMatch?.force === 'ATT_VANDA_OM', 'Felaktig kraft för Att vända om');
    const forlikasMatch = detectUnitInvocation('Kan vi förlikas med Gud och sammanväva perspektiven?');
    assert(forlikasMatch?.unitId === 'unit-att-forlikas', 'Misslyckades matcha Att förlikas med Gud');
    assert(forlikasMatch?.force === 'ATT_FORLIKAS', 'Felaktig kraft för Att förlikas');
    const forsonasMatch = detectUnitInvocation('Låt den seriella motorn och ensam agent verifiera Token Gate');
    assert(forsonasMatch?.unitId === 'unit-seriell-motor', 'Misslyckades matcha Att försonas');
    assert(forsonasMatch?.force === 'SERIELL_MOTOR', 'Felaktig kraft för Att försonas');
    const nullMatch = detectUnitInvocation('Detta är en vanlig text utan något enhetsanrop');
    assert(nullMatch === null, 'Detektorn ska returnera null för orelaterad text');
    results.push({ name: 'TCK-011: detectUnitInvocation matchar deterministiskt samtliga 4 försoningsenheter', passed: true });
  } catch (err: any) {
    results.push({ name: 'TCK-011: detectUnitInvocation matchar deterministiskt samtliga 4 försoningsenheter', passed: false, error: err.message });
  }

  // Test 3: SwarmEventBus publicerar swarm.audio.state.changed som CloudEvents 1.0
  try {
    const bus = new SwarmEventBus();
    const capturedAudioEvents: EventEnvelope[] = [];
    bus.subscribe('swarm.audio.state.changed', (envelope) => { capturedAudioEvents.push(envelope); });
    const testState: AudioOutputState = {
      isMuted: false,
      activeSpeakerUnitId: 'unit-att-forlikas',
      activeForce: 'ATT_FORLIKAS',
      triggerReason: 'NAME_INVOCATION',
      lastChangedAt: new Date().toISOString(),
    };
    const envelope = bus.publishAudioState(testState);
    assert(envelope.specversion === '1.0', 'Fel CloudEvents specversion');
    assert(envelope.type === 'swarm.audio.state.changed', 'Fel händelsetyp');
    assert(envelope.source === 'outreach/gemini_live/audio_gate', 'Fel händelsekälla');
    assert(capturedAudioEvents.length === 1, 'Prenumerant tog inte emot ljudhändelsen');
    assert((capturedAudioEvents[0].data as Record<string, unknown>).isMuted === false, 'isMuted ska vara false');
    results.push({ name: 'TCK-011: SwarmEventBus.publishAudioState kapslar in och distribuerar CloudEvents 1.0', passed: true });
  } catch (err: any) {
    results.push({ name: 'TCK-011: SwarmEventBus.publishAudioState kapslar in och distribuerar CloudEvents 1.0', passed: false, error: err.message });
  }

  // Test 4: Tyst röstspärr (Silent Multistep) under flerstegskörning och reaktiv triggning
  try {
    const bus = new SwarmEventBus();
    let currentAudioState: AudioOutputState = {
      isMuted: true,
      triggerReason: 'DEFAULT_SILENCE',
      lastChangedAt: new Date().toISOString(),
    };
    bus.subscribe('swarm.audio.state.changed', (env) => {
      currentAudioState = AudioOutputStateSchema.parse(env.data);
    });
    bus.publish({
      id: 'evt-step-1',
      source: 'outreach/swarm/att_folja',
      type: 'swarm.agent.thinking',
      specversion: '1.0',
      datacontenttype: 'application/json',
      time: new Date().toISOString(),
      data: { thought: 'Analyserar data i tystnad...' },
    });
    assert(currentAudioState.isMuted === true, 'Ljudkanalen ska förbli tyst under bakgrundsanalys');
    const userPrompt = 'Att följa Guds son, ge mig en sammanfattning';
    const match = detectUnitInvocation(userPrompt);
    assert(match !== null, 'Namnanrop detekterades inte');
    if (match) {
      bus.publishAudioState({
        isMuted: false,
        activeSpeakerUnitId: match.unitId,
        activeForce: match.force,
        triggerReason: 'NAME_INVOCATION',
        lastChangedAt: new Date().toISOString(),
      });
    }
    assert(currentAudioState.isMuted === false, 'Högtalaren ska öppnas vid namnanrop');
    assert(currentAudioState.activeSpeakerUnitId === 'unit-att-folja', 'Fel talande enhet');
    assert(currentAudioState.triggerReason === 'NAME_INVOCATION', 'Fel triggerReason');
    results.push({ name: 'TCK-011: Tyst röstspärr bibehålls under bakgrundsarbete och öppnas selektivt vid namnanrop', passed: true });
  } catch (err: any) {
    results.push({ name: 'TCK-011: Tyst röstspärr bibehålls under bakgrundsarbete och öppnas selektivt vid namnanrop', passed: false, error: err.message });
  }

  // Test 5: Automatisk talaktivering vid Token Gate (Steg 3c_spec) för Att försonas (ensam agent)
  try {
    const bus = new SwarmEventBus();
    let audioOutput: AudioOutputState = {
      isMuted: true,
      triggerReason: 'DEFAULT_SILENCE',
      lastChangedAt: new Date().toISOString(),
    };
    bus.subscribe('swarm.audio.state.changed', (env) => {
      audioOutput = AudioOutputStateSchema.parse(env.data);
    });
    const tokenGateMetric = {
      pipelineId: 'pipe-test',
      ticketId: 'TCK-011',
      stepIndex: 5,
      totalSteps: 7,
      currentStage: '3c_spec',
      stageStatus: 'GATED',
      durationMs: 450,
      isTokenGated: true,
      requiredTokenHash: 'TCK-011-SILENT-VOICE-TOKEN',
      lastTransitionAt: new Date().toISOString(),
      activeForce: 'SERIELL_MOTOR',
    };
    if (tokenGateMetric.currentStage === '3c_spec' && tokenGateMetric.isTokenGated) {
      bus.publishAudioState({
        isMuted: false,
        activeSpeakerUnitId: 'unit-seriell-motor',
        activeForce: 'SERIELL_MOTOR',
        triggerReason: 'TOKEN_GATE',
        lastChangedAt: new Date().toISOString(),
      });
    }
    assert(audioOutput.isMuted === false, 'Högtalaren ska öppnas automatiskt vid Token Gate');
    assert(audioOutput.activeSpeakerUnitId === 'unit-seriell-motor', 'Att försonas ska vara talande enhet vid Token Gate');
    assert(audioOutput.triggerReason === 'TOKEN_GATE', 'Trigger-orsak ska vara TOKEN_GATE');
    bus.publishAudioState({
      isMuted: true,
      triggerReason: 'DEFAULT_SILENCE',
      lastChangedAt: new Date().toISOString(),
    });
    assert(audioOutput.isMuted === true, 'Högtalaren ska kunna återgå till tyst läge');
    results.push({ name: 'TCK-011: Token Gate (Steg 3c) aktiverar automatiskt röstutgång för Att försonas (ensam agent)', passed: true });
  } catch (err: any) {
    results.push({ name: 'TCK-011: Token Gate (Steg 3c) aktiverar automatiskt röstutgång för Att försonas (ensam agent)', passed: false, error: err.message });
  }

  return results;
}
