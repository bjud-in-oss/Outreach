import { runUnifiedChatInputBddTests } from './bdd/unified_chat_input.test.ts';
import { getDividerContainerClass } from '../features/gemini_live_swarm/ui/splitPaneHelper.ts';
import { getLiveButtonProps, handleModeSelect } from '../features/gemini_live_swarm/ui/promptBarHelper.ts';
import { GeminiLiveSession } from '../features/gemini_live_swarm/session/geminiLiveSession.ts';
import { SwarmEventBus } from '../features/gemini_live_swarm/bus/swarmEventBus.ts';

export async function runTransientTCK026Tests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  // Test 1: BDD-scenarier från unified_chat_input.feature
  try {
    const bddRes = await runUnifiedChatInputBddTests();
    const passed = bddRes.length === 5 && bddRes.every((r) => r.passed);
    results.push({ name: 'TCK-026: Samtliga 5 BDD-scenarier från unified_chat_input.feature godkända', passed });
  } catch (err) {
    results.push({ name: 'TCK-026: Samtliga 5 BDD-scenarier från unified_chat_input.feature godkända', passed: false, error: String(err) });
  }

  // Test 2: Ultra-tunn mittdelare (< 4px, 3px) utan mekaniska pilar
  try {
    const clsPortrait = getDividerContainerClass(true);
    const clsLandscape = getDividerContainerClass(false);
    const isThin = clsPortrait.includes('h-[3px]') && clsLandscape.includes('w-[3px]');
    const noArrows = !clsPortrait.includes('px-3') && !clsLandscape.includes('w-14');
    const passed = isThin && noArrows;
    results.push({ name: 'TCK-026: Ultra-tunn mittdelare (3px) utan mekaniska pilknappar', passed });
  } catch (err) {
    results.push({ name: 'TCK-026: Ultra-tunn mittdelare (3px) utan mekaniska pilknappar', passed: false, error: String(err) });
  }

  // Test 3: Prompt-bar Live-knapp egenskaper för passiv, aktiv och pausad
  try {
    const disconnectedProps = getLiveButtonProps(false, false);
    const connectedActiveProps = getLiveButtonProps(true, false);
    const connectedPausedProps = getLiveButtonProps(true, true);
    const passed =
      disconnectedProps.label === 'Starta Live' &&
      connectedActiveProps.label === 'Aktiv/Paus' &&
      connectedPausedProps.label === 'Start';
    results.push({ name: 'TCK-026: Live-knapp statusövergångar (Starta Live -> Aktiv/Paus -> Start)', passed });
  } catch (err) {
    results.push({ name: 'TCK-026: Live-knapp statusövergångar (Starta Live -> Aktiv/Paus -> Start)', passed: false, error: String(err) });
  }

  // Test 4: Kompakt dropdown reflektionsläges-växling och eventutsändning
  try {
    const bus = new SwarmEventBus();
    let emitted = '';
    bus.subscribe('UI_REFLECTION_MODE_CHANGED', (env) => {
      emitted = (env.data as any)?.mode;
    });
    const parsed = handleModeSelect('meta', bus);
    const passed = parsed === 'meta' && emitted === 'meta';
    results.push({ name: 'TCK-026: Reflektionsdropdown uppdaterar tillstånd och sänder event', passed });
  } catch (err) {
    results.push({ name: 'TCK-026: Reflektionsdropdown uppdaterar tillstånd och sänder event', passed: false, error: String(err) });
  }

  // Test 5: GeminiLiveSession start/stop och passiv grundstatus
  try {
    const bus = new SwarmEventBus();
    const session = new GeminiLiveSession('test-api-key', bus);
    const isPassive = !session.isLiveConnected();
    const hasMethods = typeof session.start === 'function' && typeof session.stop === 'function';
    const passed = isPassive && hasMethods;
    results.push({ name: 'TCK-026: GeminiLiveSession passiv vid start med start()/stop() metoder', passed });
  } catch (err) {
    results.push({ name: 'TCK-026: GeminiLiveSession passiv vid start med start()/stop() metoder', passed: false, error: String(err) });
  }

  return results;
}
