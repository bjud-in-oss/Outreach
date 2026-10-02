import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  SwarmIntent,
  SplitOrientation,
  SWARM_INTENTS,
  computeSplitArrows,
  getIntentButtonClass,
  getIntentTextClass,
  getArrowDisplay,
  getPaneDirectionClass,
  getDividerStyleClass,
  getPaneSizeStyle,
  calculateRatioFromPointer,
  computeSnapTarget,
} from './splitPaneHelper.ts';

export interface SplitPaneCanvasProps {
  upperContent?: React.ReactNode;
  lowerContent?: React.ReactNode;
  initialSplitRatio?: number;
  onSplitChange?: (ratio: number) => void;
  className?: string;
  isImmersive?: boolean;
  activeIntent?: SwarmIntent | null;
  onIntentSelect?: (intent: SwarmIntent) => void;
  orientation?: SplitOrientation;
}

const NOOP = () => {};

export const SplitPaneCanvas: React.FC<SplitPaneCanvasProps> = ({
  upperContent = null,
  lowerContent = null,
  initialSplitRatio = 50,
  onSplitChange = NOOP,
  className = '',
  activeIntent = null,
  onIntentSelect = NOOP,
  orientation = 'portrait',
}) => {
  const [splitRatio, setSplitRatio] = useState<number>(initialSplitRatio);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const arrows = computeSplitArrows(orientation, splitRatio);
  const dirClass = getPaneDirectionClass(orientation);
  const divStyle = getDividerStyleClass(orientation);

  const handlePointerUpdate = useCallback(
    (clientX: number, clientY: number) => {
      const container = containerRef.current;
      if (!container) return;
      const nextRatio = calculateRatioFromPointer(
        clientX,
        clientY,
        container.getBoundingClientRect(),
        orientation
      );
      setSplitRatio(nextRatio);
      onSplitChange(nextRatio);
    },
    [onSplitChange, orientation]
  );

  const applySnap = (toMin: boolean) => {
    const next = computeSnapTarget(splitRatio, toMin);
    setSplitRatio(next);
    onSplitChange(next);
  };

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: PointerEvent) => handlePointerUpdate(e.clientX, e.clientY);
    const onUp = () => setIsDragging(false);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [isDragging, handlePointerUpdate]);

  return (
<div ref={containerRef} data-testid="split-pane-container" className={`flex-1 flex overflow-hidden relative select-none ${dirClass} ${className}`}>
  <section data-testid="upper-pane" style={getPaneSizeStyle(orientation, splitRatio, true)} className="overflow-auto bg-slate-950 p-3 transition-[height,width] duration-75">
    {upperContent}
  </section>
  <div role="separator" tabIndex={0} aria-valuenow={splitRatio} data-testid="split-pane-divider" onPointerDown={() => setIsDragging(true)} className={`bg-slate-900 border-slate-800 hover:border-emerald-500/50 flex items-center justify-between shrink-0 transition-colors ${divStyle}`}>
    <button type="button" data-testid="snap-min-button snap-toggle-button" onClick={() => applySnap(true)} className={`items-center justify-center w-6 h-6 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-transform active:scale-95 ${getArrowDisplay(arrows.showFirst)}`}><span data-testid="snap-handle-icon">{arrows.firstIcon}</span></button>
    <div data-testid="adaptive-control-bar" className="flex items-center gap-1.5 px-1 py-0.5">
      {SWARM_INTENTS.map((item) => (
        <button key={item.id} type="button" data-testid={`intent-btn-${item.id.toLowerCase()}`} onClick={() => onIntentSelect(item.id)} className={getIntentButtonClass(item.id, activeIntent)}><span>{item.icon}</span><span className={getIntentTextClass(item.id, activeIntent)}>{item.label}</span></button>
      ))}
    </div>
    <button type="button" data-testid="snap-max-button" onClick={() => applySnap(false)} className={`items-center justify-center w-6 h-6 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-transform active:scale-95 ${getArrowDisplay(arrows.showSecond)}`}><span>{arrows.secondIcon}</span></button>
  </div>
  <section data-testid="lower-pane" style={getPaneSizeStyle(orientation, splitRatio, false)} className="overflow-auto bg-slate-900/60 p-3 flex-1 transition-[height,width] duration-75">
    {lowerContent}
  </section>
</div>
  );
};
