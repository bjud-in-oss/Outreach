import React, { useState, useEffect, useRef } from 'react';
import { useOptionalSwarmContext } from '../context/SwarmContext.tsx';
import {
  SplitSnapState,
  AccumulatedTurn,
  handleKeyboardNavigation,
  getDividerContainerClass,
  getPaneSizeStyle,
  extractTurnEventData,
  appendStreamChunkToTurns,
  handlePointerMoveOnDivider,
} from './splitPaneHelper.ts';
import { ExecutionCard } from './ExecutionCard.tsx';
import { TurnContainer } from './TurnContainer.tsx';

const renderTurn = (t: AccumulatedTurn) => <TurnContainer key={t.id} turn={t} />;

export interface SplitPaneCanvasProps {
  upperContent?: React.ReactNode; lowerContent?: React.ReactNode; initialSplitRatio?: number; isImmersive?: boolean; className?: string;
}

export const SplitPaneCanvas: React.FC<SplitPaneCanvasProps> = () => {
  const [splitPos, setSplitPos] = useState<SplitSnapState>(50);
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
      const { text, role, force, isComplete } = extractTurnEventData(env.data, env.type);
      if (text) setTurns((prev) => appendStreamChunkToTurns(prev, text, role, force, isComplete));
    });
  }, [swarmCtx]);

  const orientation = isPortrait ? 'portrait' : 'landscape';

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      e.preventDefault();
      setSplitPos(handleKeyboardNavigation(e.key, orientation, splitPos));
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [orientation, splitPos]);

  return (
<div ref={containerRef} className={`flex h-full w-full overflow-hidden ${isPortrait ? 'flex-col' : 'flex-row'}`}>
  <div style={getPaneSizeStyle(orientation, splitPos, true)} className="transition-all duration-300 overflow-hidden bg-slate-900/40 p-4 border-slate-800 flex flex-col">
    <div className="text-xs font-mono text-emerald-400 mb-2">Dialog</div>
    <div className="flex-1 bg-slate-950/60 rounded border border-slate-800/80 p-3 overflow-y-auto text-sm text-slate-300 flex flex-col gap-2">
      <p className="text-emerald-300 font-mono text-xs">Samtalsvy</p>
      {turns.map(renderTurn)}
    </div>
  </div>

  {/* Sanerad delare: snap-toggle-button och snap-handle-icon ersatta med ren 3px drag-skena */}
  <div
    data-testid="split-pane-divider"
    className={getDividerContainerClass(isPortrait)}
    onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); isDraggingRef.current = true; }}
    onPointerMove={(e) => handlePointerMoveOnDivider(isDraggingRef.current, containerRef.current, e.clientX, e.clientY, isPortrait, setSplitPos)}
    onPointerUp={() => { isDraggingRef.current = false; }}
  />

  <div style={getPaneSizeStyle(orientation, splitPos, false)} className="transition-all duration-300 overflow-hidden bg-slate-950 p-4 flex flex-col">
    <div className="text-xs font-mono text-sky-400 mb-2">Verktyg</div>
    <div className="flex-1 overflow-auto"><ExecutionCard /></div>
  </div>
</div>
  );
};
