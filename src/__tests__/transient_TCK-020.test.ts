import fs from 'node:fs';
import path from 'node:path';
import { checkAstMetrics, checkNoProductionMocks } from '../../scripts/drivers/ts.js';
import { SwarmEventBus } from '../features/gemini_live_swarm/bus/swarmEventBus.ts';
import { GeminiLiveSession } from '../features/gemini_live_swarm/session/geminiLiveSession.ts';
import {
  createBidiSetupPayload,
  floatTo16BitPCM,
  SessionIntentManager,
} from '../features/gemini_live_swarm/session/sessionIntentAudio.ts';
import {
  computeSplitArrows,
  stepSnapState,
  handleKeyboardNavigation,
  handleSwipeGesture,
  clampSnapState,
} from '../features/gemini_live_swarm/ui/splitPaneHelper.ts';
import { resolveCrownFromEnvelope, CrownState } from '../features/gemini_live_swarm/ui/crownStateHelper.ts';

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

export async function runTransientTCK020Tests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];
  const rootDir = process.cwd();

  // Test 1: Skarp Audio Handskakning, PCM16 Piping & Talking/Thinking Events (TCK-020b)
  try {
    const bus = new SwarmEventBus();
    const setup = createBidiSetupPayload('Kompass för närhet');
    assert(setup.setup.model === 'models/gemini-3.8-live', 'Setup-modell ska vara gemini-3.8-live');
    assert(setup.setup.generationConfig.responseModalities.includes('audio'), 'Modalitet audio ska vara vald');
    assert(setup.setup.systemInstruction.parts[0].text === 'Kompass för närhet', 'Systeminstruktion ska sättas i setup');

    const floatSamples = new Float32Array([0.0, 0.5, -0.5, 1.0, -1.0]);
    const pcmSamples = floatTo16BitPCM(floatSamples);
    assert(pcmSamples.length === 5, 'PCM längd ska matcha input');
    assert(pcmSamples[0] === 0, 'Noll ska ge 0');
    assert(pcmSamples[1] > 16000 && pcmSamples[1] < 16500, '0.5 ska skala till ~16383');
    assert(pcmSamples[2] < -16000 && pcmSamples[2] > -16500, '-0.5 ska skala till ~-16384');
    assert(pcmSamples[3] === 32767, '1.0 ska skala till max 32767');
    assert(pcmSamples[4] === -32768, '-1.0 ska skala till min -32768');

    const mgr = new SessionIntentManager(bus);
    mgr.emitAudioTalking();
    mgr.emitAudioThinking();

    const history = bus.getHistory();
    const talkingEvt = history.find((e) => e.type === 'swarm.live.audio.talking');
    assert(Boolean(talkingEvt), 'swarm.live.audio.talking ska finnas i händelseloggen');
    assert((talkingEvt?.data as { state: string }).state === 'SWARM_TALKING', 'State ska vara SWARM_TALKING');

    const thinkingEvt = history.find((e) => e.type === 'swarm.live.audio.thinking');
    assert(Boolean(thinkingEvt), 'swarm.live.audio.thinking ska finnas i händelseloggen');
    assert((thinkingEvt?.data as { state: string }).state === 'SWARM_THINKING', 'State ska vara SWARM_THINKING');

    results.push({ name: 'TCK-020b: Bidi Audio Handshake, PCM16 konvertering och Talking/Thinking telemetri', passed: true });
  } catch (err: any) {
    results.push({ name: 'TCK-020b: Bidi Audio Handshake, PCM16 konvertering och Talking/Thinking telemetri', passed: false, error: err.message });
  }

  // Test 2: Stegvis 3-State Snap via klick, piltangenter och svepgester
  try {
    assert(clampSnapState(0) === 0, 'clampSnapState(0) ska vara 0');
    assert(clampSnapState(50) === 50, 'clampSnapState(50) ska vara 50');
    assert(clampSnapState(100) === 100, 'clampSnapState(100) ska vara 100');
    assert(clampSnapState(27) === 50, 'Mellanvärde ska clampas till 50');

    assert(stepSnapState(100, 'prev') === 50, '100 prev ska ge 50');
    assert(stepSnapState(50, 'prev') === 0, '50 prev ska ge 0');
    assert(stepSnapState(0, 'prev') === 0, '0 prev ska stanna på 0');
    assert(stepSnapState(0, 'next') === 50, '0 next ska ge 50');
    assert(stepSnapState(50, 'next') === 100, '50 next ska ge 100');
    assert(stepSnapState(100, 'next') === 100, '100 next ska stanna på 100');

    assert(handleKeyboardNavigation('ArrowUp', 'portrait', 100) === 50, 'Portrait ArrowUp från 100 ska ge 50');
    assert(handleKeyboardNavigation('ArrowUp', 'portrait', 50) === 0, 'Portrait ArrowUp från 50 ska ge 0');
    assert(handleKeyboardNavigation('ArrowDown', 'portrait', 0) === 50, 'Portrait ArrowDown från 0 ska ge 50');
    assert(handleKeyboardNavigation('ArrowDown', 'portrait', 50) === 100, 'Portrait ArrowDown från 50 ska ge 100');

    assert(handleKeyboardNavigation('ArrowLeft', 'landscape', 100) === 50, 'Landscape ArrowLeft från 100 ska ge 50');
    assert(handleKeyboardNavigation('ArrowRight', 'landscape', 0) === 50, 'Landscape ArrowRight från 0 ska ge 50');

    assert(handleSwipeGesture(0, -45, 'portrait', 50) === 0, 'Swipe upp (-45px) ska ge 0');
    assert(handleSwipeGesture(0, 45, 'portrait', 50) === 100, 'Swipe ned (+45px) ska ge 100');
    assert(handleSwipeGesture(0, 15, 'portrait', 50) === 50, 'Swipe under tröskel ska inte ändra läge');
    assert(handleSwipeGesture(-50, 0, 'landscape', 50) === 0, 'Swipe vänster (-50px) ska ge 0');
    assert(handleSwipeGesture(50, 0, 'landscape', 50) === 100, 'Swipe höger (+50px) ska ge 100');

    results.push({ name: 'TCK-020b: Stegvis 3-State Snap, piltangenter och svepgester', passed: true });
  } catch (err: any) {
    results.push({ name: 'TCK-020b: Stegvis 3-State Snap, piltangenter och svepgester', passed: false, error: err.message });
  }

  // Test 3: Dynamiska pilar per läge (100%: [ ⇧ ]/[ ⇐ ], 50%: båda, 0%: [ ⇩ ]/[ ⇒ ])
  try {
    const p100 = computeSplitArrows('portrait', 100);
    assert(p100.showFirst && !p100.showSecond && p100.firstIcon === '⇧', '100% portrait fel');
    const p50 = computeSplitArrows('portrait', 50);
    assert(p50.showFirst && p50.showSecond && p50.firstIcon === '⇧' && p50.secondIcon === '⇩', '50% portrait fel');
    const p0 = computeSplitArrows('portrait', 0);
    assert(!p0.showFirst && p0.showSecond && p0.secondIcon === '⇩', '0% portrait fel');

    const l100 = computeSplitArrows('landscape', 100);
    assert(l100.showFirst && !l100.showSecond && l100.firstIcon === '⇐', '100% landscape fel');
    const l50 = computeSplitArrows('landscape', 50);
    assert(l50.showFirst && l50.showSecond && l50.firstIcon === '⇐' && l50.secondIcon === '⇒', '50% landscape fel');
    const l0 = computeSplitArrows('landscape', 0);
    assert(!l0.showFirst && l0.showSecond && l0.secondIcon === '⇒', '0% landscape fel');

    results.push({ name: 'TCK-020b: Dynamiska pilar per läge i Portrait och Landscape', passed: true });
  } catch (err: any) {
    results.push({ name: 'TCK-020b: Dynamiska pilar per läge i Portrait och Landscape', passed: false, error: err.message });
  }

  // Test 4: Fullständig bortkoppling av TouchOverlayMenu i AppShell & matchMedia
  try {
    const appShellPath = path.join(rootDir, 'src/features/gemini_live_swarm/ui/AppShell.tsx');
    const appShellContent = fs.readFileSync(appShellPath, 'utf8');
    assert(!appShellContent.includes('TouchOverlayMenu'), 'TouchOverlayMenu får inte renderas');
    assert(appShellContent.includes('window.matchMedia'), 'AppShell ska använda window.matchMedia');
    assert(appShellContent.includes('permanent-crown-zone'), 'AppShell ska innehålla permanent-crown-zone');
    results.push({ name: 'TCK-020b: Fullständig menyrensning och dynamisk matchMedia-orientering', passed: true });
  } catch (err: any) {
    results.push({ name: 'TCK-020b: Fullständig menyrensning och dynamisk matchMedia-orientering', passed: false, error: err.message });
  }

  // Test 5: Permanent SymbolCrown & Intent Toggle
  try {
    const bus = new SwarmEventBus();
    const session = new GeminiLiveSession('test-key', bus);
    const mockConnect = async (cfg: any) => {
      cfg?.callbacks?.onopen?.();
      return { sendRealtimeInput: () => {}, close: () => {} };
    };
    (session as any).aiClient = { live: { connect: mockConnect } };

    await session.activateIntent('REFLECT');
    assert(session.getActiveIntent() === 'REFLECT', 'REFLECT ska vara aktiv');
    await session.activateIntent('REFLECT');
    assert(session.getActiveIntent() === null, 'Återklick ska nollställa till null');

    const history = bus.getHistory();
    const deactEvt = history.find((e) => e.type === 'swarm.live.intent.deactivated');
    assert(Boolean(deactEvt), 'deactivated händelse ska finnas');

    const initialCrown: CrownState = { symbol: '⇑', color: 'ACTIVE', activityText: 'Init' };
    if (deactEvt) {
      const crown = resolveCrownFromEnvelope(deactEvt, initialCrown);
      assert(crown.activityText === '🟡 Agenter i dvala', 'Aktivitetstext ska visa dvala');
      assert(crown.color === 'THINKING', 'LED ska visa THINKING (gul)');
    }
    results.push({ name: 'TCK-020b: Permanent SymbolCrown, röstbrytning och dvalastatus', passed: true });
  } catch (err: any) {
    results.push({ name: 'TCK-020b: Permanent SymbolCrown, röstbrytning och dvalastatus', passed: false, error: err.message });
  }

  // Test 6: AST- och strukturmått (max 125 rader, djup <= 4, förgreningar <= 5 i TSX)
  try {
    const filesToAudit = [
      'src/features/gemini_live_swarm/ui/SplitPaneCanvas.tsx',
      'src/features/gemini_live_swarm/ui/AppShell.tsx',
      'src/features/gemini_live_swarm/ui/splitPaneHelper.ts',
      'src/features/gemini_live_swarm/session/sessionIntentAudio.ts',
      'src/features/gemini_live_swarm/session/geminiLiveSession.ts',
    ];
    for (const relPath of filesToAudit) {
      const fullPath = path.join(rootDir, relPath);
      const content = fs.readFileSync(fullPath, 'utf8');
      const astRes = checkAstMetrics(fullPath, content);
      assert(astRes.valid, `AST-fel i ${relPath}: ${astRes.error}`);
      const mockRes = checkNoProductionMocks(fullPath, content);
      assert(mockRes.valid, `Mock-fel i ${relPath}: ${mockRes.error}`);
    }
    results.push({ name: 'TCK-020b: AST- och strukturmått (max 125 rader, djup <= 4, förgreningar <= 5 i TSX)', passed: true });
  } catch (err: any) {
    results.push({ name: 'TCK-020b: AST- och strukturmått (max 125 rader, djup <= 4, förgreningar <= 5 i TSX)', passed: false, error: err.message });
  }

  return results;
}
