import {
  RECONCILIATION_UNITS,
  ReconciliationForce,
  ReconciliationUnitConfig,
} from '../agents/roleDefinitions.ts';
import { GeminiLiveSession } from '../session/geminiLiveSession.ts';
import { EventEnvelope } from '../../../shared/contracts/envelope.ts';
import { McpSwarmBridge } from '../../mcp_bridge/orchestrator/mcpSwarmBridge.ts';
import { getGlobalSwarmEventBus, SwarmEventBus } from '../bus/swarmEventBus.ts';
import {
  ReflectionMode,
  REFLECTION_MODE_EVENT,
  isValidReflectionMode,
} from '../ui/reflectionStateHelper.ts';

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
  private reflectionMode: ReflectionMode = 'normal';
  private tokenThroughputPerMinute = 0;

  constructor(session?: GeminiLiveSession, mcpBridge?: McpSwarmBridge, eventBus?: SwarmEventBus) {
    this.session = session || new GeminiLiveSession();
    this.mcpBridge = mcpBridge;
    this.eventBus = eventBus || getGlobalSwarmEventBus();
    this.units = new Map();
    const activeForces: ReconciliationForce[] = ['ATT_FOLJA', 'ATT_VANDA_OM', 'ATT_FORLIKAS', 'SERIELL_MOTOR'];
    for (const force of activeForces) {
      if (RECONCILIATION_UNITS[force]) this.units.set(force, { ...RECONCILIATION_UNITS[force] });
    }
    this.eventBus.subscribe(REFLECTION_MODE_EVENT, (env) => {
      const mode = (env.data as any)?.mode;
      if (isValidReflectionMode(mode)) this.reflectionMode = mode;
    });
  }

  public getMcpBridge(): McpSwarmBridge | undefined { return this.mcpBridge; }
  public setMcpBridge(bridge: McpSwarmBridge): void { this.mcpBridge = bridge; }
  public getActiveAgents(): ReconciliationUnitConfig[] { return Array.from(this.units.values()).slice(0, MAX_CONCURRENT_AGENTS); }
  public getSerialEngine(): ReconciliationUnitConfig { return this.units.get('SERIELL_MOTOR') || { ...RECONCILIATION_UNITS.SERIELL_MOTOR }; }
  public getAllUnits(): ReconciliationUnitConfig[] { return Array.from(this.units.values()); }
  public getReflectionMode(): ReflectionMode { return this.reflectionMode; }
  public setReflectionMode(mode: ReflectionMode): void { this.reflectionMode = mode; }
  public getTokenThroughput(): number { return this.tokenThroughputPerMinute; }

  public handleVadSilence(silenceDurationMs: number): boolean {
    if (silenceDurationMs > 400) {
      this.session.sendTurnComplete('forlikas');
      this.eventBus.publishLiveEvent('swarm.live.vad.turn_complete', {
        silenceDurationMs, action: 'TURN_COMPLETE_SENT', channel: 'forlikas',
      });
      return true;
    }
    return false;
  }

  public async synthesizeBackgroundAgents(task: string, context?: string): Promise<{
    foljaOutput: string; vandaOmOutput: string; synthesis: string;
  }> {
    const folja = this.units.get('ATT_FOLJA');
    const vandaOm = this.units.get('ATT_VANDA_OM');
    const forlikas = this.units.get('ATT_FORLIKAS');

    const [foljaTurn, vandaOmTurn] = await Promise.all([
      this.session.generateAgentTurn({
        role: 'ATT_FOLJA', systemInstruction: folja?.systemInstruction || '',
        prompt: `Skapa förslag för: ${task}`, context,
      }),
      this.session.generateAgentTurn({
        role: 'ATT_VANDA_OM', systemInstruction: vandaOm?.systemInstruction || '',
        prompt: `Självrannsaka förslag för: ${task}`, context,
      }),
    ]);

    const hostTurn = await this.session.generateAgentTurn({
      role: 'ATT_FORLIKAS', systemInstruction: forlikas?.systemInstruction || '',
      prompt: `Förlika perspektiv:\n1: ${foljaTurn.content}\n2: ${vandaOmTurn.content}`, context,
    });

    this.tokenThroughputPerMinute += 1200;
    return { foljaOutput: foljaTurn.content, vandaOmOutput: vandaOmTurn.content, synthesis: hostTurn.content };
  }

  public async runReflectionPhase(task: string): Promise<{
    reflectionMode: ReflectionMode; iterations: number; saturated: boolean; synthesis: string;
  }> {
    const cycleMap: Record<ReflectionMode, number> = { normal: 0, mikro: 1, makro: 2, meta: 3 };
    const iterations = cycleMap[this.reflectionMode];
    let synthesis = 'Debriefing klar. Omedelbar tystnad.';
    for (let i = 0; i < iterations; i++) {
      const res = await this.synthesizeBackgroundAgents(task, `Varv ${i + 1}/${iterations}`);
      synthesis = res.synthesis;
    }
    this.eventBus.publish({
      id: `evt-reflection-${Date.now()}`, source: 'outreach/swarm/reflection',
      type: 'swarm.reflection.completed', specversion: '1.0', datacontenttype: 'application/json',
      time: new Date().toISOString(),
      data: { reflectionMode: this.reflectionMode, iterations, saturation: 'JA', tokenThroughputPerMinute: this.tokenThroughputPerMinute },
    });
    return { reflectionMode: this.reflectionMode, iterations, saturated: true, synthesis };
  }

  public createCampaignPlan(input: CampaignInput, mode: 'SAMORDNING' | 'STEGVIS_BYGGE' = 'SAMORDNING'): CampaignPlan {
    const motorTitle = mode === 'STEGVIS_BYGGE'
      ? `${RECONCILIATION_UNITS.SERIELL_MOTOR.displayName}: Stegvis exekvering & fasvalidering`
      : `${RECONCILIATION_UNITS.SERIELL_MOTOR.displayName}: Praktisk leveranskonstruktion`;
    return {
      id: `plan-${Date.now()}`, input, status: 'READY',
      steps: [
        { agentRole: 'ATT_FOLJA', title: `${RECONCILIATION_UNITS.ATT_FOLJA.displayName}: Behovsanalys`, output: '', status: 'PENDING' },
        { agentRole: 'ATT_VANDA_OM', title: `${RECONCILIATION_UNITS.ATT_VANDA_OM.displayName}: Självrannsakan`, output: '', status: 'PENDING' },
        { agentRole: 'ATT_FORLIKAS', title: `${RECONCILIATION_UNITS.ATT_FORLIKAS.displayName}: Konsensus`, output: '', status: 'PENDING' },
        { agentRole: 'SERIELL_MOTOR', title: motorTitle, output: '', status: 'PENDING' },
      ],
    };
  }

  public async triggerHandoffToBuilder(task: string): Promise<string[]> {
    this.eventBus.publish({
      id: `evt-handoff-${Date.now()}`, source: 'outreach/swarm/live_agents',
      type: 'swarm.handoff.to_builder', specversion: '1.0', datacontenttype: 'application/json',
      time: new Date().toISOString(), data: { task, maxAllowedAgents: MAX_CONCURRENT_AGENTS },
    });
    const stages: Array<'1a_forsta' | '1b_kartlagga' | '2a_avgransa' | '2b_modellera' | '2e_syntetisera' | '3c_spec'> = [
      '1a_forsta', '1b_kartlagga', '2a_avgransa', '2b_modellera', '2e_syntetisera', '3c_spec',
    ];
    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      const isTokenGate = stage === '3c_spec';
      this.eventBus.publishSerialMetric({
        pipelineId: `pipe-${Date.now()}`, ticketId: 'TCK-013', stepIndex: i + 1, totalSteps: 7,
        currentStage: stage, stageStatus: isTokenGate ? 'GATED' : 'COMPLETED', durationMs: 120,
        isTokenGated: isTokenGate, requiredTokenHash: isTokenGate ? 'TCK-013-TOKEN' : undefined,
        lastTransitionAt: new Date().toISOString(), activeForce: 'SERIELL_MOTOR',
      });
    }
    this.eventBus.publish({
      id: `evt-consensus-${Date.now()}`, source: 'outreach/swarm/live_consensus',
      type: 'swarm.consensus.completed', specversion: '1.0', datacontenttype: 'application/json',
      time: new Date().toISOString(), data: { task, consensusScore: 9.8, status: 'TOKEN_GATED_APPROVAL_REQUIRED' },
    });
    return stages;
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
        role: step.agentRole, systemInstruction: unit?.systemInstruction || '',
        prompt: `${plan.input.title}: ${plan.input.valueProposition}`, context: sharedContext,
      });
      step.output = turnResult.content;
      step.score = turnResult.score;
      step.status = 'COMPLETED';
      if (unit) { unit.status = 'DONE'; unit.currentThought = turnResult.thought; }
      sharedContext += `\n--- [Resultat från ${unit?.displayName || step.agentRole}] ---\n${turnResult.content}\n`;
      await this.runMcpStep(step, plan, turnResult, onEnvelopeGenerated);
      onStepUpdate?.(step, i);
      onEnvelopeGenerated?.({
        id: `evt-step-${i + 1}-${Date.now()}`, source: `outreach/swarm/${step.agentRole.toLowerCase()}`,
        type: `swarm.step.${step.agentRole.toLowerCase()}.completed`, specversion: '1.0', datacontenttype: 'application/json',
        time: new Date().toISOString(),
        data: { planId: plan.id, force: step.agentRole, displayName: unit?.displayName || step.agentRole, title: step.title, summary: step.output.slice(0, 120), score: step.score },
      });
    }
    plan.status = 'COMPLETED';
    return plan;
  }

  private async runMcpStep(
    step: SwarmStep, plan: CampaignPlan, turn: { content: string; score?: number }, onEnv?: (env: EventEnvelope) => void
  ): Promise<void> {
    if (!this.mcpBridge) return;
    if (step.agentRole === 'ATT_FOLJA') {
      plan.finalDraft = turn.content;
      const res = await this.mcpBridge.executeTool('drive_create_file', { fileName: `Kampanj_${plan.input.title.replace(/\s+/g, '_')}.md`, folder: 'Campaigns', content: turn.content });
      if (res.envelope) onEnv?.(res.envelope);
      if (this.session?.sendToolResponse) this.session.sendToolResponse(res.bidiResponse.functionResponses, 'NON_BLOCKING');
    }
    if (step.agentRole === 'ATT_VANDA_OM') {
      if (turn.score) plan.consensusScore = turn.score;
      const res = await this.mcpBridge.executeTool('outreach_evaluate_tone', { draftText: plan.finalDraft || turn.content, recipientProfile: plan.input.targetAudience });
      if (res.envelope) onEnv?.(res.envelope);
      if (this.session?.sendToolResponse) this.session.sendToolResponse(res.bidiResponse.functionResponses, 'NON_BLOCKING');
    }
    if (step.agentRole === 'SERIELL_MOTOR') {
      const res = await this.mcpBridge.executeTool('wal_append_entry', { operation: 'BUILD_DELIVERY_PACKAGE', payload: { planId: plan.id, title: plan.input.title } });
      if (res.envelope) onEnv?.(res.envelope);
      if (this.session?.sendToolResponse) this.session.sendToolResponse(res.bidiResponse.functionResponses, 'NON_BLOCKING');
    }
  }

  public async handleToolCall(toolName: string, args: Record<string, any> = {}, callId?: string) {
    if (!this.mcpBridge) return null;
    const res = await this.mcpBridge.executeTool(toolName, args, callId);
    if (this.session?.sendToolResponse) this.session.sendToolResponse(res.bidiResponse.functionResponses, 'NON_BLOCKING');
    return res;
  }
}
