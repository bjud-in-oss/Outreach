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
} from '../features/gemini_live_swarm/ui/crownStateHelper.ts';
import { SplitPaneCanvas } from '../features/gemini_live_swarm/ui/SplitPaneCanvas.tsx';
import { ExecutionCard } from '../features/gemini_live_swarm/ui/ExecutionCard.tsx';
import { TouchOverlayMenu } from '../features/gemini_live_swarm/ui/TouchOverlayMenu.tsx';

export async function runTransientTCK018Tests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];
  const rootDir = process.cwd();

  function assert(condition: boolean, msg: string) {
    if (!condition) throw new Error(msg);
  }

  // Test 1: Symbol-kronans integrerade färgsättning och expansion (⇑, ⇐, ●)
  try {
    assert(CROWN_SYMBOLS.ATT_FOLJA === '⇑', 'CROWN_SYMBOLS.ATT_FOLJA ska vara "⇑"');
    assert(CROWN_SYMBOLS.ATT_VANDA_OM === '⇐', 'CROWN_SYMBOLS.ATT_VANDA_OM ska vara "⇐"');
    assert(CROWN_SYMBOLS.ATT_FORLIKAS === '●', 'CROWN_SYMBOLS.ATT_FORLIKAS ska vara "●"');
    assert(CROWN_SYMBOLS.SERIELL_MOTOR === '●', 'CROWN_SYMBOLS.SERIELL_MOTOR ska vara "●"');

    // Verifiera att separat LED-cirkel är borttagen ur SymbolCrown.tsx
    const crownPath = path.join(rootDir, 'src', 'features', 'gemini_live_swarm', 'ui', 'SymbolCrown.tsx');
    const crownCode = fs.readFileSync(crownPath, 'utf8');
    assert(!crownCode.includes('crown-status-led'), 'Separata LED-cirkeln (crown-status-led) ska vara borttagen');
    assert(crownCode.includes('crown-detail-panel'), 'SymbolCrown saknar expanderbar panel (crown-detail-panel)');

    // Testa reaktiv färg- och symboluppdatering
    let state: CrownState = {
      symbol: CROWN_SYMBOLS.ATT_FOLJA,
      color: 'ACTIVE',
      activityText: 'Startar',
    };
    const bus = new SwarmEventBus();
    const env = bus.publishLiveEvent('swarm.agent.transition', {
      force: 'ATT_VANDA_OM',
      status: 'THINKING',
      activityText: 'Omprövar perspektiv',
    });
    state = resolveCrownFromEnvelope(env, state);
    assert(state.symbol === '⇐', `Förväntade symbol "⇐", fick "${state.symbol}"`);
    assert(state.color === 'THINKING', `Förväntade färg THINKING, fick "${state.color}"`);

    const element = React.createElement(SymbolCrown, { defaultExpanded: true });
    assert(React.isValidElement(element), 'SymbolCrown genererar inte ett giltigt element');

    const metrics = checkAstMetrics('SymbolCrown.tsx', crownCode);
    assert(metrics.valid, `AST-fel i SymbolCrown.tsx: ${metrics.error}`);

    results.push({
      name: 'TCK-018: Symbol-krona - Integrerad färgsättning (⇑, ⇐, ●) och fällbar telemetridetalj',
      passed: true,
    });
  } catch (err) {
    results.push({
      name: 'TCK-018: Symbol-krona - Integrerad färgsättning (⇑, ⇐, ●) och fällbar telemetridetalj',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Test 2: Enkeltryck-snap och immersiv touch-overlay för krona/meny
  try {
    const splitPath = path.join(rootDir, 'src', 'features', 'gemini_live_swarm', 'ui', 'SplitPaneCanvas.tsx');
    const splitCode = fs.readFileSync(splitPath, 'utf8');
    assert(splitCode.includes('snap-toggle-button'), 'SplitPaneCanvas saknar snap-toggle-button');
    assert(splitCode.includes('snap-handle-icon'), 'SplitPaneCanvas saknar snap-handle-icon');

    const splitElement = React.createElement(SplitPaneCanvas, {
      initialSplitRatio: 0,
      isImmersive: true,
    });
    assert(React.isValidElement(splitElement), 'SplitPaneCanvas genererar inte ett giltigt element');

    const overlayPath = path.join(rootDir, 'src', 'features', 'gemini_live_swarm', 'ui', 'TouchOverlayMenu.tsx');
    const overlayCode = fs.readFileSync(overlayPath, 'utf8');
    assert(overlayCode.includes('trigger-reflect'), 'TouchOverlayMenu saknar trigger-reflect');
    assert(overlayCode.includes('trigger-remember'), 'TouchOverlayMenu saknar trigger-remember');
    assert(overlayCode.includes('trigger-consult'), 'TouchOverlayMenu saknar trigger-consult');
    assert(overlayCode.includes('toggle-immersive-btn'), 'TouchOverlayMenu saknar toggle-immersive-btn');

    const overlayElement = React.createElement(TouchOverlayMenu, { isVisible: true, isImmersive: true });
    assert(React.isValidElement(overlayElement), 'TouchOverlayMenu genererar inte ett giltigt element');

    results.push({
      name: 'TCK-018: Snap & Immersiv Touch-Overlay - Enkeltryck för fullskärmschatt och 3s touch-meny',
      passed: true,
    });
  } catch (err) {
    results.push({
      name: 'TCK-018: Snap & Immersiv Touch-Overlay - Enkeltryck för fullskärmschatt och 3s touch-meny',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Test 3: Rendering och fällbarhet av exekveringskort i chatten
  try {
    const cardPath = path.join(rootDir, 'src', 'features', 'gemini_live_swarm', 'ui', 'ExecutionCard.tsx');
    const cardCode = fs.readFileSync(cardPath, 'utf8');
    assert(cardCode.includes('execution-card-header'), 'ExecutionCard saknar fällbart header-element');
    assert(cardCode.includes('execution-card-body'), 'ExecutionCard saknar body-element');

    const cardElement = React.createElement(ExecutionCard, {
      id: 'step-1',
      force: 'ATT_FOLJA',
      stepNumber: 1,
      title: 'Verifierade källkod',
      createdFiles: ['src/a.ts', 'src/b.ts'],
      changesSummary: '2 filer uppdaterade med nya regler',
      defaultExpanded: true,
    });
    assert(React.isValidElement(cardElement), 'ExecutionCard genererar inte ett giltigt element');

    const metrics = checkAstMetrics('ExecutionCard.tsx', cardCode);
    assert(metrics.valid, `AST-fel i ExecutionCard.tsx: ${metrics.error}`);

    results.push({
      name: 'TCK-018: Exekveringskort - Fällbara kort i chatten med filöversikt och ändringsloggar',
      passed: true,
    });
  } catch (err) {
    results.push({
      name: 'TCK-018: Exekveringskort - Fällbara kort i chatten med filöversikt och ändringsloggar',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Test 4: User Activity Lock (5s inaktivitetstimer)
  try {
    const lockPath = path.join(rootDir, 'src', 'features', 'gemini_live_swarm', 'ui', 'useUserActivityLock.ts');
    assert(fs.existsSync(lockPath), 'useUserActivityLock.ts saknas');
    const lockCode = fs.readFileSync(lockPath, 'utf8');
    assert(lockCode.includes('lockDurationMs = 5000'), 'Standard låsintervall ska vara 5000ms');
    assert(lockCode.includes('canAutonomouslyUpdate'), 'useUserActivityLock saknar canAutonomouslyUpdate');

    const metrics = checkAstMetrics('useUserActivityLock.ts', lockCode);
    assert(metrics.valid, `AST-fel i useUserActivityLock.ts: ${metrics.error}`);

    results.push({
      name: 'TCK-018: User Activity Lock - 5s frysning av autonoma vybyten vid användarinteraktion',
      passed: true,
    });
  } catch (err) {
    results.push({
      name: 'TCK-018: User Activity Lock - 5s frysning av autonoma vybyten vid användarinteraktion',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return results;
}
