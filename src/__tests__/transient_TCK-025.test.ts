import { runVoiceFlowBddTests } from './bdd/voice_flow.test.ts';
import {
  DSPRingBufferMixer,
  SharedRingBuffer,
  LiveAudioPlayer,
} from '../features/gemini_live_swarm/session/liveAudioPlayback.ts';
import {
  VoiceFlowMetricsSchema,
  measureVoiceFlow,
} from '../features/gemini_live_swarm/telemetry/voiceFlowSchema.ts';
import { getStartPauseProps } from '../features/gemini_live_swarm/ui/splitPaneHelper.ts';
import { GeminiLiveSession } from '../features/gemini_live_swarm/session/geminiLiveSession.ts';
import { SwarmEventBus } from '../features/gemini_live_swarm/bus/swarmEventBus.ts';

export async function runTransientTCK025Tests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  // Test 1: BDD-ytterloop scenarier från doc/features/voice_flow.feature
  try {
    const bddResults = await runVoiceFlowBddTests();
    const allPassed = bddResults.length > 0 && bddResults.every((r) => r.passed);
    results.push({ name: 'TCK-025: Samtliga BDD-scenarier från voice_flow.feature godkända', passed: allPassed });
  } catch (err) {
    results.push({ name: 'TCK-025: Samtliga BDD-scenarier från voice_flow.feature godkända', passed: false, error: String(err) });
  }

  // Test 2: Trådisolering via SharedRingBuffer och DSPRingBufferMixer
  try {
    const ring = new SharedRingBuffer(24000);
    const testSamples = new Int16Array([100, 200, 300, 400]);
    ring.push(testSamples);
    const mixer = new DSPRingBufferMixer();
    const isIsolated = mixer.isThreadIsolated();
    const workerMgr = mixer.getWorkerManager();
    const passed = isIsolated && Boolean(workerMgr);
    results.push({ name: 'TCK-025: Trådisolerad ljudbuffert och AudioWorkerManager aktiverad', passed });
    mixer.dispose();
  } catch (err) {
    results.push({ name: 'TCK-025: Trådisolerad ljudbuffert och AudioWorkerManager aktiverad', passed: false, error: String(err) });
  }

  // Test 3: VoiceFlowMetricsSchema och deterministisk VAD / TTFT gräns
  try {
    const validMetrics = measureVoiceFlow(750, 1150, true);
    let parseFailed = false;
    try {
      VoiceFlowMetricsSchema.parse({ vadLatencyMs: 850, engineTtftMs: 1100, isThreadIsolated: true });
    } catch {
      parseFailed = true;
    }
    const passed = validMetrics.vadLatencyMs <= 800 && validMetrics.engineTtftMs <= 1200 && parseFailed;
    results.push({ name: 'TCK-025: VoiceFlowMetricsSchema validerar VAD < 800 ms och TTFT < 1 200 ms', passed });
  } catch (err) {
    results.push({ name: 'TCK-025: VoiceFlowMetricsSchema validerar VAD < 800 ms och TTFT < 1 200 ms', passed: false, error: String(err) });
  }

  // Test 4: UI Start/Paus-brytare egenskaper och synkronisering
  try {
    const runningProps = getStartPauseProps(false);
    const pausedProps = getStartPauseProps(true);
    const passed = runningProps.label === 'Paus' && pausedProps.label === 'Start' && runningProps.icon === '⏸️' && pausedProps.icon === '▶️';
    results.push({ name: 'TCK-025: UI Start/Paus-brytare synkad med korrekt ikon och status', passed });
  } catch (err) {
    results.push({ name: 'TCK-025: UI Start/Paus-brytare synkad med korrekt ikon och status', passed: false, error: String(err) });
  }

  // Test 5: AbortController och session pause/resume cykel
  try {
    const bus = new SwarmEventBus();
    const session = new GeminiLiveSession('test-key', bus);
    session.pauseSession();
    const isPaused = session.isSessionPaused();
    session.resumeSession();
    const isResumed = !session.isSessionPaused();
    const passed = isPaused && isResumed;
    results.push({ name: 'TCK-025: GeminiLiveSession hanterar paus, återupptagning och AbortController', passed });
  } catch (err) {
    results.push({ name: 'TCK-025: GeminiLiveSession hanterar paus, återupptagning och AbortController', passed: false, error: String(err) });
  }

  return results;
}
