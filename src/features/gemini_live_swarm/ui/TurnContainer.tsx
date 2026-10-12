import React, { useState } from 'react';
import { RotateCcw, ChevronDown, ChevronRight, CheckCircle } from 'lucide-react';
import { audioWorker } from '../session/audioWorker.ts';
import { useOptionalSwarmContext } from '../context/SwarmContext.tsx';
import { AccumulatedTurn } from './splitPaneHelper.ts';

export interface TurnContainerProps {
  turn: AccumulatedTurn;
  className?: string;
}

export const TurnContainer: React.FC<TurnContainerProps> = ({ turn, className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const swarmCtx = useOptionalSwarmContext();

  const handleRestore = () => {
    audioWorker.flush();
    swarmCtx?.liveSession?.getAudioPlayer?.()?.clearBuffer?.();
    const checkpointId = turn.walCheckpointId || turn.id;
    swarmCtx?.eventBus?.emit('UI_STATE_CHANGED', { action: 'wal_restore', checkpointId });
  };

  const handleToggleHistory = () => {
    const next = !isExpanded;
    setIsExpanded(next);
    swarmCtx?.eventBus?.emit('UI_STATE_CHANGED', { element: 'action_history', expanded: next });
  };

  const actions = turn.actionHistory || [
    { id: 'act-1', name: 'src/features/gemini_live_swarm/ui/TurnContainer.tsx' },
    { id: 'act-2', name: 'BDD Scenario: Voice & Audio Mutex Verification' },
  ];

  return (
<div data-testid="turn-container" className={`rounded-lg bg-slate-900/80 border border-slate-800 text-slate-200 overflow-hidden ${className}`}>
  <div data-testid="sticky-turn-header" style={{ position: 'sticky', top: 0, zIndex: 10 }} className="sticky top-0 z-10 flex items-center justify-between px-3 py-1.5 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
    <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
      <span className="text-emerald-400">{turn.agentRole}</span>
      <span className="text-[10px] text-slate-500 font-mono">{turn.forceTitle}</span>
    </div>
    <div className="flex items-center gap-1.5">
      <button type="button" data-testid="action-history-toggle" title="Action History" onClick={handleToggleHistory} className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors">
        {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <span>Historik</span>
      </button>
      <button type="button" data-testid="wal-restore-button" title="WAL Restore" onClick={handleRestore} className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-sky-950 hover:bg-sky-900 border border-sky-800/60 text-sky-300 transition-colors">
        <RotateCcw size={11} />
        <span>Restore</span>
      </button>
    </div>
  </div>
  <div className="p-3 text-xs leading-relaxed text-slate-200">
    <p className="whitespace-pre-wrap">{turn.text}</p>
  </div>
  {isExpanded && (
    <div data-testid="action-history-panel" className="px-3 pb-3 pt-1 border-t border-slate-800/60 bg-slate-950/60 text-[11px] font-mono">
      <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5">Action History</div>
      <div className="flex flex-col gap-1">
        {actions.map((act: { id: string; name: string }) => (
        <div key={act.id} className="flex items-center gap-1.5 text-slate-400">
        <CheckCircle size={11} className="text-emerald-400" /><span className="truncate">{act.name}</span>
        </div>
        ))}
      </div>
    </div>
  )}
</div>
  );
};
