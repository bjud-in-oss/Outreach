import { SwarmOrchestrator } from '../features/gemini_live_swarm/coordinator/swarmOrchestrator.ts';
import {
  DEFAULT_SWARM_ROLES,
  getActiveAgentKrafter,
  getSerialMotorAgent,
} from '../features/gemini_live_swarm/agents/roleDefinitions.ts';

export async function runSwarmTests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results = [];

  // Test 1: Roller är korrekt konfigurerade inklusive krafter och seriell motor
  try {
    const roles = Object.keys(DEFAULT_SWARM_ROLES);
    const hasKrafter = ['ATT_FORLIKAS', 'ATT_FOLJA', 'ATT_VANDA_OM', 'SERIELL_MOTOR'].every((r) =>
      roles.includes(r)
    );
    const hasLegacy = ['ORCHESTRATOR', 'RESEARCHER', 'OUTREACH_WRITER', 'CRITIC'].every((r) =>
      roles.includes(r)
    );
    results.push({
      name: 'Swarm roles definition includes SI v10.0 krafter and legacy aliases',
      passed: hasKrafter && hasLegacy,
    });
  } catch (err) {
    results.push({
      name: 'Swarm roles definition includes SI v10.0 krafter and legacy aliases',
      passed: false,
      error: String(err),
    });
  }

  // Test 2: Swarm orkestrator initialiseras med de 3 aktiva krafterna och seriell motor
  try {
    const orchestrator = new SwarmOrchestrator();
    const activeKrafter = orchestrator.getActiveAgents();
    const serialMotor = orchestrator.getSerialMotor();
    const allAgents = orchestrator.getAllAgents();
    const passed = activeKrafter.length === 3 && serialMotor.role === 'SERIELL_MOTOR' && allAgents.length === 4;
    results.push({
      name: 'Swarm orchestrator initializes 3 active krafter and 4th serial motor',
      passed,
    });
  } catch (err) {
    results.push({
      name: 'Swarm orchestrator initializes 3 active krafter and 4th serial motor',
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

    const passed = plan.steps.length === 3 && plan.status === 'READY';
    results.push({ name: 'Campaign plan generated with stages and READY status', passed });
  } catch (err) {
    results.push({ name: 'Campaign plan generated with stages and READY status', passed: false, error: String(err) });
  }

  return results;
}
