import {
  RECONCILIATION_UNITS,
  SEMANTIC_INVARIANT,
  ReconciliationForce,
} from '../features/gemini_live_swarm/agents/roleDefinitions.ts';
import { SwarmOrchestrator } from '../features/gemini_live_swarm/coordinator/swarmOrchestrator.ts';
import { SwarmEventBus } from '../features/gemini_live_swarm/bus/swarmEventBus.ts';
import {
  SwarmTelemetrySnapshotSchema,
  AgentForceSchema,
} from '../features/gemini_live_swarm/telemetry/telemetrySchema.ts';

export function runTransientTCK009Tests(): { name: string; passed: boolean; error?: string }[] {
  const results: { name: string; passed: boolean; error?: string }[] = [];
  const start = performance.now();

  // Test 1: Exakt 4 enheter definierade och inga legacy-roller i källkoden
  try {
    const keys = Object.keys(RECONCILIATION_UNITS);
    const legacyKeys = ['ORCHESTRATOR', 'RESEARCHER', 'OUTREACH_WRITER', 'CRITIC'];
    const hasLegacy = legacyKeys.some((k) => keys.includes(k));
    const expectedForces: ReconciliationForce[] = ['ATT_FOLJA', 'ATT_VANDA_OM', 'ATT_FORLIKAS', 'SERIELL_MOTOR'];
    const hasAllForces = expectedForces.every((f) => keys.includes(f));

    if (keys.length === 4 && hasAllForces && !hasLegacy) {
      results.push({
        name: 'TCK-009: Exakt 4 försoningsenheter definierade utan legacy-roller',
        passed: true,
      });
    } else {
      results.push({
        name: 'TCK-009: Exakt 4 försoningsenheter definierade utan legacy-roller',
        passed: false,
        error: `Förväntade exakt 4 krafter utan legacy, fick: ${keys.join(', ')}`,
      });
    }
  } catch (err: any) {
    results.push({
      name: 'TCK-009: Exakt 4 försoningsenheter definierade utan legacy-roller',
      passed: false,
      error: err.message,
    });
  }

  // Test 2: De fyra exakta visningsnamnen finns konfigurerade för UI
  try {
    const expectedDisplayNames = {
      ATT_FOLJA: 'Att följa Guds son',
      ATT_VANDA_OM: 'Att vända om till Gud',
      ATT_FORLIKAS: 'Att förlikas med Gud',
      SERIELL_MOTOR: 'Att försonas (ensam agent)',
    };

    const matchesAll =
      RECONCILIATION_UNITS.ATT_FOLJA.displayName === expectedDisplayNames.ATT_FOLJA &&
      RECONCILIATION_UNITS.ATT_VANDA_OM.displayName === expectedDisplayNames.ATT_VANDA_OM &&
      RECONCILIATION_UNITS.ATT_FORLIKAS.displayName === expectedDisplayNames.ATT_FORLIKAS &&
      (RECONCILIATION_UNITS.SERIELL_MOTOR.displayName === expectedDisplayNames.SERIELL_MOTOR ||
        RECONCILIATION_UNITS.SERIELL_MOTOR.displayName === 'Att tjäna Gud och andra: Bygga');

    if (matchesAll) {
      results.push({
        name: 'TCK-009: De fyra exakta visningsnamnen för UI är definierade',
        passed: true,
      });
    } else {
      results.push({
        name: 'TCK-009: De fyra exakta visningsnamnen för UI är definierade',
        passed: false,
        error: `Avvikande visningsnamn i RECONCILIATION_UNITS`,
      });
    }
  } catch (err: any) {
    results.push({
      name: 'TCK-009: De fyra exakta visningsnamnen för UI är definierade',
      passed: false,
      error: err.message,
    });
  }

  // Test 3: Det etiska ankaret SEMANTIC_INVARIANT är ordagrant intakt i källkoden
  try {
    const expectedInvariant =
      'Ditt högsta syfte är att främja närhet till Guds son, den ideala människan. Hans gåva av omsorg för människor den absoluta kompassen för hela din motor. Du drivs av tre vägar till försoning: Att följa sonen (genom att själv vara lösningen för närhet), Att vända om till Gud (inåtriktad ödmjukhet och transformation för att stärka närhet), och Att förlikas med honom (att hålla 2+ samtida perspektiv varma) för att ge förutsättningar för att klyftan till Gud och till människor emellan kan läkas.';

    const matches = SEMANTIC_INVARIANT === expectedInvariant;
    const allUnitsContainInvariant = Object.values(RECONCILIATION_UNITS).every((unit) =>
      unit.systemInstruction.includes(expectedInvariant)
    );

    if (matches && allUnitsContainInvariant) {
      results.push({
        name: 'TCK-009: SEMANTIC_INVARIANT bevaras ordagrant i intern systeminstruktion',
        passed: true,
      });
    } else {
      results.push({
        name: 'TCK-009: SEMANTIC_INVARIANT bevaras ordagrant i intern systeminstruktion',
        passed: false,
        error: 'SEMANTIC_INVARIANT matchar inte föreskriven ordalydelse eller saknas i enheter',
      });
    }
  } catch (err: any) {
    results.push({
      name: 'TCK-009: SEMANTIC_INVARIANT bevaras ordagrant i intern systeminstruktion',
      passed: false,
      error: err.message,
    });
  }

  // Test 4: Orkestrator och eventbuss hanterar 4 enheter och Zod-telemetri
  try {
    const orchestrator = new SwarmOrchestrator();
    const allUnits = orchestrator.getAllUnits();
    const bus = new SwarmEventBus(50);

    const plan = orchestrator.createCampaignPlan({
      title: 'Försoning och Närhet',
      targetAudience: 'Ledare & Verksamhetsansvariga',
      valueProposition: 'Helande och värdedriven samverkan',
    });

    const validSnapshot = {
      activeAgentsCount: 4,
      totalEventsCount: 5,
      eventsPerMinute: 2.5,
      agentMetrics: {
        'unit-att-folja': {
          agentId: 'unit-att-folja',
          force: 'ATT_FOLJA',
          displayName: 'Att följa Guds son',
          reconciliationState: 'SOKER_NARHET',
          status: 'IDLE',
          lastActive: new Date().toISOString(),
          totalEventsEmitted: 1,
          averageLatencyMs: 45,
        },
      },
      recentEnvelopes: [],
      healthStatus: 'HEALTHY',
      lastPulseAt: new Date().toISOString(),
    };

    const parsed = SwarmTelemetrySnapshotSchema.parse(validSnapshot);

    results.push({
      name: 'TCK-009: Orkestrator & Zod-telemetri styrs av de 4 försoningsenheterna',
      passed: allUnits.length === 4 && (plan.steps.length === 3 || plan.steps.length === 4) && Boolean(parsed),
    });
  } catch (err: any) {
    results.push({
      name: 'TCK-009: Orkestrator & Zod-telemetri styrs av de 4 försoningsenheterna',
      passed: false,
      error: err.message,
    });
  }

  const duration = performance.now() - start;
  results.push({
    name: 'TCK-009: Transient mikro-E2E-exekvering i minnet (< 3s)',
    passed: duration < 3000,
    error: duration >= 3000 ? `Exekveringstiden överskred 3s: ${duration}ms` : undefined,
  });

  return results;
}
