import fs from 'node:fs';
import path from 'node:path';
import { checkAstMetrics, checkNoProductionMocks } from '../../scripts/drivers/ts.js';
import {
  detectSpeechPCM,
  AudioPreRollBuffer,
  SessionIntentManager,
  floatTo16BitPCM,
} from '../features/gemini_live_swarm/index.ts';
import { SwarmEventBus } from '../features/gemini_live_swarm/bus/swarmEventBus.ts';

export async function runTransientTCK022cTests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];
  const rootDir = process.cwd();

  function assert(condition: boolean, msg: string) {
    if (!condition) throw new Error(msg);
  }

  // Test 1: VAD ZCR-mjukgörande (djupa vokaler och låg ZCR med hög RMS detekteras som tal)
  try {
    // Skapa en lågfrekvent signal (t.ex. djup mansröst/vokal, få nollgenomgångar, hög RMS)
    const N = 1600; // 100 ms vid 16kHz
    const deepVowelSamples = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      // 50 Hz sinus ger få nollgenomgångar vid 16kHz: ca 5 perioder => 10 nollgenomgångar över 1600 samples => ZCR ~ 0.00625
      deepVowelSamples[i] = Math.sin((2 * Math.PI * 50 * i) / 16000) * 0.05; // RMS ~ 0.035
    }

    const result = detectSpeechPCM(deepVowelSamples, 0.015, 0.05);
    assert(result.rms > 0.015 * 1.5, `RMS borde vara över 1.5x tröskeln (fick ${result.rms})`);
    assert(result.zcr < 0.05, `ZCR borde vara låg för 50Hz (fick ${result.zcr})`);
    assert(result.isSpeech === true, 'Djup vokal med låg ZCR men hög RMS ska klassas som tal (isSpeech === true)');

    // Kontrollera att svagt brus med låg RMS och låg ZCR INTE klassas som tal
    const quietNoise = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      quietNoise[i] = (Math.random() - 0.5) * 0.005; // RMS ~ 0.0014
    }
    const quietResult = detectSpeechPCM(quietNoise, 0.015, 0.05);
    assert(quietResult.isSpeech === false, 'Svagt brus ska klassas som icke-tal (isSpeech === false)');

    results.push({ name: 'VAD ZCR-mjukgörande för djupa vokaler och volym-prioritering', passed: true });
  } catch (err: any) {
    results.push({ name: 'VAD ZCR-mjukgörande för djupa vokaler och volym-prioritering', passed: false, error: err.message });
  }

  // Test 2: Kontinuerlig mikrofon- och PCM-strömning oberoende av activeIntent
  try {
    const bus = new SwarmEventBus();
    const manager = new SessionIntentManager(bus);

    assert(manager.getActiveIntent() === null, 'Initiering ska ha activeIntent === null');

    let receivedAudioEvent: any = null;
    bus.subscribe('swarm.live.stream.audio', (event) => {
      receivedAudioEvent = event;
    });

    // Simulera röstpaket via processIncomingChunk
    const speechChunk = new Float32Array(1600);
    for (let i = 0; i < 1600; i++) {
      speechChunk[i] = Math.sin((2 * Math.PI * 300 * i) / 16000) * 0.08;
    }

    manager.processIncomingChunk(speechChunk);

    assert(receivedAudioEvent !== null, 'Audio event ska emitteras även när activeIntent är null');
    assert(receivedAudioEvent.data?.hasAudio === true, 'Händelsen ska markera hasAudio === true');
    assert(typeof receivedAudioEvent.data?.audioChunkBase64 === 'string', 'Base64 PCM-data ska inkluderas i händelsen');
    assert(receivedAudioEvent.data?.audioChunkBase64.length > 0, 'Base64 PCM-strängen får inte vara tom');

    manager.dispose();
    results.push({ name: 'Kontinuerlig mikrofon-strömning oberoende av UI activeIntent', passed: true });
  } catch (err: any) {
    results.push({ name: 'Kontinuerlig mikrofon-strömning oberoende av UI activeIntent', passed: false, error: err.message });
  }

  // Test 3: AST-kvalitet, radantal och noll produktion-mockar
  try {
    const relPath = 'src/features/gemini_live_swarm/session/sessionIntentAudio.ts';
    const fullPath = path.join(rootDir, relPath);
    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n').length;
    assert(lines <= 250, `${relPath} har ${lines} rader (> 250)`);

    const astMetrics = checkAstMetrics(relPath, content);
    assert(astMetrics.valid, astMetrics.error || `${relPath} felade AST-kontroll`);

    const mockCheck = checkNoProductionMocks(relPath, content);
    assert(mockCheck.valid, mockCheck.error || `${relPath} innehåller otillåtna produktionsmockar`);

    results.push({ name: 'AST- och mock-regler för sessionIntentAudio.ts efter ZCR-mjukgörande', passed: true });
  } catch (err: any) {
    results.push({ name: 'AST- och mock-regler för sessionIntentAudio.ts efter ZCR-mjukgörande', passed: false, error: err.message });
  }

  return results;
}
