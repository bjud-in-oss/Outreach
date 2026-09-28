import React from 'react';
import { Compass, Sparkles, Layers } from 'lucide-react';
import { RECONCILIATION_UNITS } from '../../agents/roleDefinitions.ts';

export type SwarmWorkMode = 'SAMORDNING' | 'STEGVIS_BYGGE';

interface SwarmHeaderProps {
  workMode: SwarmWorkMode;
  onToggleWorkMode: (mode: SwarmWorkMode) => void;
  activeCount: number;
}

export const SwarmHeader: React.FC<SwarmHeaderProps> = ({
  workMode,
  onToggleWorkMode,
  activeCount,
}) => {
  const brandSection = (
    <div className="flex items-center space-x-3">
      <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-400">
        <Compass className="w-6 h-6 animate-spin-slow" />
      </div>
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">Outreach Coordination Engine <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-normal">SI v10.0 • TCK-013</span></h1>
        <p className="text-xs text-slate-400">Kompass: Närhet till Guds son genom tre vägar till försoning och praktiskt bygge.</p>
      </div>
    </div>
  );

  const modeButtons = (
    <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
      <button onClick={() => onToggleWorkMode('SAMORDNING')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${workMode === 'SAMORDNING' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}>
        <Sparkles className="w-3.5 h-3.5" />
        <span>Samordning</span>
      </button>
      <button onClick={() => onToggleWorkMode('STEGVIS_BYGGE')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${workMode === 'STEGVIS_BYGGE' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}>
        <Layers className="w-3.5 h-3.5" />
        <span>Stegvis bygge</span>
      </button>
    </div>
  );

  const pathGrid = (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
      <div className="p-2 rounded bg-slate-950/60 border border-blue-500/20">
        <span className="font-semibold text-blue-300">1. {RECONCILIATION_UNITS.ATT_FOLJA.displayName}: </span>
        <span className="text-[10px] text-slate-400">Själv vara närheten.</span>
      </div>
      <div className="p-2 rounded bg-slate-950/60 border border-amber-500/20">
        <span className="font-semibold text-amber-300">2. {RECONCILIATION_UNITS.ATT_VANDA_OM.displayName}: </span>
        <span className="text-[10px] text-slate-400">Inåtriktad Fail-Fast.</span>
      </div>
      <div className="p-2 rounded bg-slate-950/60 border border-purple-500/20">
        <span className="font-semibold text-purple-300">3. {RECONCILIATION_UNITS.ATT_FORLIKAS.displayName}: </span>
        <span className="text-[10px] text-slate-400">2+ perspektiv varma.</span>
      </div>
      <div className="p-2 rounded bg-slate-950/60 border border-cyan-500/20">
        <span className="font-semibold text-cyan-300">4. {RECONCILIATION_UNITS.SERIELL_MOTOR.displayName}: </span>
        <span className="text-[10px] text-slate-400">Praktiskt bygge.</span>
      </div>
    </div>
  );

  return (
    <header className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {brandSection}
        {modeButtons}
      </div>
      {pathGrid}
    </header>
  );
};
