import React, { useState } from 'react';
import { Bot, Play, CheckCircle2, ShieldCheck, Sparkles, Send, FileText } from 'lucide-react';
import { SwarmOrchestrator, CampaignPlan, SwarmStep } from '../coordinator/swarmOrchestrator.ts';
import { SwarmAgentRole } from '../agents/roleDefinitions.ts';

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
  const [title, setTitle] = useState('Skalbar AI-automation för Enterprise');
  const [targetAudience, setTargetAudience] = useState('CTO, IT-direktörer och digitaliseringsledare');
  const [valueProposition, setValueProposition] = useState(
    'Minska friktion i dokumenthantering och samordning genom autonoma agenter integrerade direkt i befintligt Google Drive Workspace med fullständig transaktionsspårbarhet.'
  );

  const [activePlan, setActivePlan] = useState<CampaignPlan | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const agents = orchestrator.getActiveAgents();

  const handleStartCampaign = async () => {
    setIsExecuting(true);
    const plan = orchestrator.createCampaignPlan({
      title,
      targetAudience,
      valueProposition,
    });
    setActivePlan({ ...plan });

    onEventEmitted?.('outreach/swarm/orchestrator', 'swarm.campaign.started', {
      planId: plan.id,
      title,
    });

    const completedPlan = await orchestrator.executeCampaign(
      plan,
      (updatedStep, idx) => {
        setActivePlan((prev) => {
          if (!prev) return null;
          const newSteps = [...prev.steps];
          newSteps[idx] = { ...updatedStep };
          return { ...prev, steps: newSteps };
        });
      },
      (envelope) => {
        onEventEmitted?.(envelope.source, envelope.type, envelope.data);
      }
    );

    setActivePlan({ ...completedPlan });
    setIsExecuting(false);
    onCampaignComplete?.(completedPlan);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-6">
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
        <div className="flex items-center space-x-1.5 text-xs text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
          <Bot className="w-3.5 h-3.5" />
          <span>4 Aktiva Svärmagenter</span>
        </div>
      </div>

      {/* Agentkort */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-200">{agent.name}</span>
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
              <p className="text-[11px] text-slate-400 line-clamp-2">{agent.systemInstruction}</p>
            </div>
            {agent.currentThought && (
              <div className="mt-2.5 p-2 bg-slate-900 rounded border border-slate-800/60 text-[10px] text-slate-300 italic">
                "{agent.currentThought}"
              </div>
            )}
          </div>
        ))}
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
        <div className="space-y-4">
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
        </div>
      )}
    </div>
  );
};
