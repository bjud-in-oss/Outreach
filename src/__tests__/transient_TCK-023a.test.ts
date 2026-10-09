import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { checkAstMetrics, checkNoProductionMocks } from '../../scripts/drivers/ts.js';
import { SwarmEventBus } from '../features/gemini_live_swarm/bus/swarmEventBus.ts';
import {
  ReflectionModeSchema,
  ReflectionMode,
  REFLECTION_MODE_EVENT,
  REFLECTION_MODES,
  parseReflectionMode,
  isValidReflectionMode,
  getReflectionModeStyle,
} from '../features/gemini_live_swarm/ui/reflectionStateHelper.ts';
import {
  resolveCrownFromEnvelope,
  CrownState,
  CrownStateSchema,
} from '../features/gemini_live_swarm/ui/crownStateHelper.ts';

export async function runTransientTCK023aTests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];
  const rootDir = process.cwd();

  function assert(condition: boolean, msg: string) {
    if (!condition) throw new Error(msg);
  }

  // Test 1: Zod-kontrakt för ReflectionModeSchema och Fail-Fast validering
  try {
    assert(ReflectionModeSchema.parse('normal') === 'normal', 'normal ska accepteras');
    assert(ReflectionModeSchema.parse('mikro') === 'mikro', 'mikro ska accepteras');
    assert(ReflectionModeSchema.parse('makro') === 'makro', 'makro ska accepteras');
    assert(ReflectionModeSchema.parse('meta') === 'meta', 'meta ska accepteras');
    assert(ReflectionModeSchema.parse(undefined) === 'normal', 'default ska vara normal');

    let threwOnInvalid = false;
    try {
      ReflectionModeSchema.parse('invalid_mode');
    } catch {
      threwOnInvalid = true;
    }
    assert(threwOnInvalid, 'Ogiltigt reflektionsläge ska kasta fel (Fail-Fast)');

    assert(isValidReflectionMode('mikro') === true, 'mikro ska vara giltigt');
    assert(isValidReflectionMode('bogus') === false, 'bogus ska vara ogiltigt');
    assert(REFLECTION_MODES.length === 4, 'Exakt 4 reflektionslägen i reglaget');

    // Test helper styles
    const activeStyle = getReflectionModeStyle('mikro', 'mikro');
    const inactiveStyle = getReflectionModeStyle('normal', 'mikro');
    assert(activeStyle.includes('text-emerald-300'), 'Aktiv stil ska innehålla emerald');
    assert(inactiveStyle.includes('text-slate-400'), 'Inaktiv stil ska innehålla slate-400');

    results.push({ name: 'Zod-kontrakt för ReflectionMode och Fail-Fast validering', passed: true });
  } catch (err: any) {
    results.push({ name: 'Zod-kontrakt för ReflectionMode och Fail-Fast validering', passed: false, error: err.message });
  }

  // Test 2: EventBus-utsändning och state-export från reglaget
  try {
    const bus = new SwarmEventBus();
    const emittedEvents: any[] = [];

    bus.subscribe(REFLECTION_MODE_EVENT, (envelope) => {
      emittedEvents.push(envelope);
    });

    const testMode: ReflectionMode = 'makro';
    bus.emit(REFLECTION_MODE_EVENT, {
      mode: testMode,
      timestamp: new Date().toISOString(),
    });

    assert(emittedEvents.length === 1, 'Händelse ska tas emot på bussen');
    assert(emittedEvents[0].type === REFLECTION_MODE_EVENT, 'Händelsetyp ska vara UI_REFLECTION_MODE_CHANGED');
    assert(emittedEvents[0].data.mode === 'makro', 'Mode ska vara makro');
    assert(Boolean(emittedEvents[0].id), 'CloudEvents 1.0 id ska finnas');
    assert(emittedEvents[0].specversion === '1.0', 'CloudEvents specversion ska vara 1.0');

    results.push({ name: 'State-export och CloudEvents 1.0 över SwarmEventBus', passed: true });
  } catch (err: any) {
    results.push({ name: 'State-export och CloudEvents 1.0 över SwarmEventBus', passed: false, error: err.message });
  }

  // Test 3: SymbolCrown reagerar på reflektionsläge och CrownStateSchema validerar
  try {
    const initialCrown: CrownState = {
      symbol: '⇑',
      color: 'ACTIVE',
      activityText: 'Initial text',
    };

    const mockEnvelope: any = {
      id: 'evt-test-1',
      source: 'outreach/ui/event',
      type: REFLECTION_MODE_EVENT,
      specversion: '1.0',
      time: new Date().toISOString(),
      data: {
        mode: 'meta',
      },
    };

    const updatedCrown = resolveCrownFromEnvelope(mockEnvelope, initialCrown);
    assert(updatedCrown.activityText === 'Reflektionsläge: meta', 'activityText ska uppdateras till Reflektionsläge: meta');
    assert(CrownStateSchema.safeParse(updatedCrown).success, 'Uppdaterad krona ska valideras av CrownStateSchema');

    results.push({ name: 'SymbolCrown visuell feedback och CrownState Zod-validering', passed: true });
  } catch (err: any) {
    results.push({ name: 'SymbolCrown visuell feedback och CrownState Zod-validering', passed: false, error: err.message });
  }

  // Test 4: AST-kontroll, radgränser och mock-spärrar för samtliga berörda UI-filer
  try {
    const filesToAudit = [
      'src/features/gemini_live_swarm/ui/reflectionStateHelper.ts',
      'src/features/gemini_live_swarm/ui/ReflectionModeSelector.tsx',
      'src/features/gemini_live_swarm/ui/AppShell.tsx',
      'src/features/gemini_live_swarm/ui/crownStateHelper.ts',
      'src/features/gemini_live_swarm/ui/SymbolCrown.tsx',
      'src/features/gemini_live_swarm/ui/SplitPaneCanvas.tsx',
    ];

    for (const relPath of filesToAudit) {
      const fullPath = path.join(rootDir, relPath);
      const content = fs.readFileSync(fullPath, 'utf8');

      const astRes = checkAstMetrics(fullPath, content);
      assert(astRes.valid, `AST-fel i ${relPath}: ${astRes.error}`);

      const mockRes = checkNoProductionMocks(fullPath, content);
      assert(mockRes.valid, `Mock-fel i ${relPath}: ${mockRes.error}`);
    }

    results.push({ name: 'AST- och mock-regler för berörda UI-moduler (TCK-023a)', passed: true });
  } catch (err: any) {
    results.push({ name: 'AST- och mock-regler för berörda UI-moduler (TCK-023a)', passed: false, error: err.message });
  }

  return results;
}
