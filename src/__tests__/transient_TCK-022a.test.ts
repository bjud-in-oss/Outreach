import fs from 'node:fs';
import path from 'node:path';
import { checkAstMetrics, checkNoProductionMocks } from '../../scripts/drivers/ts.js';
import {
  DSPRingBufferMixer,
  CHANNEL_PAN_CONFIG,
  detectSpeechPCM,
  AudioPreRollBuffer,
  SessionIntentManager,
  FloorController,
  GeminiLiveSession,
  CHANNEL_PRIORITY,
  AGENT_VOICE_MAP,
} from '../features/gemini_live_swarm/index.ts';
import { SwarmEventBus } from '../features/gemini_live_swarm/bus/swarmEventBus.ts';

export async function runTransientTCK022aTests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];
  const rootDir = process.cwd();

  function assert(condition: boolean, msg: string) {
    if (!condition) throw new Error(msg);
  }

  // Test 1: DSPRingBufferMixer spatial panorering och Node.js-säker körning
  try {
    assert(CHANNEL_PAN_CONFIG.folja === -0.4, 'Att följa ska ha pan -0.4');
    assert(CHANNEL_PAN_CONFIG.forlikas === 0.0, 'Att förlikas ska ha pan 0.0');
    assert(CHANNEL_PAN_CONFIG.vanda_om === 0.4, 'Att vända om ska ha pan +0.4');

    const mixer = new DSPRingBufferMixer();
    // Skapa en liten 24kHz Base64 PCM-sträng
    const pcmSamples = new Int16Array(240); // 10ms
    for (let i = 0; i < pcmSamples.length; i++) pcmSamples[i] = Math.round(Math.sin(i / 10) * 10000);
    const bytes = new Uint8Array(pcmSamples.buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    const base64Data = btoa(binary);

    let talked = false;
    mixer.play24kHzPCMBase64('forlikas', base64Data, () => { talked = true; });
    assert(talked, 'onTalking-callback ska anropas vid uppspelning');

    mixer.rampGain('forlikas', 0, 18);
    assert(mixer.getChannelGain('forlikas') === 0, 'Gain för forlikas ska vara 0 efter rampning');

    mixer.clearBuffer('forlikas');
    mixer.dispose();
    results.push({ name: 'DSPRingBufferMixer spatial panorering och klickfri gain-rampning i minnet', passed: true });
  } catch (err: any) {
    results.push({ name: 'DSPRingBufferMixer spatial panorering och klickfri gain-rampning i minnet', passed: false, error: err.message });
  }

  // Test 2: Prioriterad Preemptive Floor Control och händelse-emission
  try {
    assert(CHANNEL_PRIORITY.forlikas === 1, 'forlikas har Prio 1');
    assert(CHANNEL_PRIORITY.vanda_om === 2, 'vanda_om har Prio 2');
    assert(CHANNEL_PRIORITY.folja === 3, 'folja har Prio 3');

    const bus = new SwarmEventBus();
    const floor = new FloorController(bus);

    let preemptedEvent: any = null;
    bus.subscribe('swarm.floor.preempted', (env) => {
      preemptedEvent = env.data;
    });

    // Simulera att folja talar
    floor.requestFloor('folja');
    // Forcera att folja har golvet
    (floor as any).currentSpeaker = 'folja';
    assert(floor.getCurrentSpeaker() === 'folja', 'folja ska vara aktiv talare');

    // Forlikas begär ordet -> omedelbar preemption
    let callbackPreempted = false;
    floor.requestFloor(
      'forlikas',
      (preempted, challenger) => {
        if (preempted === 'folja' && challenger === 'forlikas') callbackPreempted = true;
      }
    );

    assert(callbackPreempted, 'FloorController ska köra onPreempt-callback');
    assert(floor.getCurrentSpeaker() === 'forlikas', 'forlikas ska ha tagit över golvet');
    assert(Boolean(preemptedEvent), 'swarm.floor.preempted ska ha publicerats på eventbussen');
    assert(preemptedEvent.preemptedChannel === 'folja', 'Preempted kanal ska vara folja');
    assert(preemptedEvent.byChannel === 'forlikas', 'Utmanande kanal ska vara forlikas');

    results.push({ name: 'Preemptive Floor Control: forlikas (1) avbryter folja (3) med preemption-händelse', passed: true });
  } catch (err: any) {
    results.push({ name: 'Preemptive Floor Control: forlikas (1) avbryter folja (3) med preemption-händelse', passed: false, error: err.message });
  }

  // Test 3: Nativ PCM VAD & Pre-Roll Ringbuffert
  try {
    // Tystnad
    const silence = new Float32Array(160).fill(0.0001);
    const vadSilence = detectSpeechPCM(silence);
    assert(!vadSilence.isSpeech, 'Tystnad ska inte klassas som tal');

    // Tal-liknande signal (sinuston med energi och nollgenomgångar)
    const speech = new Float32Array(160);
    for (let i = 0; i < speech.length; i++) speech[i] = Math.sin(i * 0.2) * 0.5;
    const vadSpeech = detectSpeechPCM(speech);
    assert(vadSpeech.isSpeech, 'Signifikant tonsignal ska klassas som tal');
    assert(vadSpeech.rms > 0.015, 'RMS ska överstiga brusgränsen');

    // Cirkulär Pre-roll buffert (200 ms = 3200 samplingar)
    const preRoll = new AudioPreRollBuffer(3200);
    const chunk1 = new Float32Array(1600).fill(0.1);
    const chunk2 = new Float32Array(1600).fill(0.2);
    preRoll.push(chunk1);
    preRoll.push(chunk2);
    const flushed = preRoll.flush();
    assert(flushed.length === 3200, 'Flush ska returnera fylld pre-roll buffert');
    assert(
      Math.abs(flushed[0] - 0.1) < 0.001 && Math.abs(flushed[1600] - 0.2) < 0.001,
      'Bufferten ska bevara kronologisk ordning'
    );

    results.push({ name: 'Nativ PCM VAD och 200 ms cirkulär Pre-Roll buffert i RAM', passed: true });
  } catch (err: any) {
    results.push({ name: 'Nativ PCM VAD och 200 ms cirkulär Pre-Roll buffert i RAM', passed: false, error: err.message });
  }

  // Test 4: GeminiLiveSession setup, avbrottshantering och unika röster
  try {
    assert(AGENT_VOICE_MAP.folja === 'Puck', 'folja ska ha röst Puck');
    assert(AGENT_VOICE_MAP.forlikas === 'Aoede', 'forlikas ska ha röst Aoede');
    assert(AGENT_VOICE_MAP.vanda_om === 'Charon', 'vanda_om ska ha röst Charon');

    const bus = new SwarmEventBus();
    const session = new GeminiLiveSession('test-api-key', bus);

    // Mockad käll-session för att testa hantering av avbrott
    let thinkingEmitted = false;
    bus.subscribe('swarm.live.audio.thinking', () => { thinkingEmitted = true; });

    session.handleAgentMessage('folja', { serverContent: { interrupted: true } });
    assert(thinkingEmitted, 'Avbrott ska trigga swarm.live.audio.thinking');
    assert(session.getCurrentSpeaker() === null, 'Avbrott ska frigöra golvet');

    results.push({ name: 'GeminiLiveSession multi-agent röster och kraschfri avbrottshantering', passed: true });
  } catch (err: any) {
    results.push({ name: 'GeminiLiveSession multi-agent röster och kraschfri avbrottshantering', passed: false, error: err.message });
  }

  // Test 5: AST- och radgränser (< 250 rader per fil) och inga produktionsmockar
  try {
    const filesToCheck = [
      'src/features/gemini_live_swarm/session/liveAudioPlayback.ts',
      'src/features/gemini_live_swarm/session/sessionIntentAudio.ts',
      'src/features/gemini_live_swarm/session/floorController.ts',
      'src/features/gemini_live_swarm/session/geminiLiveSession.ts',
    ];

    for (const relPath of filesToCheck) {
      const fullPath = path.join(rootDir, relPath);
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n').length;
      assert(lines <= 250, `${relPath} har ${lines} rader (> 250)`);

      const astMetrics = checkAstMetrics(relPath, content);
      assert(astMetrics.valid, astMetrics.error || `${relPath} felade AST-kontroll`);

      const mockCheck = checkNoProductionMocks(relPath, content);
      assert(mockCheck.valid, mockCheck.error || `${relPath} innehåller otillåtna produktionsmockar`);
    }

    results.push({ name: 'AST- och radgränser (< 250 rader) samt noll produktionsmockar respekterade', passed: true });
  } catch (err: any) {
    results.push({ name: 'AST- och radgränser (< 250 rader) samt noll produktionsmockar respekterade', passed: false, error: err.message });
  }

  return results;
}
