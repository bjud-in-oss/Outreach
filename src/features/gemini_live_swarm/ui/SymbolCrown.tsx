import React, { useState, useEffect } from 'react';
import { SwarmEventBus, getGlobalSwarmEventBus } from '../bus/swarmEventBus.ts';
import {
  CrownStatusColor,
  CrownState,
  CROWN_SYMBOLS,
  STATUS_LED_CLASSES,
  LED_BG_CLASSES,
  resolveCrownFromEnvelope,
} from './crownStateHelper.ts';

export type { CrownStatusColor, CrownState };
export { CROWN_SYMBOLS, STATUS_LED_CLASSES };

export interface SymbolCrownProps {
  bus?: SwarmEventBus;
  initialState?: Partial<CrownState>;
  className?: string;
}

const DEFAULT_STATE: CrownState = {
  symbol: CROWN_SYMBOLS.ATT_FOLJA,
  color: 'ACTIVE',
  activityText: 'Redo för samordning',
};

export const SymbolCrown: React.FC<SymbolCrownProps> = ({
  bus,
  initialState,
  className = '',
}) => {
  const [state, setState] = useState<CrownState>(() =>
    Object.assign({}, DEFAULT_STATE, initialState)
  );

  useEffect(() => {
    const activeBus = bus || getGlobalSwarmEventBus();
    const unsubscribe = activeBus.subscribe('*', (env) => {
      setState((prev) => resolveCrownFromEnvelope(env, prev));
    });
    return unsubscribe;
  }, [bus]);

  const symbolClass = `${STATUS_LED_CLASSES[state.color]} font-bold text-sm leading-none transition-colors`;
  const ledClass = `${LED_BG_CLASSES[state.color]} inline-block w-2.5 h-2.5 rounded-full transition-colors`;

  return (
    <header
      data-testid="symbol-crown"
      className={`h-9 px-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs select-none shrink-0 ${className}`}
    >
      <div className="flex items-center gap-2">
        <span data-testid="crown-symbol" className={symbolClass}>{state.symbol}</span>
        <span data-testid="crown-activity" className="text-slate-400 font-mono truncate max-w-xs md:max-w-md">{state.activityText}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span data-testid="crown-status-led" className={ledClass} />
      </div>
    </header>
  );
};
