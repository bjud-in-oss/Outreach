import React, { useState } from 'react';
import {
  Bot,
  Play,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Send,
  FileText,
  Activity,
  Layers,
  Radio,
  Cpu,
  Workflow,
  Lock,
  ArrowRight,
  RefreshCw,
  Compass,
  Heart,
} from 'lucide-react';
import { SwarmOrchestrator, CampaignPlan, SwarmStep } from '../coordinator/swarmOrchestrator.ts';
import { SwarmAgentRole, AgentForce, SEMANTIC_INVARIANT } from '../agents/roleDefinitions.ts';
import { TelemetrySidebar } from './TelemetrySidebar.tsx';
import { MasterDevelopmentPlan } from './MasterDevelopmentPlan.tsx';
import { getGlobalSwarmEventBus } from '../bus/swarmEventBus.ts';
import { EventEnvelope } from '../../../shared/contracts/envelope.ts';
import { SerialExecutionMetric, SerialStage } from '../telemetry/telemetrySchema.ts';

interface SwarmDashboardProps {
  orchestrator: SwarmOrchestrator;
  onCampaignComplete?: (plan: CampaignPlan) => void;
  onEventEmitted?: (source: string, type: string, data: any) => void;
}

const SERIAL_PIPELINE_STAGES: { id: SerialStage; label: string }[] = [
  { id: '1a_forsta', label: '1a Förstå' },
  { id: '1b_kartlagga', label: '1b Kartlägga' },
  { id: '2a_avgransa', label: '2a Avgränsa' },
  { id: '2b_modellera', label: '2b Modellera' },
  { id: '2e_syntetisera', label: '2e Syntetisera' },
  { id: '3c_spec', label: '3c Specifikation' },
  { id: 'e2e_verify', label: 'E2E Verifiera' },
];

export const SwarmDashboard: React.FC<SwarmDashboardProps> = ({
  orchestrator,
  onCampaignComplete,
  onEventEmitted,
}) => {
  const [subView, setSubView] = useState<'orchestration' | 'plan'>('orchestration');
  const [title, setTitle] = useState('Skalbar AI-automation för Enterprise');
  const [targetAudience, setTargetAudience] = useState('CTO, IT-direktörer och digitaliseringsledare');
  const [valueProposition, setValueProposition] = useState(
    'Minska friktion i dokumenthantering och samordning genom autonoma agenter integrerade direkt i befintligt Google Drive Workspace med fullständig transaktionsspårbarhet.'
  );

  const [activePlan, setActivePlan] = useState<CampaignPlan | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentSerialStageIndex, setCurrentSerialStageIndex] = useState<number>(5); // 3c_spec som standard vid Gate
  const [serialMetric, setSerialMetric] = useState<SerialExecutionMetric>({
    pipelineId: 'pipe-tck-007-init',
    ticketId: 'TCK-007',
    stepIndex: 5,
    totalSteps: 7,
    currentStage: '3c_spec',
    stageStatus: 'GATED',
    durationMs: 1240,
    isTokenGated: true,
    requiredTokenHash: 'TCK-007-UI-SERIELL-MOTOR-TOKEN',
    lastTransitionAt: new Date().toISOString(),
    activeForce: 'SERIELL_MOTOR',
  });

  const agents = orchestrator.getActiveAgents();
  const serialMotor = orchestrator.getSerialEngine();
  const allUnits = [...agents, serialMotor];
  const eventBus = getGlobalSwarmEventBus();

  const getForceBadge = (force?: AgentForce) => {
    switch (force) {
      case 'ATT_FORLIKAS':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-medium">
            ATT FÖRLIKAS
          </span>
        );
      case 'ATT_FOLJA':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 font-medium">
            ATT FÖLJA
          </span>
        );
      case 'ATT_VANDA_OM':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
            ATT VÄNDA OM
          </span>
        );
      case 'SERIELL_MOTOR':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-medium">
            SERIELL MOTOR
          </span>
        );
      default:
        return null;
    }
  };

  const handleSimulateNextStage = () => {
    const nextIdx = (currentSerialStageIndex + 1) % SERIAL_PIPELINE_STAGES.length;
    setCurrentSerialStageIndex(nextIdx);
    const targetStage = SERIAL_PIPELINE_STAGES[nextIdx];

    const isGated = targetStage.id === '3c_spec';
    const isCompleted = targetStage.id === 'e2e_verify';
    const status = isGated ? 'GATED' : isCompleted ? 'COMPLETED' : 'RUNNING';

    const newMetric: SerialExecutionMetric = {
      pipelineId: `pipe-tck007-${Date.now()}`,
      ticketId: 'TCK-007',
      stepIndex: nextIdx,
      totalSteps: SERIAL_PIPELINE_STAGES.length,
      currentStage: targetStage.id,
      stageStatus: status,
      durationMs: Math.round(350 + nextIdx * 180 + Math.random() * 80),
      isTokenGated: isGated,
      requiredTokenHash: isGated ? 'TCK-007-UI-SERIELL-MOTOR-TOKEN' : undefined,
      lastTransitionAt: new Date().toISOString(),
      activeForce: 'SERIELL_MOTOR',
    };

    setSerialMetric(newMetric);
    eventBus.publishSerialMetric(newMetric);
  };

  const handleStartCampaign = async () => {
    setIsExecuting(true);
    const plan = orchestrator.createCampaignPlan({
      title,
      targetAudience,
      valueProposition,
    });
    setActivePlan({ ...plan });

    const startEnvelope: EventEnvelope = {
      id: `evt-start-${Date.now()}`,
      source: 'outreach/swarm/orchestrator',
      type: 'swarm.campaign.started',
      specversion: '1.0',
      datacontenttype: 'application/json',
      time: new Date().toISOString(),
      data: { planId: plan.id, title },
    };

    // Publicera till både reaktiv buss och förälder
    eventBus.publish(startEnvelope);
    onEventEmitted?.(startEnvelope.source, startEnvelope.type, startEnvelope.data);

    const completedPlan = await orchestrator.executeCampaign(
      plan,
      (updatedStep, idx) => {
        setActivePlan((prev) => {
          if (!prev) return null;
          const newSteps = [...prev.steps];
          newSteps[idx] = { ...updatedStep };
          return { ...prev, steps: newSteps };
        });

        const stepProgressEnvelope: EventEnvelope = {
          id: `evt-step-pulse-${Date.now()}-${idx}`,
          source: `outreach/swarm/${updatedStep.agentRole.toLowerCase()}`,
          type: updatedStep.status === 'RUNNING' ? 'swarm.agent.thinking' : 'swarm.agent.completed',
          specversion: '1.0',
          datacontenttype: 'application/json',
          time: new Date().toISOString(),
          data: {
            stepIndex: idx,
            role: updatedStep.agentRole,
            title: updatedStep.title,
            thought: updatedStep.output.slice(0, 100),
            status: updatedStep.status,
          },
        };

        eventBus.publish(stepProgressEnvelope);
      },
      (envelope) => {
        eventBus.publish(envelope);
        onEventEmitted?.(envelope.source, envelope.type, envelope.data);
      }
    );

    setActivePlan({ ...completedPlan });
    setIsExecuting(false);
    onCampaignComplete?.(completedPlan);
  };

  return (
    <div className="space-y-6">
      {/* Kompass & Högsta Syfte: Semantiskt Ankare & Försoningskrafter (TCK-008) */}
      <div className="bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 border border-purple-500/30 rounded-xl p-4 shadow-md space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-200 flex items-center space-x-2">
                <span>Kompass & Högsta Syfte</span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono">
                  Mognadsmodell v10.0
                </span>
              </h3>
              <p className="text-[11px] text-slate-300 font-serif italic mt-0.5">
                "{SEMANTIC_INVARIANT}"
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1 border-t border-purple-500/20 text-xs">
          <div className="p-2 rounded bg-slate-950/60 border border-blue-500/20">
            <span className="font-semibold text-blue-300 text-[11px]">1. Att Följa</span>
            <p className="text-[10px] text-slate-400 mt-0.5">Själv vara lösningen för närhet genom empatisk kontakt och analys.</p>
          </div>
          <div className="p-2 rounded bg-slate-950/60 border border-amber-500/20">
            <span className="font-semibold text-amber-300 text-[11px]">2. Att Vända Om</span>
            <p className="text-[10px] text-slate-400 mt-0.5">Inåtriktad ödmjukhet och transformation; Fail-Fast för äkthet.</p>
          </div>
          <div className="p-2 rounded bg-slate-950/60 border border-purple-500/20">
            <span className="font-semibold text-purple-300 text-[11px]">3. Att Förlikas</span>
            <p className="text-[10px] text-slate-400 mt-0.5">Hålla 2+ samtida perspektiv varma för att hela klyftor och sluta cykeln.</p>
          </div>
        </div>
      </div>

      {/* Sub-view väljare */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSubView('orchestration')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
              subView === 'orchestration'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Svärmorkestrering & Telemetri</span>
          </button>
          <button
            onClick={() => setSubView('plan')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
              subView === 'plan'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Master Development Plan (Styrkort)</span>
          </button>
        </div>

        <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Buss aktiv (SI v10.0 • TCK-008)</span>
        </div>
      </div>

      {subView === 'plan' ? (
        <MasterDevelopmentPlan currentReceiptHash="09aea95c" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Vänster kolumn: Svärmkontroll & Steg (8 kolumner på lg) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-slate-100">Gemini Live Swarm Orkestrering</h2>
                    <p className="text-xs text-slate-400">
                      Multi-agent samarbete för forskning, textframställning och konsensusgranskning
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1.5 text-xs text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>5 Enheter (4 Agenter + Seriell Motor)</span>
                </div>
              </div>

              {/* Agentkort inklusive kraft-etiketter */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {allUnits.map((unit) => (
                  <div
                    key={unit.id}
                    className={`p-3 bg-slate-950/70 border rounded-xl flex flex-col justify-between ${
                      unit.role === 'SERIELL_MOTOR'
                        ? 'border-cyan-500/40 ring-1 ring-cyan-500/20'
                        : 'border-slate-800/80'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-slate-200">{unit.name}</span>
                        <div className="flex items-center space-x-2">
                          {getForceBadge(unit.force)}
                          <span
                            className={`w-2 h-2 rounded-full ${
                              unit.status === 'THINKING'
                                ? 'bg-amber-400 animate-ping'
                                : unit.status === 'DONE'
                                ? 'bg-emerald-400'
                                : 'bg-slate-600'
                            }`}
                          />
                        </div>
                      </div>
                      {unit.forceTitle && (
                        <div className="text-[10px] font-medium text-purple-300/90 mb-1.5 flex items-center space-x-1">
                          <span>✦</span>
                          <span>{unit.forceTitle}</span>
                        </div>
                      )}
                      <p className="text-[11px] text-slate-400 line-clamp-2">{unit.systemInstruction}</p>
                    </div>
                    {unit.currentThought && (
                      <div className="mt-2.5 p-2 bg-slate-900 rounded border border-slate-800/60 text-[10px] text-slate-300 italic">
                        "{unit.currentThought}"
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Framträdande sektion: Seriell Exekveringsmotor (4:e Motorn) */}
              <div className="bg-slate-950/90 p-4 rounded-xl border border-cyan-500/30 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg border border-cyan-500/20">
                      <Workflow className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center space-x-2">
                        <span>Seriell Exekveringsmotor (4:e Motorn)</span>
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                          SI v10.0
                        </span>
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Linjär fasövergång, deterministisk sekvensering och Token Gate-spärr
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleSimulateNextStage}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer shadow-sm shadow-cyan-600/20"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Stega Pipeline</span>
                  </button>
                </div>

                {/* Linjär pipeline-visualisering */}
                <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                  <div className="flex items-center justify-between overflow-x-auto pb-1 gap-1">
                    {SERIAL_PIPELINE_STAGES.map((stg, idx) => {
                      const isCurrent = idx === currentSerialStageIndex;
                      const isPast = idx < currentSerialStageIndex;
                      const isGatedStage = stg.id === '3c_spec';

                      return (
                        <React.Fragment key={stg.id}>
                          <div
                            className={`flex flex-col items-center px-2 py-1.5 rounded-md min-w-[76px] transition-all text-center ${
                              isCurrent
                                ? isGatedStage
                                  ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold'
                                  : 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold shadow-sm'
                                : isPast
                                ? 'bg-slate-800/80 text-emerald-400'
                                : 'bg-slate-950/60 text-slate-500'
                            }`}
                          >
                            <span className="text-[10px] font-mono leading-tight">{stg.label}</span>
                            <span className="text-[8px] uppercase tracking-tighter mt-0.5">
                              {isCurrent ? (isGatedStage ? 'GATED' : 'AKTIV') : isPast ? '✓ KLAR' : 'KÖ'}
                            </span>
                          </div>

                          {idx < SERIAL_PIPELINE_STAGES.length - 1 && (
                            <ArrowRight className="w-3 h-3 text-slate-600 shrink-0 mx-0.5" />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* Körtidsmätning & Token Gate Info */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono">
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">Aktiv Fas:</span>
                    <span className="text-cyan-300 font-bold">{serialMetric.currentStage}</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">Förfluten Tid:</span>
                    <span className="text-slate-200">{serialMetric.durationMs} ms</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">Token Gate:</span>
                    {serialMetric.isTokenGated ? (
                      <span className="flex items-center space-x-1 text-amber-400 font-bold">
                        <Lock className="w-3 h-3" />
                        <span>SPÄRRAD</span>
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-bold">PASSERAD</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Uppdragskonfigurering */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <h3 className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Initiera Nytt Outreach-Uppdrag
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">Kampanjtitel</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">Målgrupp / Segment</label>
                    <input
                      type="text"
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Kärnbudskap & Värdeerbjudande</label>
                  <textarea
                    value={valueProposition}
                    onChange={(e) => setValueProposition(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleStartCampaign}
                    disabled={isExecuting}
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors shadow-md shadow-purple-600/20 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{isExecuting ? 'Svärmen arbetar...' : 'Starta Svärmbearbetning'}</span>
                  </button>
                </div>
              </div>

              {/* Svärmframsteg & Utkast */}
              {activePlan && (
                <div className="space-y-3">
                  {activePlan.steps.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-slate-950/90 border border-slate-800 rounded-xl space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-semibold text-slate-200">
                            Steg {idx + 1}: {step.title}
                          </span>
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-purple-300">
                            {step.agentRole}
                          </span>
                        </div>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                            step.status === 'COMPLETED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : step.status === 'RUNNING'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                              : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          {step.status}
                        </span>
                      </div>
                      {step.output && (
                        <pre className="text-xs text-slate-300 bg-slate-900/90 p-3 rounded-lg border border-slate-800 whitespace-pre-wrap font-sans leading-relaxed">
                          {step.output}
                        </pre>
                      )}
                      {step.score && (
                        <div className="flex items-center space-x-2 text-xs text-emerald-400 font-medium pt-1">
                          <ShieldCheck className="w-4 h-4" />
                          <span>Konsensusbetyg: {step.score} / 10 (Godkänd för leverans)</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Höger kolumn: TelemetrySidebar (4 kolumner på lg) */}
          <div className="lg:col-span-4">
            <TelemetrySidebar eventBus={eventBus} className="sticky top-20" />
          </div>
        </div>
      )}
    </div>
  );
};

