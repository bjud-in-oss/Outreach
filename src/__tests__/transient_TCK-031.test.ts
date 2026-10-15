import { SwarmEventBus } from '../features/gemini_live_swarm/bus/swarmEventBus.ts';
import { PendulumStore } from '../features/gemini_live_swarm/session/pendulumStore.ts';
import { extractTurnEventData } from '../features/gemini_live_swarm/ui/turnContainerHelper.ts';

export async function runTransientTCK031Tests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  // Scenario 1: Negativ Telemetrifiltrering i Tursfären (90% WAL Replay)
  try {
    const noisyEvents = [
      { type: 'WATCHDOG_TIMEOUT', data: { reason: 'WATCHDOG_TIMEOUT', timestamp: '2026-10-15T00:00:00Z' } },
      { type: 'USER_COMMIT', data: { clientMessageId: 'msg-1', reason: 'USER_COMMIT', text: 'internt' } },
      { type: 'PENDULUM_STATE_CHANGED', data: { mode: 'TALK', reason: 'USER_COMMIT' } },
      { type: 'UI_STATE_CHANGED', data: { element: 'hesitation_indicator', active: true } },
      { type: 'SWARM_TRANSCRIPT_MATCH', data: { pattern: '.*', reason: 'match' } },
      { type: 'MUTEX_TOGGLED', data: { mode: 'LIVE_ACTIVE' } },
    ];

    let leakDetected = false;
    for (const evt of noisyEvents) {
      const extracted = extractTurnEventData(evt.data, evt.type);
      if (extracted.text !== '') {
        leakDetected = true;
        break;
      }
    }

    // Positiv kontroll: Faktiskt meddelande ska inte filtreras bort
    const genuineAssistant = extractTurnEventData(
      { delta: 'Guds frid, hur kan jag bistå dig idag?', sourceRole: 'assistant' },
      'swarm.session.text_delta'
    );
    const genuineUser = extractTurnEventData(
      { textChunk: 'Jag vill ha hjälp att skriva ett brev.', sourceRole: 'user' },
      'swarm.live.stream.text'
    );

    const genuineValid = genuineAssistant.text.length > 0 && genuineUser.text.length > 0;

    results.push({
      name: 'TCK-031 Scenario 1: Negativ Telemetrifiltrering i Tursfären - Systembrus filtreras bort, genuin dialog släpps fram',
      passed: !leakDetected && genuineValid,
      error: leakDetected ? 'Systemtelemetri läckte in som text i tursfären' : undefined,
    });
  } catch (err) {
    results.push({
      name: 'TCK-031 Scenario 1: Negativ Telemetrifiltrering',
      passed: false,
      error: String(err),
    });
  }

  // Scenario 2: Frigörande av Audio-Mutex och Pendel vid Watchdog
  try {
    const bus = new SwarmEventBus();
    const vadTracker = { paused: true };
    const pendulum = new PendulumStore(bus, {
      onVadStateChange: (paused) => {
        vadTracker.paused = paused;
      },
    });

    pendulum.setMode('TALK', 'USER_COMMIT');
    const startInTalk = pendulum.getMode() === 'TALK' && vadTracker.paused === true;

    // Emitterar WATCHDOG_TIMEOUT över bussen
    bus.emit('WATCHDOG_TIMEOUT', { timestamp: new Date().toISOString() });

    const returnedToListen = pendulum.getMode() === 'LISTEN';
    const vadReleased = vadTracker.paused === false;

    pendulum.dispose();

    results.push({
      name: 'TCK-031 Scenario 2: Frigörande av Audio-Mutex och Pendel vid Watchdog - VAD återaktiveras omedelbart',
      passed: startInTalk && returnedToListen && vadReleased,
      error: !returnedToListen ? 'Pendeln återgick inte till LISTEN vid WATCHDOG_TIMEOUT' : undefined,
    });
  } catch (err) {
    results.push({
      name: 'TCK-031 Scenario 2: Frigörande av Audio-Mutex',
      passed: false,
      error: String(err),
    });
  }

  return results;
}
