import fs from 'node:fs';
import { SwarmEventBus } from '../features/gemini_live_swarm/bus/swarmEventBus.ts';
import { PendulumStore } from '../features/gemini_live_swarm/session/pendulumStore.ts';
import { handleIncomingTranscript } from '../features/gemini_live_swarm/session/turnBoundaryDetector.ts';
import { WalUiTelemetryListener } from '../features/wal_logger/walUiTelemetry.ts';
import { TransientRingBuffer } from '../features/wal_logger/engine/transientRingBuffer.ts';

export async function runTransientTCK029Tests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  // Scenario 1: Tålamod vid osäkerhet (Att hålla 2 perspektiv varma)
  try {
    const bus = new SwarmEventBus();
    const pendulum = new PendulumStore(bus);
    const telemetry = new WalUiTelemetryListener(bus, 5);

    // Initialt läge är LISTEN
    const initialListen = pendulum.getMode() === 'LISTEN';

    // Användaren tvekar: togglar snabbt mute/unmute 3 gånger och skickar partiella transkript (stress)
    bus.emit('MUTEX_TOGGLED', { mode: 'MUTED', reason: 'user_hesitation_1' });
    bus.emit('MUTEX_TOGGLED', { mode: 'LIVE_ACTIVE', reason: 'user_hesitation_2' });
    bus.emit('MUTEX_TOGGLED', { mode: 'MUTED', reason: 'user_hesitation_3' });
    bus.emit('MUTEX_TOGGLED', { mode: 'LIVE_ACTIVE', reason: 'user_hesitation_4' });

    // Partiella yttranden (ska inte störa pendeln)
    handleIncomingTranscript({ text: 'Jag vet inte riktigt...', isFinal: false }, pendulum);
    bus.emit('swarm.session.text_delta', { text: 'Jag vet inte riktigt...', isFinal: false, sourceRole: 'user' });

    // Ytterligare 2 händelser för att testa överskridning (mer än 5 totalt)
    bus.emit('UI_STATE_CHANGED', { element: 'hesitation_indicator', active: true });
    bus.emit('UI_STATE_CHANGED', { element: 'hesitation_indicator', active: false });

    // Verifiera att pendeln fortfarande är i LISTEN (tålamod, avbryter inte)
    const remainsListen = pendulum.getMode() === 'LISTEN';

    // Verifiera att bufferten rymmer exakt max 5 händelser (FIFO-rullning)
    const bufferCount = telemetry.getEntries().length;
    const capacityRespected = bufferCount === 5;

    results.push({
      name: 'TCK-029 Scenario 1: Tålamod vid osäkerhet - pendeln kvar i LISTEN och buffert max 5 händelser',
      passed: initialListen && remainsListen && capacityRespected,
    });

    telemetry.dispose();
    pendulum.dispose();
  } catch (err) {
    results.push({
      name: 'TCK-029 Scenario 1: Tålamod vid osäkerhet',
      passed: false,
      error: String(err),
    });
  }

  // Scenario 2: Ren start vid försoning (Att vända om)
  try {
    const bus = new SwarmEventBus();
    const telemetry = new WalUiTelemetryListener(bus, 5);

    // Fyll bufferten med 5 händelser
    for (let i = 1; i <= 5; i++) {
      bus.emit('UI_STATE_CHANGED', { step: i, stressLevel: 'high' });
    }
    const fullBefore = telemetry.getEntries().length === 5;

    // Användaren ber om tidsresa / försoning: klick på [ ↩ Restore ]
    bus.emit('UI_STATE_CHANGED', { element: 'wal_restore', action: 'restore', timestamp: new Date().toISOString() });

    // Verifiera att bufferten omedelbart spolades till 0
    const emptyAfter = telemetry.getEntries().length === 0;

    // Testa även direkt anrop mot flush på TransientRingBuffer
    const directBuffer = new TransientRingBuffer(5);
    directBuffer.push({ id: '1', type: 'TEST', timestamp: new Date().toISOString(), data: {} });
    directBuffer.flush();
    const directFlushed = directBuffer.size() === 0;

    results.push({
      name: 'TCK-029 Scenario 2: Ren start vid försoning - Restore tömmer skoningslöst bufferten till 0',
      passed: fullBefore && emptyAfter && directFlushed,
    });

    telemetry.dispose();
  } catch (err) {
    results.push({
      name: 'TCK-029 Scenario 2: Ren start vid försoning',
      passed: false,
      error: String(err),
    });
  }

  // Scenario 3: Aktivt lyssnande på hjälpbehov (Följa sonen)
  try {
    const bus = new SwarmEventBus();
    const telemetry = new WalUiTelemetryListener(bus, 5);

    // Sänd ljudström för att registrera 3s PCM-referens
    bus.emit('swarm.live.stream.audio', { byteLength: 96000, mimeType: 'audio/pcm;rate=16000' });

    // Användaren byter till Djup Reflektion (SESSION_CONFIG_UPDATED)
    bus.emit('SESSION_CONFIG_UPDATED', {
      mode: 'makro',
      thinkingConfig: { thinkingLevel: 'high', depth: 'deep' },
    });

    const entries = telemetry.getEntries();
    const lastEntry = entries[entries.length - 1];

    const capturedConfig =
      lastEntry?.type === 'SESSION_CONFIG_UPDATED' &&
      lastEntry?.data?.mode === 'makro' &&
      lastEntry?.pcmAudioRef?.hasAudio === true &&
      lastEntry?.pcmAudioRef?.durationMs === 3000;

    // Verifiera att kraschdump fungerar och kan skrivas
    const dumpPath = telemetry.writeCrashDump();
    const dumpFileExists = fs.existsSync(dumpPath);
    const dumpContent = dumpFileExists ? JSON.parse(fs.readFileSync(dumpPath, 'utf8')) : null;
    const dumpValid = dumpContent && dumpContent.capacity === 5;

    results.push({
      name: 'TCK-029 Scenario 3: Aktivt lyssnande på hjälpbehov - fångar konfigurationsskifte och 3s PCM-ljud',
      passed: Boolean(capturedConfig) && Boolean(dumpValid),
    });

    telemetry.dispose();
  } catch (err) {
    results.push({
      name: 'TCK-029 Scenario 3: Aktivt lyssnande på hjälpbehov',
      passed: false,
      error: String(err),
    });
  }

  return results;
}
