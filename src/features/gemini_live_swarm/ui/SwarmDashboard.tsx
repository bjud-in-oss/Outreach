import React, { useState } from 'react';
import { SwarmOrchestrator, CampaignPlan } from '../coordinator/swarmOrchestrator.ts';
import { getGlobalSwarmEventBus } from '../bus/swarmEventBus.ts';
import { useSwarmTelemetry } from '../telemetry/useSwarmTelemetry.ts';
import { SwarmHeader, SwarmWorkMode } from './components/SwarmHeader.tsx';
import { SwarmUnitCard } from './components/SwarmUnitCard.tsx';
import { SwarmStreamLog } from './components/SwarmStreamLog.tsx';
import { SwarmControlPanel } from './components/SwarmControlPanel.tsx';
import { TelemetrySidebar } from './TelemetrySidebar.tsx';
import { MasterDevelopmentPlan } from './MasterDevelopmentPlan.tsx';

interface SwarmDashboardProps {
  orchestrator: SwarmOrchestrator;
  onCampaignComplete?: (plan: CampaignPlan) => void;
  onEventEmitted?: (source: string, type: string, data: any) => Promise<any> | void;
}

export const SwarmDashboard: React.FC<SwarmDashboardProps> = ({
  orchestrator,
  onCampaignComplete,
  onEventEmitted,
}) => {
  const [subView, setSubView] = useState<'orchestration' | 'plan'>('orchestration');
  const [workMode, setWorkMode] = useState<SwarmWorkMode>('SAMORDNING');
  const [currentPhase, setCurrentPhase] = useState<'PLANERA' | 'GENOMFORA'>('PLANERA');
  const [isExecuting, setIsExecuting] = useState(false);

  const eventBus = getGlobalSwarmEventBus();
  const { snapshot, toggleManualMute, triggerInvocation } = useSwarmTelemetry(eventBus);
  const units = orchestrator.getAllUnits();

  const handleExecute = async () => {
    setIsExecuting(true);
    const plan = orchestrator.createCampaignPlan({
      title: 'Skalbar AI-automation för Enterprise',
      targetAudience: 'CTO och digitaliseringsledare',
      valueProposition: 'Autonoma försoningsarbetsflöden och deterministiskt bygge med Google Drive Workspace.',
    }, workMode);
    const completed = await orchestrator.executeCampaign(plan, undefined, (env) => {
      eventBus.publish(env);
      onEventEmitted?.(env.source, env.type, env.data);
    });
    setIsExecuting(false);
    onCampaignComplete?.(completed);
  };

  const navBar = (
    <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs">
      <div className="flex space-x-2">
        <button onClick={() => setSubView('orchestration')} className={`px-3 py-1 rounded-lg font-semibold ${subView === 'orchestration' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>Svärmöversikt</button>
        <button onClick={() => setSubView('plan')} className={`px-3 py-1 rounded-lg font-semibold ${subView === 'plan' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>Styrkort & Roadmap</button>
      </div>
      <span className="text-[11px] font-mono text-emerald-400">SI v10.0 • TCK-012</span>
    </div>
  );

  const unitGrid = (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {units.map((unit) => (
        <SwarmUnitCard key={unit.id} unit={unit} isActiveSpeaker={snapshot.audioOutput?.activeSpeakerUnitId === unit.id} onVoiceTrigger={triggerInvocation} />
      ))}
    </div>
  );

  const mainArea = subView === 'plan' ? (
    <MasterDevelopmentPlan currentReceiptHash="444e60b5" />
  ) : (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <div className="lg:col-span-8 space-y-5">
        {unitGrid}
        <SwarmControlPanel audioOutput={snapshot.audioOutput} onToggleMute={toggleManualMute} onSendVoiceVerb={triggerInvocation} onExecuteWork={handleExecute} isExecuting={isExecuting} />
        <SwarmStreamLog currentPhase={currentPhase} transcription={snapshot.liveSession?.lastTranscription} recentEnvelopes={snapshot.recentEnvelopes} onPhaseChange={setCurrentPhase} />
      </div>
      <div className="lg:col-span-4">
        <TelemetrySidebar eventBus={eventBus} />
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <SwarmHeader workMode={workMode} onToggleWorkMode={setWorkMode} activeCount={units.length} />
      {navBar}
      {mainArea}
    </div>
  );
};
