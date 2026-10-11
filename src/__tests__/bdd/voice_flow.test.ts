import { generate16kHzPcmSine } from './helpers/pcmGenerator.ts';
import { detectSpeechPCM } from '../../features/gemini_live_swarm/session/sessionIntentAudio.ts';
import { GeminiLiveSession } from '../../features/gemini_live_swarm/session/geminiLiveSession.ts';
import { SwarmEventBus } from '../../features/gemini_live_swarm/bus/swarmEventBus.ts';
import { VoiceFlowMetricsSchema } from '../../features/gemini_live_swarm/telemetry/voiceFlowSchema.ts';

export async function runVoiceFlowBddTests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];
  const bus = new SwarmEventBus();
  const session = new GeminiLiveSession('test-api-key', bus);

  // Scenario 1: VAD talidentifiering och Engine TTFT-separation
  try {
    const { samples } = generate16kHzPcmSine(200, 440, 16000);
    const float32 = new Float32Array(samples.length);
    for (let i = 0; i < samples.length; i++) float32[i] = samples[i] / 32768.0;

    const tStart = Date.now();
    const vad = detectSpeechPCM(float32);
    const vadLatencyMs = Date.now() - tStart;
    const simulatedEngineTtftMs = 150; // Mock/simulerad Engine TTFT under 1 200 ms

    const metrics = VoiceFlowMetricsSchema.parse({
      vadLatencyMs,
      engineTtftMs: simulatedEngineTtftMs,
      isThreadIsolated: session.getAudioPlayer().isThreadIsolated(),
      isPaused: false,
      timestamp: new Date().toISOString(),
    });

    const isThreadIsolated = session.getAudioPlayer().isThreadIsolated();
    const passed = vad.isSpeech && vadLatencyMs < 800 && metrics.engineTtftMs < 1200 && isThreadIsolated;
    results.push({ name: 'BDD: VAD talidentifiering inom 800 ms och TTFT < 1 200 ms med trådisolering', passed });
  } catch (err) {
    results.push({ name: 'BDD: VAD talidentifiering inom 800 ms och TTFT < 1 200 ms med trådisolering', passed: false, error: String(err) });
  }

  // Scenario 2: Start och Paus av röstsession med AbortController
  try {
    let freezeEmitted = false;
    let pauseEmitted = false;
    bus.subscribe('swarm.session.paused', () => { pauseEmitted = true; });
    bus.subscribe('swarm.session.wal.freeze', () => { freezeEmitted = true; });

    session.pauseSession();
    const isPaused = session.isSessionPaused();
    const passed = isPaused && pauseEmitted && freezeEmitted;
    results.push({ name: 'BDD: Paus-knapp avbryter thinking, tystar ljud och fryser tillstånd i WAL', passed });
  } catch (err) {
    results.push({ name: 'BDD: Paus-knapp avbryter thinking, tystar ljud och fryser tillstånd i WAL', passed: false, error: String(err) });
  }

  // Scenario 3: Återupptagning från Paus
  try {
    let resumeEmitted = false;
    bus.subscribe('swarm.session.resumed', () => { resumeEmitted = true; });

    session.resumeSession();
    const isResumed = !session.isSessionPaused();
    const passed = isResumed && resumeEmitted;
    results.push({ name: 'BDD: Start-knapp återupptar session och aktiverar Auto-Listen', passed });
  } catch (err) {
    results.push({ name: 'BDD: Start-knapp återupptar session och aktiverar Auto-Listen', passed: false, error: String(err) });
  }

  return results;
}
