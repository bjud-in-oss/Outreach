import React, { useState } from 'react';
import { CROWN_SYMBOLS, STATUS_LED_CLASSES } from './crownStateHelper.ts';

export interface ExecutionCardProps {
  id: string;
  force: 'ATT_FOLJA' | 'ATT_VANDA_OM' | 'ATT_FORLIKAS' | 'SERIELL_MOTOR';
  stepNumber: number;
  title: string;
  createdFiles?: string[];
  changesSummary?: string;
  voiceSummary?: string;
  timestamp?: string;
  defaultExpanded?: boolean;
  className?: string;
}

export const ExecutionCard: React.FC<ExecutionCardProps> = ({
  id,
  force,
  stepNumber,
  title,
  createdFiles = [],
  changesSummary = '',
  voiceSummary = '',
  timestamp = '',
  defaultExpanded = false,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
  const symbol = CROWN_SYMBOLS[force] || '●';
  const detailDisplay = isExpanded ? 'block' : 'hidden';

  return (
<article data-testid="execution-card" id={`card-${id}`} className={`rounded-lg border border-slate-800 bg-slate-900/80 my-2 overflow-hidden text-xs select-none ${className}`}>
  <header data-testid="execution-card-header" onClick={() => setIsExpanded(!isExpanded)} className="px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-slate-800/60 transition-colors">
    <div className="flex items-center gap-2">
      <span className={`font-bold text-sm ${STATUS_LED_CLASSES.ACTIVE}`}>{symbol}</span>
      <span className="font-semibold text-slate-200">Exekveringskort #{stepNumber}</span>
      <span className="text-slate-400 font-mono truncate max-w-xs">{title}</span>
    </div>
    <span className="text-[10px] text-slate-500 font-mono">{isExpanded ? '▲ Dölj' : '▼ Visa'}</span>
  </header>
  <div data-testid="execution-card-body" className={`${detailDisplay} px-3 pb-3 pt-1 border-t border-slate-800/60 text-slate-300 font-mono text-[11px]`}>
    <div className="text-slate-400 mb-1">{changesSummary}</div>
    <div className="flex flex-col gap-0.5 text-slate-500">
      {createdFiles.map((file) => <span key={file} className="text-emerald-400/90 truncate">📄 {file}</span>)}
    </div>
    <div className="text-slate-500 text-[10px] mt-1.5">{voiceSummary} {timestamp}</div>
  </div>
</article>
  );
};
