import { SwarmEventBus } from '../features/gemini_live_swarm/bus/swarmEventBus.ts';
import { PendulumStore } from '../features/gemini_live_swarm/session/pendulumStore.ts';
import {
  analyzeTurnBoundary,
  handleIncomingTranscript,
} from '../features/gemini_live_swarm/session/turnBoundaryDetector.ts';

export async function runTransientTCK028Tests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  // Test 1: Partiella deltan (isFinal: false) lämnar pendeln kvar i LISTEN
  try {
    const bus = new SwarmEventBus();
    const store = new PendulumStore(bus);

    const partialInput = {
      text: 'Vad tror du om detta',
      isFinal: false,
    };

    const res = handleIncomingTranscript(partialInput, store);

    const modeRemainsListen = store.getMode() === 'LISTEN';
    const isIgnored = res.reason === 'PARTIAL_IGNORED' && res.shouldTransition === false;

    results.push({
      name: 'TCK-028 Test 1: Partiella deltan (isFinal: false) lämnar pendeln kvar i LISTEN',
      passed: modeRemainsListen && isIgnored,
    });
    store.dispose();
  } catch (err) {
    results.push({
      name: 'TCK-028 Test 1: Partiella deltan',
      passed: false,
      error: String(err),
    });
  }

  // Test 2: Slutgiltigt transkript (isFinal: true) med avslutande fråga ställer om pendeln till TALK
  try {
    const vadTracker = { paused: false };
    const bus = new SwarmEventBus();
    const store = new PendulumStore(bus, {
      onVadStateChange: (paused) => {
        vadTracker.paused = paused;
      },
    });

    const finalQuestionInput = {
      text: 'Hur kan vi försonas med detta problem?',
      isFinal: true,
    };

    const res = handleIncomingTranscript(finalQuestionInput, store);

    const modeIsTalk = store.getMode() === 'TALK';
    const transitioned = res.shouldTransition === true && res.isQuestion === true;
    const vadMuted = vadTracker.paused === true;

    results.push({
      name: 'TCK-028 Test 2: Slutgiltigt transkript (isFinal: true) med fråga ställer om pendeln till TALK och pausar VAD',
      passed: modeIsTalk && transitioned && vadMuted,
    });
    store.dispose();
  } catch (err) {
    results.push({
      name: 'TCK-028 Test 2: Slutgiltigt transkript',
      passed: false,
      error: String(err),
    });
  }

  // Test 3: Tryck på [ ➔ ] tvingar omedelbart över pendeln till TALK
  try {
    const bus = new SwarmEventBus();
    const store = new PendulumStore(bus);

    // Initial state är LISTEN
    const initialListen = store.getMode() === 'LISTEN';

    // Simulera klick på [ ➔ ] som emitterar USER_COMMIT med clientMessageId
    bus.emit('USER_COMMIT', {
      clientMessageId: 'msg-commit-12345',
      text: 'Här är mitt skickade meddelande',
      timestamp: new Date().toISOString(),
    });

    const modeAfterCommit = store.getMode() === 'TALK';

    results.push({
      name: 'TCK-028 Test 3: Tryck på [ ➔ ] (USER_COMMIT med clientMessageId) tvingar omedelbart pendeln till TALK',
      passed: initialListen && modeAfterCommit,
    });
    store.dispose();
  } catch (err) {
    results.push({
      name: 'TCK-028 Test 3: Manuell commit [ ➔ ]',
      passed: false,
      error: String(err),
    });
  }

  // Test 4: Watchdog Auto-Fallback återställer från TALK till LISTEN vid timeout
  try {
    const fallbackTracker = { paused: true };
    const bus = new SwarmEventBus();
    // Använd kort watchdogTimeoutMs för blixtsnabb testkörning (< 50ms)
    const store = new PendulumStore(bus, {
      watchdogTimeoutMs: 35,
      onVadStateChange: (paused) => {
        fallbackTracker.paused = paused;
      },
    });

    store.setMode('TALK', 'TEST_TRIGGER');
    const wasTalk = store.getMode() === 'TALK';

    // Vänta ut timern
    await new Promise((resolve) => setTimeout(resolve, 50));

    const restoredToListen = store.getMode() === 'LISTEN';
    const vadResumed = fallbackTracker.paused === false;

    // Testa även manuellt anrop mot handleWatchdogTimeout
    store.setMode('TALK', 'TEST_TRIGGER_2');
    store.handleWatchdogTimeout();
    const directFallback = store.getMode() === 'LISTEN';

    results.push({
      name: 'TCK-028 Test 4 (Watchdog): Timeout utan Bidi-svar återställer deterministiskt pendeln till LISTEN',
      passed: wasTalk && restoredToListen && vadResumed && directFallback,
    });
    store.dispose();
  } catch (err) {
    results.push({
      name: 'TCK-028 Test 4: Watchdog fallback',
      passed: false,
      error: String(err),
    });
  }

  return results;
}
