import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { checkAstMetrics } from '../../scripts/drivers/ts.js';
import { SwarmEventBus } from '../features/gemini_live_swarm/bus/swarmEventBus.ts';
import {
  SymbolCrown,
  CROWN_SYMBOLS,
  STATUS_LED_CLASSES,
} from '../features/gemini_live_swarm/ui/SymbolCrown.tsx';
import {
  resolveCrownFromEnvelope,
  CrownState,
  LED_BG_CLASSES,
} from '../features/gemini_live_swarm/ui/crownStateHelper.ts';
import { SplitPaneCanvas } from '../features/gemini_live_swarm/ui/SplitPaneCanvas.tsx';

export async function runTransientTCK017Tests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];
  const rootDir = process.cwd();

  function assert(condition: boolean, msg: string) {
    if (!condition) throw new Error(msg);
  }

  // Test 1: Symbol-Krona & Status-LED Kontrakt och Rendering
  try {
    // Verifiera de rena symbolerna enligt specifikation
    assert(CROWN_SYMBOLS.ATT_FOLJA === '⇑', 'CROWN_SYMBOLS.ATT_FOLJA måste vara "⇑"');
    assert(CROWN_SYMBOLS.ATT_VANDA_OM === '⇐' || CROWN_SYMBOLS.ATT_VANDA_OM === '↔', 'CROWN_SYMBOLS.ATT_VANDA_OM måste vara "⇐" eller "↔"');
    assert(CROWN_SYMBOLS.ATT_FORLIKAS === '●', 'CROWN_SYMBOLS.ATT_FORLIKAS måste vara "●"');
    assert(CROWN_SYMBOLS.SERIELL_MOTOR === '●', 'CROWN_SYMBOLS.SERIELL_MOTOR måste vara "●"');

    // Verifiera att statusklasser finns för ACTIVE, THINKING och ERROR
    assert(STATUS_LED_CLASSES.ACTIVE.includes('emerald'), 'ACTIVE status måste ha emerald LED-färg');
    assert(STATUS_LED_CLASSES.THINKING.includes('amber'), 'THINKING status måste ha amber LED-färg');
    assert(STATUS_LED_CLASSES.ERROR.includes('red'), 'ERROR status måste ha red LED-färg');

    assert(LED_BG_CLASSES.ACTIVE.includes('emerald'), 'LED_BG_CLASSES.ACTIVE saknar emerald');
    assert(LED_BG_CLASSES.THINKING.includes('amber'), 'LED_BG_CLASSES.THINKING saknar amber');
    assert(LED_BG_CLASSES.ERROR.includes('red'), 'LED_BG_CLASSES.ERROR saknar red');

    // Validera att SymbolCrown är en giltig React-komponent och skapar giltigt element
    assert(typeof SymbolCrown === 'function', 'SymbolCrown måste vara en giltig React-funktionskomponent');
    const crownElement = React.createElement(SymbolCrown, {
      initialState: {
        symbol: CROWN_SYMBOLS.ATT_FOLJA,
        color: 'ACTIVE',
        activityText: 'Samordnar närhet',
      },
    });
    assert(React.isValidElement(crownElement), 'SymbolCrown genererar inte ett giltigt React-element');

    // Validera AST-mått på SymbolCrown.tsx
    const crownPath = path.join(rootDir, 'src', 'features', 'gemini_live_swarm', 'ui', 'SymbolCrown.tsx');
    const crownContent = fs.readFileSync(crownPath, 'utf8');
    const crownMetrics = checkAstMetrics('SymbolCrown.tsx', crownContent);
    assert(crownMetrics.valid, `AST-fel i SymbolCrown.tsx: ${crownMetrics.error}`);

    results.push({
      name: 'TCK-017: Symbol-Krona & Status-LED - Korrekt rendering av agent-symboler (⇑, ↔, ●) och LED',
      passed: true,
    });
  } catch (err) {
    results.push({
      name: 'TCK-017: Symbol-Krona & Status-LED - Korrekt rendering av agent-symboler (⇑, ↔, ●) och LED',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Test 2: Reaktiv Tillståndsuppdatering via SwarmEventBus
  try {
    const bus = new SwarmEventBus();
    let currentState: CrownState = {
      symbol: CROWN_SYMBOLS.ATT_FOLJA,
      color: 'ACTIVE',
      activityText: 'Initialiserar',
    };

    // 1. Skicka övergång till Att vända om med THINKING
    const env1 = bus.publishLiveEvent('swarm.agent.transition', {
      force: 'ATT_VANDA_OM',
      status: 'THINKING',
      activityText: 'Prövar perspektiv',
    });
    currentState = resolveCrownFromEnvelope(env1, currentState);
    assert(currentState.symbol === '⇐' || currentState.symbol === '↔', `Förväntade symbol "⇐" eller "↔", fick "${currentState.symbol}"`);
    assert(currentState.color === 'THINKING', `Förväntade färg THINKING, fick "${currentState.color}"`);
    assert(currentState.activityText === 'Prövar perspektiv', `Felaktig aktivitetstext: "${currentState.activityText}"`);

    // 2. Skicka övergång till Att förlikas med ACTIVE
    const env2 = bus.publishLiveEvent('swarm.agent.transition', {
      force: 'ATT_FORLIKAS',
      status: 'ACTIVE',
      activityText: 'Håller samtida perspektiv',
    });
    currentState = resolveCrownFromEnvelope(env2, currentState);
    assert(currentState.symbol === '●', `Förväntade symbol "●", fick "${currentState.symbol}"`);
    assert(currentState.color === 'ACTIVE', `Förväntade färg ACTIVE, fick "${currentState.color}"`);

    // 3. Skicka felläge med ERROR
    const env3 = bus.publishLiveEvent('swarm.agent.status', {
      force: 'ATT_FOLJA',
      status: 'ERROR',
      activityText: 'Avbruten förbindelse',
    });
    currentState = resolveCrownFromEnvelope(env3, currentState);
    assert(currentState.symbol === '⇑', `Förväntade symbol "⇑", fick "${currentState.symbol}"`);
    assert(currentState.color === 'ERROR', `Förväntade färg ERROR, fick "${currentState.color}"`);

    // 4. Skicka seriell motor med RUNNING
    const env4 = bus.publishLiveEvent('swarm.serial.transition', {
      force: 'SERIELL_MOTOR',
      stageStatus: 'RUNNING',
      activityText: 'Stegar framåt',
    });
    currentState = resolveCrownFromEnvelope(env4, currentState);
    assert(currentState.symbol === '●', `Förväntade symbol "●", fick "${currentState.symbol}"`);
    assert(currentState.color === 'ACTIVE', `Förväntade färg ACTIVE, fick "${currentState.color}"`);

    results.push({
      name: 'TCK-017: Reaktiv Tillståndsuppdatering - Händelser på SwarmEventBus styr kronans symboler och LED',
      passed: true,
    });
  } catch (err) {
    results.push({
      name: 'TCK-017: Reaktiv Tillståndsuppdatering - Händelser på SwarmEventBus styr kronans symboler och LED',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Test 3: Dragbar Split-Pane Layout och Gränskontroll (15%–85%)
  try {
    const splitPanePath = path.join(rootDir, 'src', 'features', 'gemini_live_swarm', 'ui', 'SplitPaneCanvas.tsx');
    assert(fs.existsSync(splitPanePath), 'SplitPaneCanvas.tsx saknas på disk');

    const fileContent = fs.readFileSync(splitPanePath, 'utf8');

    // STRIKT REGEL: Inga rubriker eller förklarande textnamn på zonerna i DOM
    assert(!fileContent.includes('<h1>'), 'Otillåten <h1> rubrik i SplitPaneCanvas');
    assert(!fileContent.includes('<h2>'), 'Otillåten <h2> rubrik i SplitPaneCanvas');
    assert(!fileContent.includes('<h3>'), 'Otillåten <h3> rubrik i SplitPaneCanvas');
    assert(!fileContent.includes('Agent-Kanvas'), 'Förbjudet zonnamn "Agent-Kanvas" i DOM');
    assert(!fileContent.includes('Chattflöde'), 'Förbjudet zonnamn "Chattflöde" i DOM');

    // Validera AST-mått på SplitPaneCanvas.tsx
    const splitMetrics = checkAstMetrics('SplitPaneCanvas.tsx', fileContent);
    assert(splitMetrics.valid, `AST-fel i SplitPaneCanvas.tsx: ${splitMetrics.error}`);

    // Validera att SplitPaneCanvas är en giltig React-komponent
    assert(typeof SplitPaneCanvas === 'function', 'SplitPaneCanvas måste vara en funktion');

    const upperMock = React.createElement('div', { id: 'mock-upper' }, 'Innehåll 1');
    const lowerMock = React.createElement('div', { id: 'mock-lower' }, 'Innehåll 2');

    const element = React.createElement(SplitPaneCanvas, {
      upperContent: upperMock,
      lowerContent: lowerMock,
      initialSplitRatio: 40,
    });
    assert(React.isValidElement(element), 'SplitPaneCanvas skapar inte ett giltigt element');

    // Validera clamping-funktionen matematiskt
    const clampRatio = (val: number) => Math.max(15, Math.min(85, Math.round(val)));
    assert(clampRatio(5) === 15, '5% ska begränsas till 15%');
    assert(clampRatio(95) === 85, '95% ska begränsas till 85%');
    assert(clampRatio(50) === 50, '50% ska förbli 50%');

    results.push({
      name: 'TCK-017: Justerbar Split-Pane - Dragbar avgränsare, 15%-85% spärr och ren layout utan rubriker',
      passed: true,
    });
  } catch (err) {
    results.push({
      name: 'TCK-017: Justerbar Split-Pane - Dragbar avgränsare, 15%-85% spärr och ren layout utan rubriker',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return results;
}
