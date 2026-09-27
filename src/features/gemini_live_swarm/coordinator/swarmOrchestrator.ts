import {
  RECONCILIATION_UNITS,
  ReconciliationForce,
  ReconciliationUnitConfig,
} from '../agents/roleDefinitions.ts';
import { GeminiLiveSession } from '../session/geminiLiveSession.ts';
import { EventEnvelope } from '../../../shared/contracts/envelope.ts';

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

  constructor(session?: GeminiLiveSession) {
    this.session = session || new GeminiLiveSession();
    this.units = new Map();
    const activeForces: ReconciliationForce[] = ['ATT_FOLJA', 'ATT_VANDA_OM', 'ATT_FORLIKAS'];
    for (const force of activeForces) {
      if (RECONCILIATION_UNITS[force]) {
        this.units.set(force, { ...RECONCILIATION_UNITS[force] });
      }
    }
  }

  public getActiveAgents(): ReconciliationUnitConfig[] {
    return Array.from(this.units.values());
  }

  public getSerialEngine(): ReconciliationUnitConfig {
    return { ...RECONCILIATION_UNITS.SERIELL_MOTOR };
  }

  public getAllUnits(): ReconciliationUnitConfig[] {
    return [
      ...Array.from(this.units.values()),
      { ...RECONCILIATION_UNITS.SERIELL_MOTOR },
    ];
  }

  public createCampaignPlan(input: CampaignInput): CampaignPlan {
    const id = `plan-${Date.now()}`;
    return {
      id,
      input,
      status: 'READY',
      steps: [
        {
          agentRole: 'ATT_FOLJA',
          title: 'Att följa Guds son: Behovs- och kontaktpunktsanalys',
          output: '',
          status: 'PENDING',
        },
        {
          agentRole: 'ATT_VANDA_OM',
          title: 'Att vända om till Gud: Etisk självrannsakan & Fail-Fast',
          output: '',
          status: 'PENDING',
        },
        {
          agentRole: 'ATT_FORLIKAS',
          title: 'Att förlikas med Gud: Sammanvävande konsensus & helande',
          output: '',
          status: 'PENDING',
        },
      ],
    };
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
      if (unit) {
        unit.status = 'THINKING';
      }

      // Kör AI / GenAI försoningstur
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

      if (step.agentRole === 'ATT_FOLJA') {
        plan.finalDraft = turnResult.content;
      }
      if (step.agentRole === 'ATT_VANDA_OM' && turnResult.score) {
        plan.consensusScore = turnResult.score;
      }

      onStepUpdate?.(step, i);

      // Skapa CloudEvents envelope
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
}
