import { SwarmEventBus } from '../features/gemini_live_swarm/bus/swarmEventBus.ts';
import { GeminiLiveSession } from '../features/gemini_live_swarm/session/geminiLiveSession.ts';
import { PendulumStore } from '../features/gemini_live_swarm/session/pendulumStore.ts';
import { handleIncomingTranscript } from '../features/gemini_live_swarm/session/turnBoundaryDetector.ts';
import { initSwarmCoreInstances } from '../features/gemini_live_swarm/context/swarmContextHelper.ts';

export async function runTransientTCK030aTests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  // Scenario 1: Runtime-injackning och Telemetri
  try {
    const bus = new SwarmEventBus();
    const core = initSwarmCoreInstances({ eventBus: bus });

    const hasPendulum = Boolean(core.pendulum);
    const hasTelemetry = Boolean(core.telemetry);

    bus.emit('UI_STATE_CHANGED', { element: 'test_toggle', active: true });
    bus.emit('MUTEX_TOGGLED', { mode: 'LIVE_ACTIVE' });

    const entries = core.telemetry.getEntries();
    const capturedUi = entries.some((e) => e.type === 'UI_STATE_CHANGED');
    const capturedMutex = entries.some((e) => e.type === 'MUTEX_TOGGLED');

    core.pendulum.dispose();
    core.telemetry.dispose();

    results.push({
      name: 'TCK-030a Scenario 1: Runtime-injackning och Telemetri - SwarmContext instansierar och samlar telemetri',
      passed: hasPendulum && hasTelemetry && capturedUi && capturedMutex,
    });
  } catch (err) {
    results.push({
      name: 'TCK-030a Scenario 1: Runtime-injackning',
      passed: false,
      error: String(err),
    });
  }

  // Scenario 2: Vaket Svar på Överlämning (TurnComplete över Bidi)
  try {
    const bus = new SwarmEventBus();
    const session = new GeminiLiveSession('test-api-key', bus);
    const pendulum = new PendulumStore(bus);

    let sentTurnComplete = false;
    let turnCompletePayload: any = null;

    (session as any).activeSdkSession = {
      sendRealtimeInput: (payload: any) => {
        if (!payload?.realtimeInput?.turnComplete) return;
        sentTurnComplete = true;
        turnCompletePayload = payload;
      },
    };

    let turnCompleteEventEmitted = false;
    bus.subscribe('swarm.live.turn.complete', () => {
      turnCompleteEventEmitted = true;
    });

    // Användaren klickar på [ ➔ ] (USER_COMMIT)
    bus.emit('USER_COMMIT', {
      clientMessageId: 'commit-user-turn-123',
      text: 'Kan du sammanfatta läget?',
      timestamp: new Date().toISOString(),
    });

    await new Promise((resolve) => setTimeout(resolve, 15));

    const pendulumIsTalk = pendulum.getMode() === 'TALK';
    const firstCommitSuccess = sentTurnComplete && turnCompleteEventEmitted && pendulumIsTalk;

    // Testa även semantisk fråga som triggar TALK
    sentTurnComplete = false;
    pendulum.setMode('LISTEN', 'MANUAL');
    handleIncomingTranscript({ text: 'Hur kan vi försonas med detta problem?', isFinal: true }, pendulum);

    await new Promise((resolve) => setTimeout(resolve, 15));

    const secondCommitSuccess = sentTurnComplete && pendulum.getMode() === 'TALK';

    pendulum.dispose();
    session.disconnectLive();

    results.push({
      name: 'TCK-030a Scenario 2: Vaket Svar på Överlämning - TALK-övergång anropar omedelbart Bidi turnComplete',
      passed: firstCommitSuccess && secondCommitSuccess,
    });
  } catch (err) {
    results.push({
      name: 'TCK-030a Scenario 2: Bidi TurnComplete överlämning',
      passed: false,
      error: String(err),
    });
  }

  return results;
}
