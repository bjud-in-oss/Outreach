import {
  RECONCILIATION_UNITS,
  ReconciliationForce,
  ReconciliationUnitConfig,
} from '../agents/roleDefinitions.ts';
import { GeminiLiveSession } from '../session/geminiLiveSession.ts';
import { EventEnvelope } from '../../../shared/contracts/envelope.ts';
import { McpSwarmBridge } from '../../mcp_bridge/orchestrator/mcpSwarmBridge.ts';
import { getGlobalSwarmEventBus, SwarmEventBus } from '../bus/swarmEventBus.ts';

export const MAX_CONCURRENT_AGENTS = 3;

export interface CampaignInput {
  title: string;
  targetAudience: string;
  valueProposition: string;
}

export interface SwarmStep {
  agentRole: ReconciliationForce;
  title: string;
  output: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  score?: number;
}

export interface CampaignPlan {
  id: string;
  input: CampaignInput;
  steps: SwarmStep[];
  status: 'READY' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  finalDraft?: string;
  consensusScore?: number;
}

export class SwarmOrchestrator {
  private units: Map<ReconciliationForce, ReconciliationUnitConfig>;
  private session: GeminiLiveSession;
  private mcpBridge?: McpSwarmBridge;
  private eventBus: SwarmEventBus;

  constructor(session?: GeminiLiveSession, mcpBridge?: McpSwarmBridge, eventBus?: SwarmEventBus) {
    this.session = session || new GeminiLiveSession();
    this.mcpBridge = mcpBridge;
    this.eventBus = eventBus || getGlobalSwarmEventBus();
    this.units = new Map();
    const activeForces: ReconciliationForce[] = [
      'ATT_FOLJA',
      'ATT_VANDA_OM',
      'ATT_FORLIKAS',
      'SERIELL_MOTOR',
    ];
    for (const force of activeForces) {
      if (RECONCILIATION_UNITS[force]) {
        this.units.set(force, { ...RECONCILIATION_UNITS[force] });
      }
    }
  }

  public getMcpBridge(): McpSwarmBridge | undefined {
    return this.mcpBridge;
  }

  public setMcpBridge(bridge: McpSwarmBridge): void {
    this.mcpBridge = bridge;
  }

  public getActiveAgents(): ReconciliationUnitConfig[] {
    const list = Array.from(this.units.values());
    return list.slice(0, MAX_CONCURRENT_AGENTS);
  }

  public getSerialEngine(): ReconciliationUnitConfig {
    return this.units.get('SERIELL_MOTOR') || { ...RECONCILIATION_UNITS.SERIELL_MOTOR };
  }

  public getAllUnits(): ReconciliationUnitConfig[] {
    return Array.from(this.units.values());
  }

  public createCampaignPlan(
    input: CampaignInput,
    mode: 'SAMORDNING' | 'STEGVIS_BYGGE' = 'SAMORDNING'
  ): CampaignPlan {
    const motorTitle = mode === 'STEGVIS_BYGGE'
      ? `${RECONCILIATION_UNITS.SERIELL_MOTOR.displayName}: Stegvis exekvering & fasvalidering`
      : `${RECONCILIATION_UNITS.SERIELL_MOTOR.displayName}: Praktisk leveranskonstruktion`;

    const steps: SwarmStep[] = [
      { agentRole: 'ATT_FOLJA', title: `${RECONCILIATION_UNITS.ATT_FOLJA.displayName}: Behovs- och kontaktpunktsanalys`, output: '', status: 'PENDING' },
      { agentRole: 'ATT_VANDA_OM', title: `${RECONCILIATION_UNITS.ATT_VANDA_OM.displayName}: Etisk självrannsakan & Fail-Fast`, output: '', status: 'PENDING' },
      { agentRole: 'ATT_FORLIKAS', title: `${RECONCILIATION_UNITS.ATT_FORLIKAS.displayName}: Sammanvävande konsensus & helande`, output: '', status: 'PENDING' },
      { agentRole: 'SERIELL_MOTOR', title: motorTitle, output: '', status: 'PENDING' },
    ];

    return { id: `plan-${Date.now()}`, input, steps, status: 'READY' };
  }

  public async triggerHandoffToBuilder(task: string): Promise<string[]> {
    this.eventBus.publish({
      id: `evt-handoff-${Date.now()}`,
      source: 'outreach/swarm/live_agents',
      type: 'swarm.handoff.to_builder',
      specversion: '1.0',
      datacontenttype: 'application/json',
      time: new Date().toISOString(),
      data: { task, maxAllowedAgents: MAX_CONCURRENT_AGENTS },
    });

    const stages: Array<'1a_forsta' | '1b_kartlagga' | '2a_avgransa' | '2b_modellera' | '2e_syntetisera' | '3c_spec'> = [
      '1a_forsta',
      '1b_kartlagga',
      '2a_avgransa',
      '2b_modellera',
      '2e_syntetisera',
      '3c_spec',
    ];

    const completedStages: string[] = [];
    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      const isTokenGate = stage === '3c_spec';
      completedStages.push(stage);

      this.eventBus.publishSerialMetric({
        pipelineId: `pipe-${Date.now()}`,
        ticketId: 'TCK-013',
        stepIndex: i + 1,
        totalSteps: 7,
        currentStage: stage,
        stageStatus: isTokenGate ? 'GATED' : 'COMPLETED',
        durationMs: 120,
        isTokenGated: isTokenGate,
        requiredTokenHash: isTokenGate ? 'TCK-013-TOKEN' : undefined,
        lastTransitionAt: new Date().toISOString(),
        activeForce: 'SERIELL_MOTOR',
      });
    }

    this.eventBus.publish({
      id: `evt-consensus-${Date.now()}`,
      source: 'outreach/swarm/live_consensus',
      type: 'swarm.consensus.completed',
      specversion: '1.0',
      datacontenttype: 'application/json',
      time: new Date().toISOString(),
      data: { task, consensusScore: 9.8, status: 'TOKEN_GATED_APPROVAL_REQUIRED' },
    });

    return completedStages;
  }

  public async executeCampaign(
    plan: CampaignPlan,
    onStepUpdate?: (step: SwarmStep, stepIndex: number) => void,
    onEnvelopeGenerated?: (envelope: EventEnvelope) => void
  ): Promise<CampaignPlan> {
    plan.status = 'IN_PROGRESS';
    let sharedContext = `Målgrupp: ${plan.input.targetAudience}\nVärdeerbjudande: ${plan.input.valueProposition}\n`;

    for (let i = 0; i < plan.steps.length; i++) {
      const step = plan.steps[i];
      step.status = 'RUNNING';
      onStepUpdate?.(step, i);

      const unit = this.units.get(step.agentRole);
      if (unit) unit.status = 'THINKING';

      const turnResult = await this.session.generateAgentTurn({
        role: step.agentRole,
        systemInstruction: unit?.systemInstruction || '',
        prompt: `${plan.input.title}: ${plan.input.valueProposition}`,
        context: sharedContext,
      });

      step.output = turnResult.content;
      step.score = turnResult.score;
      step.status = 'COMPLETED';

      if (unit) {
        unit.status = 'DONE';
        unit.currentThought = turnResult.thought;
      }

      sharedContext += `\n--- [Resultat från ${unit?.displayName || step.agentRole}] ---\n${turnResult.content}\n`;
      await this.runMcpStep(step, plan, turnResult, onEnvelopeGenerated);
      onStepUpdate?.(step, i);

      const envelope: EventEnvelope = {
        id: `evt-step-${i + 1}-${Date.now()}`,
        source: `outreach/swarm/${step.agentRole.toLowerCase()}`,
        type: `swarm.step.${step.agentRole.toLowerCase()}.completed`,
        specversion: '1.0',
        datacontenttype: 'application/json',
        time: new Date().toISOString(),
        data: {
          planId: plan.id,
          force: step.agentRole,
          displayName: unit?.displayName || step.agentRole,
          title: step.title,
          summary: step.output.slice(0, 120),
          score: step.score,
        },
      };

      onEnvelopeGenerated?.(envelope);
    }

    plan.status = 'COMPLETED';
    return plan;
  }

  private async runMcpStep(
    step: SwarmStep,
    plan: CampaignPlan,
    turn: { content: string; score?: number },
    onEnv?: (envelope: EventEnvelope) => void
  ): Promise<void> {
    if (!this.mcpBridge) return;
    if (step.agentRole === 'ATT_FOLJA') {
      plan.finalDraft = turn.content;
      const res = await this.mcpBridge.executeTool('drive_create_file', {
        fileName: `Kampanj_${plan.input.title.replace(/\s+/g, '_')}.md`,
        folder: 'Campaigns',
        content: turn.content,
      });
      if (res.envelope) onEnv?.(res.envelope);
    }
    if (step.agentRole === 'ATT_VANDA_OM') {
      if (turn.score) plan.consensusScore = turn.score;
      const res = await this.mcpBridge.executeTool('outreach_evaluate_tone', {
        draftText: plan.finalDraft || turn.content,
        recipientProfile: plan.input.targetAudience,
      });
      if (res.envelope) onEnv?.(res.envelope);
    }
    if (step.agentRole === 'SERIELL_MOTOR') {
      const res = await this.mcpBridge.executeTool('wal_append_entry', {
        operation: 'BUILD_DELIVERY_PACKAGE',
        payload: { planId: plan.id, title: plan.input.title },
      });
      if (res.envelope) onEnv?.(res.envelope);
    }
  }
}
