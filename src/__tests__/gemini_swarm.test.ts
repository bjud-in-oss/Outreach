import { SwarmOrchestrator } from '../features/gemini_live_swarm/coordinator/swarmOrchestrator.ts';
import { RECONCILIATION_UNITS } from '../features/gemini_live_swarm/agents/roleDefinitions.ts';

export async function runSwarmTests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results = [];

  // Test 1: De 4 försoningsenheterna är korrekt konfigurerade utan legacy-roller
  try {
    const units = Object.keys(RECONCILIATION_UNITS);
    const hasAll = ['ATT_FOLJA', 'ATT_VANDA_OM', 'ATT_FORLIKAS', 'SERIELL_MOTOR'].every((u) =>
      units.includes(u)
    );
    const isExactly4 = units.length === 4;
    results.push({
      name: 'Reconciliation units definition includes all 4 units and no legacy roles',
      passed: hasAll && isExactly4,
    });
  } catch (err) {
    results.push({
      name: 'Reconciliation units definition includes all 4 units and no legacy roles',
      passed: false,
      error: String(err),
    });
  }

  // Test 2: Swarm orkestrator initialiseras med 4 enheter
  try {
    const orchestrator = new SwarmOrchestrator();
    const allUnits = orchestrator.getAllUnits();
    results.push({
      name: 'Swarm orchestrator initializes exactly 4 reconciliation units',
      passed: allUnits.length === 4,
    });
  } catch (err) {
    results.push({
      name: 'Swarm orchestrator initializes exactly 4 reconciliation units',
      passed: false,
      error: String(err),
    });
  }

  // Test 3: Planering av kampanj skapar strukturerade faser
  try {
    const orchestrator = new SwarmOrchestrator();
    const plan = orchestrator.createCampaignPlan({
      title: 'Nordic AI Outreach',
      targetAudience: 'CTO och Innovationsledare',
      valueProposition: 'Autonoma outreach-arbetsflöden med Google Workspace',
    });

    const passed = (plan.steps.length === 3 || plan.steps.length === 4) && plan.status === 'READY';
    results.push({ name: 'Campaign plan generated with stages and READY status', passed });
  } catch (err) {
    results.push({ name: 'Campaign plan generated with stages and READY status', passed: false, error: String(err) });
  }

  return results;
}
