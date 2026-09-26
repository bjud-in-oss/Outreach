import { SwarmOrchestrator } from '../features/gemini_live_swarm/coordinator/swarmOrchestrator.ts';
import { DEFAULT_SWARM_ROLES } from '../features/gemini_live_swarm/agents/roleDefinitions.ts';

export async function runSwarmTests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results = [];

  // Test 1: Roller är korrekt konfigurerade
  try {
    const roles = Object.keys(DEFAULT_SWARM_ROLES);
    const hasAll = ['ORCHESTRATOR', 'RESEARCHER', 'OUTREACH_WRITER', 'CRITIC'].every((r) =>
      roles.includes(r)
    );
    results.push({ name: 'Swarm roles definition includes all 4 standard agents', passed: hasAll });
  } catch (err) {
    results.push({ name: 'Swarm roles definition includes all 4 standard agents', passed: false, error: String(err) });
  }

  // Test 2: Swarm orkestrator initialiseras med default-agenter
  try {
    const orchestrator = new SwarmOrchestrator();
    const agents = orchestrator.getActiveAgents();
    results.push({ name: 'Swarm orchestrator initializes 4 active agent instances', passed: agents.length === 4 });
  } catch (err) {
    results.push({ name: 'Swarm orchestrator initializes 4 active agent instances', passed: false, error: String(err) });
  }

  // Test 3: Planering av kampanj skapar strukturerade faser
  try {
    const orchestrator = new SwarmOrchestrator();
    const plan = orchestrator.createCampaignPlan({
      title: 'Nordic AI Outreach',
      targetAudience: 'CTO och Innovationsledare',
      valueProposition: 'Autonoma outreach-arbetsflöden med Google Workspace',
    });

    const passed = plan.steps.length === 3 && plan.status === 'READY';
    results.push({ name: 'Campaign plan generated with stages and READY status', passed });
  } catch (err) {
    results.push({ name: 'Campaign plan generated with stages and READY status', passed: false, error: String(err) });
  }

  return results;
}
