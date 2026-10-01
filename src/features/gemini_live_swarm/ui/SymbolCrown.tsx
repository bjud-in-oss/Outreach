import React, { useState, useEffect } from 'react';
import { SwarmEventBus, getGlobalSwarmEventBus } from '../bus/swarmEventBus.ts';
import {
  CrownStatusColor,
  CrownState,
  CROWN_SYMBOLS,
  STATUS_LED_CLASSES,
  resolveCrownFromEnvelope,
} from './crownStateHelper.ts';

export type { CrownStatusColor, CrownState };
export { CROWN_SYMBOLS, STATUS_LED_CLASSES };

export interface SymbolCrownProps {
  bus?: SwarmEventBus;
  initialState?: Partial<CrownState>;
  className?: string;
  defaultExpanded?: boolean;
  onToggleExpand?: (expanded: boolean) => void;
}

const DEFAULT_STATE: CrownState = {
  symbol: CROWN_SYMBOLS.ATT_FOLJA,
  color: 'ACTIVE',
  activityText: 'Redo för samordning',
};

const NOOP = () => {};

export const SymbolCrown: React.FC<SymbolCrownProps> = ({
  bus,
  initialState,
  className = '',
  defaultExpanded = false,
  onToggleExpand = NOOP,
}) => {
  const [state, setState] = useState<CrownState>(() =>
    Object.assign({}, DEFAULT_STATE, initialState)
  );
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);

  useEffect(() => {
    const activeBus = bus || getGlobalSwarmEventBus();
    const unsubscribe = activeBus.subscribe('*', (env) => {
      setState((prev) => resolveCrownFromEnvelope(env, prev));
    });
    return unsubscribe;
  }, [bus]);

  const toggleExpand = () => {
    const next = !isExpanded;
    setIsExpanded(next);
    onToggleExpand(next);
  };

  const symbolClass = `${STATUS_LED_CLASSES[state.color]} font-bold text-base leading-none transition-colors`;
  const detailDisplay = isExpanded ? 'block' : 'hidden';
  const forceText = state.activeForce || 'ATT_FOLJA';

  return (
<div className="flex flex-col shrink-0 select-none">
  <header data-testid="symbol-crown" onClick={toggleExpand} className={`h-9 px-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-800/80 transition-colors ${className}`}>
    <div className="flex items-center gap-2">
      <span data-testid="crown-symbol" className={symbolClass}>{state.symbol}</span>
      <span data-testid="crown-colon" className="text-slate-500 font-bold">:</span>
      <span data-testid="crown-activity" className="text-slate-300 font-mono truncate max-w-xs md:max-w-md">{state.activityText}</span>
    </div>
    <span data-testid="crown-expand-indicator" className="text-[10px] text-slate-500 font-mono">{isExpanded ? '▲' : '▼'}</span>
  </header>
  <div data-testid="crown-detail-panel" className={`${detailDisplay} bg-slate-900 border-b border-slate-800 p-2.5 text-[11px] font-mono text-slate-300 flex flex-col gap-1 shadow-lg`}>
    <div className="flex justify-between items-center text-slate-400">
      <span>Aktiv kraft: {forceText}</span>
      <span className={STATUS_LED_CLASSES[state.color]}>Status: {state.color}</span>
    </div>
    <div className="text-slate-400 truncate">Handling: {state.activityText}</div>
  </div>
</div>
  );
};
