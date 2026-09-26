import {
  DEFAULT_SWARM_ROLES,
  SwarmAgentConfig,
  SwarmAgentRole,
} from '../agents/roleDefinitions.ts';
import { GeminiLiveSession } from '../session/geminiLiveSession.ts';
import { EventEnvelope } from '../../../shared/contracts/envelope.ts';

export interface CampaignInput {
  title: string;
  targetAudience: string;
  valueProposition: string;
}

export interface SwarmStep {
  agentRole: SwarmAgentRole;
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
  private agents: Map<SwarmAgentRole, SwarmAgentConfig>;
  private session: GeminiLiveSession;

  constructor(session?: GeminiLiveSession) {
    this.session = session || new GeminiLiveSession();
    this.agents = new Map();
    for (const role of Object.keys(DEFAULT_SWARM_ROLES) as SwarmAgentRole[]) {
      this.agents.set(role, { ...DEFAULT_SWARM_ROLES[role] });
    }
  }

  public getActiveAgents(): SwarmAgentConfig[] {
    return Array.from(this.agents.values());
  }

  public createCampaignPlan(input: CampaignInput): CampaignPlan {
    const id = `plan-${Date.now()}`;
    return {
      id,
      input,
      status: 'READY',
      steps: [
        {
          agentRole: 'RESEARCHER',
          title: 'Målgrupps- och kontextanalys',
          output: '',
          status: 'PENDING',
        },
        {
          agentRole: 'OUTREACH_WRITER',
          title: 'Framtagning av personligt utkast',
          output: '',
          status: 'PENDING',
        },
        {
          agentRole: 'CRITIC',
          title: 'Kvalitets- och tonlägesgranskning',
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

      const agent = this.agents.get(step.agentRole);
      if (agent) {
        agent.status = 'THINKING';
      }

      // Kör AI / GenAI svärmtur
      const turnResult = await this.session.generateAgentTurn({
        role: step.agentRole,
        systemInstruction: agent?.systemInstruction || '',
        prompt: `${plan.input.title}: ${plan.input.valueProposition}`,
        context: sharedContext,
      });

      step.output = turnResult.content;
      step.score = turnResult.score;
      step.status = 'COMPLETED';

      if (agent) {
        agent.status = 'DONE';
        agent.currentThought = turnResult.thought;
      }

      sharedContext += `\n--- [Resultat från ${step.agentRole}] ---\n${turnResult.content}\n`;

      if (step.agentRole === 'OUTREACH_WRITER') {
        plan.finalDraft = turnResult.content;
      }
      if (step.agentRole === 'CRITIC' && turnResult.score) {
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
          role: step.agentRole,
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
