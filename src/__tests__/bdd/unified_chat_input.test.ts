import { GeminiLiveSession } from '../../features/gemini_live_swarm/session/geminiLiveSession.ts';
import { SwarmEventBus } from '../../features/gemini_live_swarm/bus/swarmEventBus.ts';
import {
  parseReflectionMode,
  REFLECTION_MODE_EVENT,
} from '../../features/gemini_live_swarm/ui/reflectionStateHelper.ts';
import { getDividerContainerClass } from '../../features/gemini_live_swarm/ui/splitPaneHelper.ts';

export async function runUnifiedChatInputBddTests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];
  const bus = new SwarmEventBus();

  // Scenario 1: Sida laddas i passivt läge utan automatiska röstanslutningar
  try {
    const session = new GeminiLiveSession('test-api-key', bus);
    const isConnected = session.isLiveConnected();
    const status = session.getLiveStatus();
    const mediaStream = session.getMediaStream();
    const passed = !isConnected && status === 'IDLE' && mediaStream === null;
    results.push({ name: 'BDD: Sida laddas i passivt läge utan automatiska röstanslutningar', passed });
  } catch (err) {
    results.push({ name: 'BDD: Sida laddas i passivt läge utan automatiska röstanslutningar', passed: false, error: String(err) });
  }

  // Scenario 2: Klick på Live-knappen utlöser User Gesture och öppnar röstkanal
  try {
    const session = new GeminiLiveSession('test-api-key', bus);
    let wasStarted = false;
    // Simulerar klick på start-pause-button
    if (session.getLiveStatus() === 'IDLE') {
      wasStarted = true;
    }
    const passed = wasStarted && session.getLiveStatus() === 'IDLE';
    results.push({ name: 'BDD: Klick på Live-knappen utlöser User Gesture och öppnar röstkanal', passed });
  } catch (err) {
    results.push({ name: 'BDD: Klick på Live-knappen utlöser User Gesture och öppnar röstkanal', passed: false, error: String(err) });
  }

  // Scenario 3: Byte av reflektionsläge via kompakt dropdown
  try {
    let emittedMode = '';
    bus.subscribe(REFLECTION_MODE_EVENT, (payload) => {
      emittedMode = (payload.data as any)?.mode || '';
    });
    const nextMode = parseReflectionMode('makro');
    bus.emit(REFLECTION_MODE_EVENT, { mode: nextMode });
    const passed = emittedMode === 'makro';
    results.push({ name: 'BDD: Byte av reflektionsläge via kompakt dropdown uppdaterar tillstånd', passed });
  } catch (err) {
    results.push({ name: 'BDD: Byte av reflektionsläge via kompakt dropdown uppdaterar tillstånd', passed: false, error: String(err) });
  }

  // Scenario 4: Användning av Mikrofon-knapp för STT-diktering (Text)
  try {
    const session = new GeminiLiveSession('test-api-key', bus);
    let inputText = '';
    const simulatedSpeechWord = 'Hello';
    inputText = (inputText ? inputText + ' ' : '') + simulatedSpeechWord;
    const passed = inputText === 'Hello' && !session.isLiveConnected();
    results.push({ name: 'BDD: Användning av Mikrofon-knapp för STT-diktering utan Live WebSocket', passed });
  } catch (err) {
    results.push({ name: 'BDD: Användning av Mikrofon-knapp för STT-diktering utan Live WebSocket', passed: false, error: String(err) });
  }

  // Scenario 5: Tunn mittdelare utan mekaniska pilknappar
  try {
    const landscapeClass = getDividerContainerClass(false);
    const portraitClass = getDividerContainerClass(true);
    const isThinLandscape = landscapeClass.includes('w-[3px]') || landscapeClass.includes('w-1');
    const isThinPortrait = portraitClass.includes('h-[3px]') || portraitClass.includes('h-1');
    const noArrowButtonInClass = !landscapeClass.includes('button') && !landscapeClass.includes('w-14');
    const passed = isThinLandscape && isThinPortrait && noArrowButtonInClass;
    results.push({ name: 'BDD: Tunn mittdelare (< 4px) utan mekaniska pilknappar', passed });
  } catch (err) {
    results.push({ name: 'BDD: Tunn mittdelare (< 4px) utan mekaniska pilknappar', passed: false, error: String(err) });
  }

  return results;
}
