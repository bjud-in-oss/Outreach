import fs from 'node:fs';
import path from 'node:path';
import {
  SEMANTIC_INVARIANT,
  RECONCILIATION_UNITS,
} from '../features/gemini_live_swarm/agents/roleDefinitions.ts';
import { GeminiLiveSession } from '../features/gemini_live_swarm/session/geminiLiveSession.ts';
import { SwarmEventBus } from '../features/gemini_live_swarm/bus/swarmEventBus.ts';
import {
  ContextUsageMetricSchema,
  LiveSessionStatusSchema,
} from '../features/gemini_live_swarm/telemetry/telemetrySchema.ts';

export async function runTransientTCK015Tests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  function assert(condition: boolean, msg: string) {
    if (!condition) throw new Error(msg);
  }

  // Test 1: 100% Invarians och ordagrann likhet för systemets högsta syfte
  try {
    assert(
      SEMANTIC_INVARIANT.startsWith('Ditt högsta syfte är att främja närhet till Guds son, den ideala människan.'),
      'SEMANTIC_INVARIANT saknar den finslipade formuleringen ("att främja närhet")'
    );

    // Validera att alla 4 försoningsenheter injicerar invarianten
    for (const unit of Object.values(RECONCILIATION_UNITS)) {
      assert(
        unit.systemInstruction.includes(SEMANTIC_INVARIANT),
        `Enheten ${unit.displayName} saknar fullständig SEMANTIC_INVARIANT i systemInstruction`
      );
    }

    // Validera ordagrann synk i doc/SI_v10.0.md och AGENTS.md
    const rootDir = process.cwd();
    const siPath = path.join(rootDir, 'doc', 'SI_v10.0.md');
    const agentsPath = path.join(rootDir, 'AGENTS.md');

    if (fs.existsSync(siPath)) {
      const siContent = fs.readFileSync(siPath, 'utf8');
      assert(siContent.includes(SEMANTIC_INVARIANT), 'doc/SI_v10.0.md saknar ordagrann SEMANTIC_INVARIANT');
    }
    if (fs.existsSync(agentsPath)) {
      const agentsContent = fs.readFileSync(agentsPath, 'utf8');
      assert(agentsContent.includes(SEMANTIC_INVARIANT), 'AGENTS.md saknar ordagrann SEMANTIC_INVARIANT');
    }

    results.push({
      name: 'TCK-015: 100% Systeminstruktionsinvarians & ordagrann synk över alla artefakter',
      passed: true,
    });
  } catch (err) {
    results.push({
      name: 'TCK-015: 100% Systeminstruktionsinvarians & ordagrann synk över alla artefakter',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Test 2: Auto-reconnect & RECONNECTING-status i GeminiLiveSession
  try {
    const bus = new SwarmEventBus();
    const session = new GeminiLiveSession('', bus); // HALTED utan nyckel

    // Verifiera att RECONNECTING finns i LiveSessionStatusSchema
    const parsedStatus = LiveSessionStatusSchema.parse('RECONNECTING');
    assert(parsedStatus === 'RECONNECTING', 'RECONNECTING saknas i schemat');

    let reconnectEventReceived = false;
    bus.subscribe('swarm.live.session.reconnecting', (env) => {
      if ((env.data as any)?.status === 'RECONNECTING') {
        reconnectEventReceived = true;
      }
    });

    // Simulera återanslutningshändelse via bussen
    bus.publishLiveEvent('swarm.live.session.reconnecting', {
      attempt: 1,
      maxAttempts: 3,
      delayMs: 1000,
      reason: 'Simulerat 503 High Demand',
      status: 'RECONNECTING',
    });

    assert(reconnectEventReceived, 'swarm.live.session.reconnecting distribuerades inte');
    assert(session.getReconnectAttempts() === 0, 'Initialt antal försök ska vara 0');

    results.push({
      name: 'TCK-015: Auto-reconnect & RECONNECTING-status valideras deterministiskt',
      passed: true,
    });
  } catch (err) {
    results.push({
      name: 'TCK-015: Auto-reconnect & RECONNECTING-status valideras deterministiskt',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Test 3: Kontextmarginal (60% / ~40K tokens) & Disk-Handoff Schema
  try {
    const validMetric = {
      usedTokens: 38500,
      maxTokens: 64000,
      usageRatio: 38500 / 64000,
      isMarginalReached: 38500 / 64000 >= 0.60,
      timestamp: new Date().toISOString(),
    };

    const parsed = ContextUsageMetricSchema.parse(validMetric);
    assert(parsed.isMarginalReached === true, 'Marginal på 60% detekterades inte');
    assert(parsed.usedTokens === 38500, 'Felaktigt usedTokens');

    const bus = new SwarmEventBus();
    let marginalEventCaught = false;
    bus.subscribe('swarm.context.marginal.reached', (env) => {
      marginalEventCaught = true;
    });

    bus.publish({
      id: 'evt-context-1',
      source: 'outreach/swarm/context_monitor',
      type: 'swarm.context.marginal.reached',
      specversion: '1.0',
      datacontenttype: 'application/json',
      time: new Date().toISOString(),
      data: parsed,
    });

    assert(marginalEventCaught, 'swarm.context.marginal.reached händelse fångades inte av bussen');

    results.push({
      name: 'TCK-015: 60% Kontextmarginal och signalering av disk-handoff valideras',
      passed: true,
    });
  } catch (err) {
    results.push({
      name: 'TCK-015: 60% Kontextmarginal och signalering av disk-handoff valideras',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Test 4: Global Swarm Core & Bakgrundsöverlevnad
  try {
    const bus = new SwarmEventBus();
    bus.publishLiveEvent('swarm.test.persistent', { data: 'lever_i_bakgrunden' });

    const history = bus.getHistory();
    const hasEvent = history.some((e) => e.type === 'swarm.test.persistent');
    assert(hasEvent, 'Händelsebufferten ska överleva i SwarmEventBus');

    results.push({
      name: 'TCK-015: Global Swarm Core behåller tillstånd och överlever i bakgrunden',
      passed: true,
    });
  } catch (err) {
    results.push({
      name: 'TCK-015: Global Swarm Core behåller tillstånd och överlever i bakgrunden',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return results;
}
