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
  Compass,
  GitBranch,
  ArrowRight,
  Zap,
  Clock,
  Check,
  Scale,
} from 'lucide-react';
import {
  SwarmOrchestrator,
  CampaignPlan,
  SwarmStep,
  SerialMotorResult,
} from '../coordinator/swarmOrchestrator.ts';
import { SwarmAgentRole } from '../agents/roleDefinitions.ts';
import { TelemetrySidebar } from './TelemetrySidebar.tsx';
import { MasterDevelopmentPlan } from './MasterDevelopmentPlan.tsx';
import { getGlobalSwarmEventBus } from '../bus/swarmEventBus.ts';
import { EventEnvelope } from '../../../shared/contracts/envelope.ts';

interface SwarmDashboardProps {
  orchestrator: SwarmOrchestrator;
  onCampaignComplete?: (plan: CampaignPlan) => void;
  onEventEmitted?: (source: string, type: string, data: any) => void;
}

export const SwarmDashboard: React.FC<SwarmDashboardProps> = ({
  orchestrator,
  onCampaignComplete,
  onEventEmitted,
}) => {
  const [subView, setSubView] = useState<'krafter' | 'seriell' | 'comparison' | 'plan'>('krafter');
  const [title, setTitle] = useState('Skalbar AI-automation för Enterprise');
  const [targetAudience, setTargetAudience] = useState('CTO, IT-direktörer och digitaliseringsledare');
  const [valueProposition, setValueProposition] = useState(
    'Minska friktion i dokumenthantering och samordning genom autonoma agenter integrerade direkt i befintligt Google Drive Workspace med fullständig transaktionsspårbarhet.'
  );

  const [activePlan, setActivePlan] = useState<CampaignPlan | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  // Seriell motor tillstånd
  const [serialTicketId, setSerialTicketId] = useState('TCK-003');
  const [serialBrief, setSerialBrief] = useState(
    'Kör en samlad städning och arkitekturanpassning av outreach för TCK-003 utifrån SI v10.0 och AGENTS.md v10.0.'
  );
  const [isExecutingSerial, setIsExecutingSerial] = useState(false);
  const [serialResult, setSerialResult] = useState<SerialMotorResult | null>(null);
  const [serialActivePhase, setSerialActivePhase] = useState<string | null>(null);

  const activeKrafter = orchestrator.getActiveAgents();
  const serialMotor = orchestrator.getSerialMotor();
  const eventBus = getGlobalSwarmEventBus();

  // Exekvering av de tre samverkande krafterna
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
      source: 'outreach/swarm/att_forlikas',
      type: 'swarm.kraft.att_forlikas.started',
      specversion: '1.0',
      datacontenttype: 'application/json',
      time: new Date().toISOString(),
      data: { planId: plan.id, title, engine: 'KRAFTER_TRIAD' },
    };

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
          type: updatedStep.status === 'RUNNING' ? 'swarm.kraft.thinking' : 'swarm.kraft.completed',
          specversion: '1.0',
          datacontenttype: 'application/json',
          time: new Date().toISOString(),
          data: {
            stepIndex: idx,
            role: updatedStep.agentRole,
            title: updatedStep.title,
            phase: updatedStep.phase,
            summary: updatedStep.output.slice(0, 100),
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

  // Exekvering av den 4:e fristående seriella motorn
  const handleRunSerialMotor = async () => {
    setIsExecutingSerial(true);
    setSerialResult(null);
    setSerialActivePhase('1a');

    try {
      const result = await orchestrator.executeSerialMotor(
        serialTicketId,
        serialBrief,
        (phase, log) => {
          setSerialActivePhase(phase);
        },
        (envelope) => {
          onEventEmitted?.(envelope.source, envelope.type, envelope.data);
        }
      );
      setSerialResult(result);
      setSerialActivePhase(null);
    } catch (err) {
      console.error('Fel under körning av seriell motor:', err);
    } finally {
      setIsExecutingSerial(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-view väljare */}
      <div className="flex flex-wrap items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSubView('krafter')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
              subView === 'krafter'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Tre Samverkande Krafter</span>
          </button>

          <button
            onClick={() => setSubView('seriell')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
              subView === 'seriell'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>4:e Seriell Motor (SI v10.0)</span>
          </button>

          <button
            onClick={() => setSubView('comparison')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
              subView === 'comparison'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Jämförelseanalys</span>
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
            <span>Master Development Plan</span>
          </button>
        </div>

        <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>SI v10.0 Aktiv (TCK-003)</span>
        </div>
      </div>

      {subView === 'plan' ? (
        <MasterDevelopmentPlan currentReceiptHash="08f90dfe" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Vänster kolumn: Svärmkontroll & Steg (8 kolumner på lg) */}
          <div className="lg:col-span-8 space-y-6">
            {/* VIEW 1: TRE SAMVERKANDE KRAFTER */}
            {subView === 'krafter' && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-slate-100">
                        De Tre Samverkande Agentkrafterna
                      </h2>
                      <p className="text-xs text-slate-400">
                        ATT_FORLIKAS (Dörrvakt), ATT_FOLJA (Skapare), ATT_VANDA_OM (Granskare)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5 text-xs text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
                    <Bot className="w-3.5 h-3.5" />
                    <span>3 Kärnkrafter</span>
                  </div>
                </div>

                {/* Krafternas kort */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {activeKrafter.map((agent) => (
                    <div
                      key={agent.id}
                      className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl flex flex-col justify-between space-y-2"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold text-slate-200 truncate">{agent.role}</span>
                          <span
                            className={`w-2 h-2 rounded-full ${
                              agent.status === 'THINKING'
                                ? 'bg-amber-400 animate-ping'
                                : agent.status === 'DONE'
                                ? 'bg-emerald-400'
                                : 'bg-slate-600'
                            }`}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-3">{agent.systemInstruction}</p>
                      </div>
                      {agent.currentThought && (
                        <div className="p-2 bg-slate-900 rounded border border-slate-800/60 text-[10px] text-slate-300 italic line-clamp-2">
                          "{agent.currentThought}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Uppdragskonfigurering */}
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                  <h3 className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    Initiera Outreach-Uppdrag via Krafterna
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
                      <span>{isExecuting ? 'Krafterna samverkar...' : 'Starta Svärmbearbetning'}</span>
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
            )}

            {/* VIEW 2: 4:E SERIELLA MOTORN */}
            {subView === 'seriell' && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-slate-100">
                        4:e Seriella Motorn (SI v10.0 Linjär Pipeline)
                      </h2>
                      <p className="text-xs text-slate-400">
                        Kör hela kedjan linjärt i ett obrutet svep: 1a ➔ 1b ➔ 2e ➔ 3c ➔ 4
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 font-mono">
                    <span>Obruten Kedja</span>
                  </div>
                </div>

                {/* Seriell motor konfig */}
                <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Exekveringskonfiguration för Ticket
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Automated Runner
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Målticket (doc/TICKETS.md)</label>
                      <input
                        type="text"
                        value={serialTicketId}
                        onChange={(e) => setSerialTicketId(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs text-slate-400 block mb-1">Kärnuppdrag / Brief</label>
                      <input
                        type="text"
                        value={serialBrief}
                        onChange={(e) => setSerialBrief(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="text-[11px] text-slate-400">
                      Pipeline: <span className="font-mono text-slate-300">1a (Wayfinder) ➔ 1b (FSD) ➔ 2e (Syntes) ➔ 3c (Token) ➔ 4 (Mikro-E2E)</span>
                    </div>
                    <button
                      onClick={handleRunSerialMotor}
                      disabled={isExecutingSerial}
                      className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors shadow-md shadow-emerald-600/20 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>{isExecutingSerial ? 'Exekverar SI v10.0-kedjan...' : 'Starta Seriell Motor'}</span>
                    </button>
                  </div>
                </div>

                {/* Pipeline visualisering */}
                <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-xl space-y-4">
                  <div className="text-xs font-semibold text-slate-200 flex items-center justify-between">
                    <span>Fasprogress & Live Pipeline</span>
                    {serialActivePhase && (
                      <span className="text-[10px] font-mono text-emerald-400 animate-pulse">
                        Aktiv Fas: {serialActivePhase}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { id: '1a', label: '1a Förstå' },
                      { id: '1b', label: '1b Kartlägga' },
                      { id: '2e', label: '2e Syntetisera' },
                      { id: '3c', label: '3c Kontrakt' },
                      { id: '4', label: '4 Mikro-E2E' },
                    ].map((step) => {
                      const isCompleted = serialResult?.phases.some((p) => p.phase === step.id);
                      const isCurrent = serialActivePhase === step.id;

                      return (
                        <div
                          key={step.id}
                          className={`p-2.5 rounded-lg border text-center transition-all ${
                            isCompleted
                              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                              : isCurrent
                              ? 'bg-amber-950/40 border-amber-500/50 text-amber-300 animate-pulse'
                              : 'bg-slate-900/60 border-slate-800 text-slate-500'
                          }`}
                        >
                          <div className="text-[10px] font-mono font-bold">{step.id}</div>
                          <div className="text-[10px] truncate">{step.label}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Resultat efter körning */}
                  {serialResult && (
                    <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
                      <div className="flex items-center justify-between bg-emerald-950/30 border border-emerald-800/40 p-3 rounded-lg">
                        <div className="flex items-center space-x-2.5">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          <div>
                            <div className="text-xs font-semibold text-emerald-200">
                              Seriell SI v10.0 Körning Slutförd!
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Total körtid: {serialResult.totalDurationMs}ms • Alla faser passerade
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] font-mono bg-slate-900 text-slate-300 px-2 py-1 rounded border border-slate-700">
                            Token: {serialResult.tokenGenerated}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {serialResult.phases.map((p) => (
                          <div
                            key={p.phase}
                            className="p-2.5 bg-slate-900/80 border border-slate-800/80 rounded-lg text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between text-slate-200 font-semibold">
                              <span>Fas {p.phase}: {p.name}</span>
                              <span className="text-[10px] font-mono text-emerald-400">{p.durationMs}ms</span>
                            </div>
                            <p className="text-[11px] text-slate-400">{p.output}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* VIEW 3: JÄMFÖRELSEANALYS */}
            {subView === 'comparison' && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
                      <Scale className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-slate-100">
                        Jämförelse: Tre Samverkande Krafter vs 4:e Seriella Motorn
                      </h2>
                      <p className="text-xs text-slate-400">
                        Arkitektonisk utvärdering av decentraliserad svärmkonsensus kontra linjär SI v10.0 pipeline
                      </p>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="text-[10px] uppercase font-mono bg-slate-950/80 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-3">Dimension</th>
                        <th className="p-3 text-purple-400">Tre Samverkande Krafter (Svärm)</th>
                        <th className="p-3 text-emerald-400">4:e Seriella Motorn (SI v10.0)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      <tr>
                        <td className="p-3 font-semibold text-slate-200">Arkitekturmodell</td>
                        <td className="p-3">Decentraliserad rolltriad (Förlikas, Följa, Vända om)</td>
                        <td className="p-3 font-mono">Linjär 1a ➔ 1b ➔ 2e ➔ 3c ➔ 4 pipeline</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-slate-200">Beslutskartläggning</td>
                        <td className="p-3">Wayfinder-orientering i 1a med mänsklig dialog</td>
                        <td className="p-3">Deterministisk linjär exekvering direkt mot ticket</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-slate-200">Riskanalys & Kontroll</td>
                        <td className="p-3">ATT_VANDA_OM kör bakgrundsgranskning vid 3c</td>
                        <td className="p-3">Intern riskanalys i 1a/1b och transient mikro-E2E i 4</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-slate-200">Genomströmning</td>
                        <td className="p-3">Hög dynamik, händelsestyrd via SwarmEventBus</td>
                        <td className="p-3">Maximal hastighet, deterministisk serialisering</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-slate-200">Bäst lämpad för</td>
                        <td className="p-3">Kreativ textframställning, målgruppsanpassning och konsensus</td>
                        <td className="p-3">Strikta kod- och arkitekturbyggen utan kognitiv drift</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400 leading-relaxed">
                  <strong className="text-slate-200">Slutsats:</strong> Båda arkitekturerna kompletterar varandra: Krafterna
                  tillhandahåller den mänskliga och adaptiva kvalitetsgranskningen under kampanjframställning, medan den Seriella
                  Motorn garanterar att systemets källkods- och arkitekturkontrakt förblir matematiskt strikta och fria från
                  avvikelser enligt SI v10.0.
                </div>
              </div>
            )}
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
