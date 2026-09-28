import React from 'react';
import { Terminal, Activity, ArrowRight } from 'lucide-react';
import { EventEnvelope } from '../../../../shared/contracts/envelope.ts';

interface SwarmStreamLogProps {
  currentPhase: 'PLANERA' | 'GENOMFORA';
  transcription?: string;
  recentEnvelopes: EventEnvelope[];
  onPhaseChange?: (phase: 'PLANERA' | 'GENOMFORA') => void;
}

export const SwarmStreamLog: React.FC<SwarmStreamLogProps> = ({
  currentPhase,
  transcription = '',
  recentEnvelopes,
  onPhaseChange,
}) => {
  const phaseSwitch = (
    <div className="flex items-center space-x-1.5 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-[10px]">
      <span className="text-slate-400 font-mono">Fas:</span>
      <button onClick={() => onPhaseChange?.('PLANERA')} className={`px-2 py-0.5 rounded font-semibold ${currentPhase === 'PLANERA' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>Planera</button>
      <ArrowRight className="w-3 h-3 text-slate-600" />
      <button onClick={() => onPhaseChange?.('GENOMFORA')} className={`px-2 py-0.5 rounded font-semibold ${currentPhase === 'GENOMFORA' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>Genomföra</button>
    </div>
  );

  const eventItems = recentEnvelopes.slice(-3).reverse().map((env) => (
    <div key={env.id} className="p-1.5 rounded bg-slate-950 border border-slate-800/80 flex items-center justify-between text-slate-300">
      <span className="text-purple-300 truncate max-w-[200px]">{env.type}</span>
      <span className="text-slate-500 text-[9px]">{env.source.split('/').pop()}</span>
    </div>
  ));

  const headerSection = (
    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
      <div className="flex items-center space-x-2">
        <Terminal className="w-4 h-4 text-purple-400" />
        <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Realtidsström & Transkription</span>
      </div>
      {phaseSwitch}
    </div>
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
      {headerSection}

      <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg min-h-[70px] max-h-[140px] overflow-y-auto font-mono text-xs">
        {transcription ? <p className="text-emerald-400 leading-relaxed animate-pulse">{transcription}</p> : <p className="text-slate-500 italic">Väntar på röst- eller textströmning från ansluten session...</p>}
      </div>

      <div className="space-y-1.5">
        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1"><Activity className="w-3 h-3 text-cyan-400" /> Senaste händelser ({recentEnvelopes.length})</span>
        <div className="space-y-1 max-h-[100px] overflow-y-auto font-mono text-[10px]">{eventItems}</div>
      </div>
    </div>
  );
};
