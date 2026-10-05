import React, { useState, useEffect, useRef } from 'react';
import { Compass, RotateCcw } from 'lucide-react';
import { useOptionalSwarmContext } from '../context/SwarmContext.tsx';
import {
  SwarmIntent,
  SplitSnapState,
  AccumulatedTurn,
  SWARM_INTENTS,
  PANEL_TITLES,
  computeSplitArrows,
  handleKeyboardNavigation,
  stepSnapState,
  getIntentButtonClass,
  getIntentTextClass,
  getDividerContainerClass,
  getPaneSizeStyle,
  extractTurnEventData,
  appendStreamChunkToTurns,
  handlePointerMoveOnDivider,
  toggleSwarmIntent,
} from './splitPaneHelper.ts';
import { ExecutionCard } from './ExecutionCard.tsx';

export const ReconciliationRaysIcon: React.FC<{ size?: number; className?: string }> = ({ size = 16, className = 'text-amber-400' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 18L12 6L20 18" /><path d="M8 14L12 8L16 14" /><circle cx="12" cy="7" r="1.5" fill="currentColor" />
  </svg>
);

const INTENT_ICONS: Record<SwarmIntent, React.ReactNode> = {
  REFLECT: <Compass className="w-4 h-4 text-sky-400 shrink-0" />,
  CONSULT: <ReconciliationRaysIcon className="w-4 h-4 text-amber-400 shrink-0" />,
  REMEMBER: <RotateCcw className="w-4 h-4 text-purple-400 shrink-0" />,
};

const renderTurn = (t: AccumulatedTurn) => (
  <div key={t.id} className="p-2 rounded bg-slate-900/80 text-slate-200 border border-slate-800">
    <div className="font-semibold text-slate-400 text-xs mb-1 flex justify-between">
      <span>{t.agentRole}</span><span className="text-[10px] text-slate-500">{t.forceTitle}</span>
    </div>
    <p className="leading-relaxed text-xs">{t.text}</p>
  </div>
);

export interface SplitPaneCanvasProps {
  upperContent?: React.ReactNode; lowerContent?: React.ReactNode; initialSplitRatio?: number; isImmersive?: boolean; className?: string;
}

export const SplitPaneCanvas: React.FC<SplitPaneCanvasProps> = () => {
  const [splitPos, setSplitPos] = useState<SplitSnapState>(50);
  const [activeIntent, setActiveIntent] = useState<SwarmIntent | null>(null);
  const [turns, setTurns] = useState<AccumulatedTurn[]>([]);
  const [isPortrait, setIsPortrait] = useState<boolean>(true);
  const isDraggingRef = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const swarmCtx = useOptionalSwarmContext();

  useEffect(() => {
    const update = () => setIsPortrait(window.innerHeight >= window.innerWidth);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    return swarmCtx?.eventBus.subscribe('*', (env) => {
      const { text, role, force, isComplete, shouldReset } = extractTurnEventData(env.data, env.type);
      if (text) setTurns((prev) => appendStreamChunkToTurns(prev, text, role, force, isComplete));
      if (shouldReset) setActiveIntent(null);
    });
  }, [swarmCtx]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      e.preventDefault();
      setSplitPos(handleKeyboardNavigation(e.key, isPortrait ? 'portrait' : 'landscape', splitPos));
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isPortrait, splitPos]);

  const handleIntentClick = async (intentId: SwarmIntent) => {
    const next = await toggleSwarmIntent(swarmCtx?.liveSession, activeIntent, intentId);
    setActiveIntent(next);
  };

  const arrows = computeSplitArrows(isPortrait ? 'portrait' : 'landscape', splitPos);

  return (
<div ref={containerRef} className={`flex h-full w-full overflow-hidden ${isPortrait ? 'flex-col' : 'flex-row'}`}>
  <div style={getPaneSizeStyle(isPortrait ? 'portrait' : 'landscape', splitPos, true)} className="transition-all duration-300 overflow-hidden bg-slate-900/40 p-4 border-slate-800 flex flex-col">
    <div className="text-xs font-mono text-emerald-400 mb-2">Dialog</div>
    <div className="flex-1 bg-slate-950/60 rounded border border-slate-800/80 p-3 overflow-y-auto text-sm text-slate-300 flex flex-col gap-2">
      <p className="text-emerald-300 font-mono text-xs">{activeIntent ? `Aktiv röstström: ${activeIntent}` : 'Välj ett läge på delningsraden.'}</p>
      {turns.map(renderTurn)}
    </div>
  </div>

  <div
    className={getDividerContainerClass(isPortrait)}
    onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); isDraggingRef.current = true; }}
    onPointerMove={(e) => handlePointerMoveOnDivider(isDraggingRef.current, containerRef.current, e.clientX, e.clientY, isPortrait, setSplitPos)}
    onPointerUp={() => { isDraggingRef.current = false; }}
  >
    <button data-testid="snap-toggle-button" onClick={() => setSplitPos(stepSnapState(splitPos, 'prev'))} disabled={!arrows.showFirst} className="px-3 py-1.5 rounded text-xs font-bold bg-slate-700 hover:bg-slate-600 text-slate-100 disabled:opacity-20"><span data-testid="snap-handle-icon">{arrows.firstIcon}</span></button>
    <div className={`flex items-center gap-2 ${isPortrait ? 'flex-row' : 'flex-col'}`}>
      {SWARM_INTENTS.map((item) => (
        <button key={item.id} onPointerDown={(e) => e.stopPropagation()} onClick={() => handleIntentClick(item.id)} className={getIntentButtonClass(item.id, activeIntent)}>{INTENT_ICONS[item.id]}<span className={getIntentTextClass(isPortrait)}>{item.label}</span></button>
      ))}
    </div>
    <button onClick={() => setSplitPos(stepSnapState(splitPos, 'next'))} disabled={!arrows.showSecond} className="px-3 py-1.5 rounded text-xs font-bold bg-slate-700 hover:bg-slate-600 text-slate-100 disabled:opacity-20">{arrows.secondIcon}</button>
  </div>

  <div style={getPaneSizeStyle(isPortrait ? 'portrait' : 'landscape', splitPos, false)} className="transition-all duration-300 overflow-hidden bg-slate-950 p-4 flex flex-col">
    <div className="text-xs font-mono text-sky-400 mb-2">Verktyg</div>
    <div className="flex-1 overflow-auto"><ExecutionCard /></div>
  </div>
</div>
  );
};
