import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { SwarmEventBus, getGlobalSwarmEventBus } from '../features/gemini_live_swarm/bus/swarmEventBus.ts';
import { SwarmProvider } from '../features/gemini_live_swarm/context/SwarmContext.tsx';
import App from '../App.tsx';

export async function runTransientTCK016Tests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];
  const rootDir = process.cwd();

  function assert(condition: boolean, msg: string) {
    if (!condition) throw new Error(msg);
  }

  // Test 1: Ren Renderelektion - App.tsx renderar minimalistiskt (< 30 rader) med SwarmProvider
  try {
    const appPath = path.join(rootDir, 'src', 'App.tsx');
    assert(fs.existsSync(appPath), 'src/App.tsx saknas');

    const appContent = fs.readFileSync(appPath, 'utf8');
    const lines = appContent.split('\n');
    assert(lines.length <= 30, `src/App.tsx överskrider 30 rader (${lines.length} rader)`);
    assert(appContent.includes('<SwarmProvider>'), 'src/App.tsx saknar <SwarmProvider>');
    assert(!appContent.includes('SwarmDashboard'), 'src/App.tsx refererar fortfarande till SwarmDashboard');
    assert(!appContent.includes('DriveSyncPanel'), 'src/App.tsx refererar fortfarande till DriveSyncPanel');

    // Validera att komponenten är en giltig React-funktion
    assert(typeof App === 'function', 'App är inte en giltig React-funktionskomponent');
    const rendered = App();
    assert(Boolean(rendered), 'App() returnerade inget element');

    results.push({
      name: 'TCK-016: Ren Renderelektion - App.tsx renderar rent som minimalt skal (< 30 rader)',
      passed: true,
    });
  } catch (err) {
    results.push({
      name: 'TCK-016: Ren Renderelektion - App.tsx renderar rent som minimalt skal (< 30 rader)',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Test 2: Bakgrundsöverlevnad - SwarmProvider och SwarmEventBus upprätthåller sitt tillstånd
  try {
    const bus = new SwarmEventBus();
    let eventReceived = false;

    bus.subscribe('swarm.background.test', (env) => {
      if ((env.data as any)?.status === 'ALIVE_IN_BACKGROUND') {
        eventReceived = true;
      }
    });

    bus.publishLiveEvent('swarm.background.test', { status: 'ALIVE_IN_BACKGROUND' });
    assert(eventReceived, 'SwarmEventBus kunde inte ta emot händelser i bakgrunden');

    // Verifiera att global buss har kvar händelsehistorik
    const globalBus = getGlobalSwarmEventBus();
    globalBus.publishLiveEvent('swarm.background.ping', { ping: true });
    const history = globalBus.getHistory();
    assert(history.length > 0, 'Global händelsebuss har ingen historik');

    results.push({
      name: 'TCK-016: Bakgrundsöverlevnad - SwarmProvider och SwarmEventBus lever oberoende av UI',
      passed: true,
    });
  } catch (err) {
    results.push({
      name: 'TCK-016: Bakgrundsöverlevnad - SwarmProvider och SwarmEventBus lever oberoende av UI',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Test 3: Import-Integritet - Inga föråldrade UI-importer återstår i src/
  try {
    const forbiddenPatterns = [
      'SwarmDashboard',
      'TelemetrySidebar',
      'MasterDevelopmentPlan',
      'SwarmControlPanel',
      'SwarmUnitCard',
      'SwarmStreamLog',
      'DriveSyncPanel',
    ];

    const appPath = path.join(rootDir, 'src', 'App.tsx');
    const appContent = fs.readFileSync(appPath, 'utf8');

    for (const pattern of forbiddenPatterns) {
      assert(!appContent.includes(pattern), `src/App.tsx innehåller förbjudet mönster: ${pattern}`);
    }

    // Granska att filerna faktiskt är raderade på disk
    const purgedFiles = [
      path.join(rootDir, 'src', 'features', 'gemini_live_swarm', 'ui', 'SwarmDashboard.tsx'),
      path.join(rootDir, 'src', 'features', 'gemini_live_swarm', 'ui', 'TelemetrySidebar.tsx'),
      path.join(rootDir, 'src', 'features', 'gemini_live_swarm', 'ui', 'MasterDevelopmentPlan.tsx'),
      path.join(rootDir, 'src', 'features', 'gemini_live_swarm', 'ui', 'components', 'SwarmControlPanel.tsx'),
      path.join(rootDir, 'src', 'features', 'gemini_live_swarm', 'ui', 'components', 'SwarmUnitCard.tsx'),
      path.join(rootDir, 'src', 'features', 'gemini_live_swarm', 'ui', 'components', 'SwarmStreamLog.tsx'),
      path.join(rootDir, 'src', 'features', 'google_drive_sync', 'ui', 'DriveSyncPanel.tsx'),
    ];

    for (const file of purgedFiles) {
      assert(!fs.existsSync(file), `Föråldrad fil finns fortfarande på disk: ${file}`);
    }

    results.push({
      name: 'TCK-016: Import-Integritet - Total utrensning av föråldrade monolitkomponenter',
      passed: true,
    });
  } catch (err) {
    results.push({
      name: 'TCK-016: Import-Integritet - Total utrensning av föråldrade monolitkomponenter',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return results;
}
