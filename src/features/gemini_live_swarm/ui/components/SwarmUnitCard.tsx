import React from 'react';
import { Mic, ShieldCheck } from 'lucide-react';
import { ReconciliationUnitConfig } from '../../agents/roleDefinitions.ts';

interface SwarmUnitCardProps {
  unit: ReconciliationUnitConfig;
  isActiveSpeaker?: boolean;
  onVoiceTrigger?: (phrase: string) => void;
}

const VERB_MAP: Record<string, string[]> = {
  ATT_FOLJA: ['följa'],
  ATT_VANDA_OM: ['vända'],
  ATT_FORLIKAS: ['förlika'],
  SERIELL_MOTOR: ['bygga', 'bygga ett', 'bygga två', 'bygga tre'],
};

export const SwarmUnitCard: React.FC<SwarmUnitCardProps> = ({
  unit,
  isActiveSpeaker = false,
  onVoiceTrigger,
}) => {
  const verbs = VERB_MAP[unit.force] || [];

  const avatar = (
    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${unit.avatarColor} flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
      {unit.displayName.slice(0, 2).toUpperCase()}
    </div>
  );

  const titleBlock = (
    <div>
      <h3 className="text-xs font-bold text-slate-100">{unit.displayName}</h3>
      <span className="text-[10px] font-mono text-slate-400">{unit.forceTitle}</span>
    </div>
  );

  const topRow = (
    <div className="flex items-start justify-between gap-2">
      <div className="flex items-center space-x-2.5">
        {avatar}
        {titleBlock}
      </div>
      <div className="flex items-center space-x-1.5">
        {isActiveSpeaker && <span className="text-[9px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 animate-pulse"><Mic className="w-2.5 h-2.5" /> Talar</span>}
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">{unit.status}</span>
      </div>
    </div>
  );

  const verbButtons = (
    <div className="flex flex-wrap gap-1 justify-end">
      {verbs.map((verb) => (
        <button key={verb} onClick={() => onVoiceTrigger?.(verb)} className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-colors cursor-pointer">{verb}</button>
      ))}
    </div>
  );

  const thoughtBlock = unit.currentThought ? (
    <div className="mt-2.5 p-2 rounded bg-slate-950/70 border border-slate-800/80 text-[10px] font-mono text-purple-300">
      <span className="text-slate-500">Tanke: </span>{unit.currentThought}
    </div>
  ) : null;

  return (
    <div className={`rounded-xl border p-4 transition-all duration-200 bg-slate-900/90 ${isActiveSpeaker ? 'border-emerald-500/80 shadow-md ring-1 ring-emerald-500/40' : 'border-slate-800 hover:border-slate-700'}`}>
      {topRow}
      <p className="text-[11px] text-slate-300 mt-2.5 line-clamp-2 leading-relaxed">{unit.userBenefit}</p>
      {thoughtBlock}
      <div className="mt-3 pt-2.5 border-t border-slate-800/70 flex items-center justify-between gap-1">
        <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-slate-500" /> Röstverb:</span>
        {verbButtons}
      </div>
    </div>
  );
};
