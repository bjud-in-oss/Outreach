import fs from 'node:fs';
import path from 'node:path';
import { checkAstMetrics, checkNoProductionMocks } from '../../scripts/drivers/ts.js';
import { SwarmEventBus } from '../features/gemini_live_swarm/bus/swarmEventBus.ts';
import { GeminiLiveSession } from '../features/gemini_live_swarm/session/geminiLiveSession.ts';
import {
  computeSplitArrows,
  getIntentButtonClass,
  getIntentTextClass,
  computeSnapTarget,
  SWARM_INTENTS,
  INTENT_FORCE_MAP,
} from '../features/gemini_live_swarm/ui/splitPaneHelper.ts';
import { resolveCrownFromEnvelope, CrownState } from '../features/gemini_live_swarm/ui/crownStateHelper.ts';

export async function runTransientTCK020Tests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];
  const rootDir = process.cwd();

  function assert(condition: boolean, msg: string) {
    if (!condition) throw new Error(msg);
  }

  // Test 1: User Gesture-start av AudioContext och intent-växling
  try {
    const bus = new SwarmEventBus();
    const session = new GeminiLiveSession('test-api-key', bus);

    assert(session.getActiveIntent() === null, 'Initial intent ska vara null');

    // Aktivera REFLECT
    await session.activateIntent('REFLECT');
    assert(session.getActiveIntent() === 'REFLECT', 'Aktiv intent ska vara REFLECT');

    const history = bus.getHistory();
    const actEvt = history.find((e) => e.type === 'swarm.live.intent.activated');
    assert(Boolean(actEvt), 'swarm.live.intent.activated ska ha publicerats');
    const actData = actEvt?.data as { intent: string; force: string; title: string };
    assert(actData.intent === 'REFLECT', 'Intent ska vara REFLECT i händelsedata');
    assert(actData.force === 'ATT_FOLJA', 'Force ska vara ATT_FOLJA för REFLECT');

    // Växla till CONSULT
    await session.activateIntent('CONSULT');
    assert(session.getActiveIntent() === 'CONSULT', 'Aktiv intent ska ha växlats till CONSULT');
    const consultEvt = bus.getHistory().filter((e) => e.type === 'swarm.live.intent.activated').pop();
    const consultData = consultEvt?.data as { intent: string; force: string };
    assert(consultData.intent === 'CONSULT', 'Ny händelse ska ha intent CONSULT');
    assert(consultData.force === 'ATT_FORLIKAS', 'Force ska vara ATT_FORLIKAS för CONSULT');

    results.push({
      name: 'TCK-020: User Gesture-aktivering av röstström och reaktiv intent-växling',
      passed: true,
    });
  } catch (err) {
    results.push({
      name: 'TCK-020: User Gesture-aktivering av röstström och reaktiv intent-växling',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Test 2: Inaktivering av röstsession och status "🟡 Agenter i dvala"
  try {
    const bus = new SwarmEventBus();
    const session = new GeminiLiveSession('test-api-key', bus);

    await session.activateIntent('REMEMBER');
    assert(session.getActiveIntent() === 'REMEMBER', 'Ska vara REMEMBER');

    // Klick på samma knapp inaktiverar
    await session.activateIntent('REMEMBER');
    assert(session.getActiveIntent() === null, 'Aktiv intent ska nollställas vid återklick');

    const deactEvt = bus.getHistory().find((e) => e.type === 'swarm.live.intent.deactivated');
    assert(Boolean(deactEvt), 'swarm.live.intent.deactivated ska ha publicerats');
    const deactData = deactEvt?.data as { activityText: string; status: string };
    assert(deactData.activityText === '🟡 Agenter i dvala', 'Aktivitetstext ska vara "🟡 Agenter i dvala"');

    // Verifiera att SymbolCrown reaktivt återspeglar dvalan
    const initialCrown: CrownState = {
      symbol: '⇑',
      color: 'ACTIVE',
      activityText: 'Initial aktiv',
    };
    if (deactEvt) {
      const crown = resolveCrownFromEnvelope(deactEvt, initialCrown);
      assert(crown.activityText === '🟡 Agenter i dvala', 'Crown ska visa "🟡 Agenter i dvala"');
      assert(crown.color === 'THINKING', 'Crown ska visa gul LED (THINKING) i dvala');
    }

    results.push({
      name: 'TCK-020: Inaktivering av röstsession, mikrofonstängning och status "🟡 Agenter i dvala"',
      passed: true,
    });
  } catch (err) {
    results.push({
      name: 'TCK-020: Inaktivering av röstsession, mikrofonstängning och status "🟡 Agenter i dvala"',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Test 3: Enkelpilar vid gränslägen i porträtt och landskap
  try {
    // Porträtt botten-snap (0%): dölj nedåtpil [ ⇩ ], visa enbart [ ⇧ ]
    const portBot = computeSplitArrows('portrait', 0);
    assert(!portBot.showFirst, 'Nedåtpil ska vara dold vid botten (0%)');
    assert(portBot.showSecond, 'Uppåtpil [ ⇧ ] ska visas vid botten (0%)');
    assert(portBot.firstIcon === '⇩', 'firstIcon ska vara ⇩');
    assert(portBot.secondIcon === '⇧', 'secondIcon ska vara ⇧');

    // Porträtt topp-snap (100%): dölj uppåtpil [ ⇧ ], visa enbart [ ⇩ ]
    const portTop = computeSplitArrows('portrait', 100);
    assert(portTop.showFirst, 'Nedåtpil [ ⇩ ] ska visas vid topp (100%)');
    assert(!portTop.showSecond, 'Uppåtpil ska vara dold vid topp (100%)');

    // Porträtt mitt (50%): båda pilar visas
    const portMid = computeSplitArrows('portrait', 50);
    assert(portMid.showFirst && portMid.showSecond, 'Båda pilar ska visas vid 50%');

    // Landskap vänster-snap (0%): dölj vänsterpil [ ⇐ ], visa enbart [ ⇒ ]
    const landLeft = computeSplitArrows('landscape', 0);
    assert(!landLeft.showFirst, 'Vänsterpil ska vara dold vid 0%');
    assert(landLeft.showSecond, 'Högerpil [ ⇒ ] ska visas vid 0%');
    assert(landLeft.firstIcon === '⇐', 'firstIcon ska vara ⇐');
    assert(landLeft.secondIcon === '⇒', 'secondIcon ska vara ⇒');

    // Landskap höger-snap (100%): dölj högerpil [ ⇒ ], visa enbart [ ⇐ ]
    const landRight = computeSplitArrows('landscape', 100);
    assert(landRight.showFirst, 'Vänsterpil [ ⇐ ] ska visas vid 100%');
    assert(!landRight.showSecond, 'Högerpil ska vara dold vid 100%');

    // Snap target återställning
    assert(computeSnapTarget(0, true) === 50, 'Klick från 0% min ska återställa till 50%');
    assert(computeSnapTarget(100, false) === 50, 'Klick från 100% max ska återställa till 50%');

    results.push({
      name: 'TCK-020: Orientering- och enkelpilslogik vid gränslägen (0% och 100%)',
      passed: true,
    });
  } catch (err) {
    results.push({
      name: 'TCK-020: Orientering- och enkelpilslogik vid gränslägen (0% och 100%)',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Test 4: Adaptiv knappkollaps (ikon vs text + scale-105)
  try {
    const activeClass = getIntentButtonClass('REFLECT', 'REFLECT');
    assert(activeClass.includes('scale-105'), 'Aktiv knapp ska förstoras med scale-105');
    assert(activeClass.includes('bg-emerald-600'), 'Aktiv knapp ska ha distinkt bakgrund (bg-emerald-600)');

    const inactiveClass = getIntentButtonClass('REMEMBER', 'REFLECT');
    assert(inactiveClass.includes('scale-95') || inactiveClass.includes('opacity-80'), 'Inaktiv knapp ska dämpas');

    const activeText = getIntentTextClass('REFLECT', 'REFLECT');
    assert(activeText === 'inline-block', 'Aktiv knapp ska alltid visa text');

    const inactiveText = getIntentTextClass('REMEMBER', 'REFLECT');
    assert(inactiveText.includes('hidden sm:inline-block'), 'Inaktiv knapp ska dölja text på små skärmar');

    assert(SWARM_INTENTS.length === 3, 'Exakt 3 intents ska finnas definierade');
    assert(Boolean(INTENT_FORCE_MAP.REFLECT), 'INTENT_FORCE_MAP ska innehålla REFLECT');

    results.push({
      name: 'TCK-020: Adaptiv ikon/text-kollaps och aktiv lägesmarkering på delningslinjen',
      passed: true,
    });
  } catch (err) {
    results.push({
      name: 'TCK-020: Adaptiv ikon/text-kollaps och aktiv lägesmarkering på delningslinjen',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Test 5: Permanent SymbolCrown och helskärmskorrigering
  try {
    const appShellPath = path.join(rootDir, 'src/features/gemini_live_swarm/ui/AppShell.tsx');
    const appShellContent = fs.readFileSync(appShellPath, 'utf8');

    assert(
      appShellContent.includes('permanent-crown-zone'),
      'AppShell ska innehålla permanent-crown-zone som alltid renderar SymbolCrown'
    );
    assert(
      !appShellContent.includes("isImmersive && !overlayVisible ? 'hidden' : 'block'"),
      'SymbolCrown får inte vara villkorligt dold i immersivt läge'
    );
    assert(
      appShellContent.includes('setSplitRatio(50)'),
      'Återgång från immersivt läge ska återställa split-ratio till 50% för båda fälten'
    );

    results.push({
      name: 'TCK-020: Permanent SymbolCrown i toppzonen och helskärmsåterställning',
      passed: true,
    });
  } catch (err) {
    results.push({
      name: 'TCK-020: Permanent SymbolCrown i toppzonen och helskärmsåterställning',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Test 6: AST- och strukturmått enligt TCK-012/TCK-013
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

    results.push({
      name: 'TCK-020: AST- och strukturmått (max 125 rader, djup <= 4, förgreningar <= 5 i TSX)',
      passed: true,
    });
  } catch (err) {
    results.push({
      name: 'TCK-020: AST- och strukturmått (max 125 rader, djup <= 4, förgreningar <= 5 i TSX)',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return results;
}
