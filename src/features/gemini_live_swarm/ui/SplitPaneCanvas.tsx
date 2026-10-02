import React, { useState, useRef, useEffect } from 'react';
import {
  SwarmIntent,
  SplitOrientation,
  SplitSnapState,
  SWARM_INTENTS,
  computeSplitArrows,
  getIntentButtonClass,
  getIntentTextClass,
  getArrowDisplay,
  getPaneDirectionClass,
  getDividerStyleClass,
  getPaneSizeStyle,
  stepSnapState,
  handleKeyboardNavigation,
  handleSwipeGesture,
  clampSnapState,
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
  const [splitRatio, setSplitRatio] = useState<SplitSnapState>(() => clampSnapState(initialSplitRatio));
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const arrows = computeSplitArrows(orientation, splitRatio);
  const dirClass = getPaneDirectionClass(orientation);
  const divStyle = getDividerStyleClass(orientation);

  const applyStep = (dir: 'prev' | 'next') => {
    const next = stepSnapState(splitRatio, dir);
    setSplitRatio(next);
    onSplitChange(next);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const next = handleKeyboardNavigation(e.key, orientation, splitRatio);
      setSplitRatio(next);
      onSplitChange(next);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [orientation, splitRatio, onSplitChange]);

  return (
<div ref={containerRef} data-testid="split-pane-container" onTouchStart={(e) => { touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }} onTouchEnd={(e) => {
  if (!touchStartRef.current) return;
  const dX = e.changedTouches[0].clientX - touchStartRef.current.x;
  const dY = e.changedTouches[0].clientY - touchStartRef.current.y;
  const next = handleSwipeGesture(dX, dY, orientation, splitRatio);
  setSplitRatio(next);
  onSplitChange(next);
}} className={`flex-1 flex overflow-hidden relative select-none ${dirClass} ${className}`}>
  <section data-testid="upper-pane" style={getPaneSizeStyle(orientation, splitRatio, true)} className="overflow-auto bg-slate-950 p-3 transition-[height,width] duration-150">
    {upperContent}
  </section>
  <div role="separator" tabIndex={0} aria-valuenow={splitRatio} data-testid="split-pane-divider" className={`bg-slate-900 border-slate-800 flex items-center justify-between shrink-0 transition-colors ${divStyle}`}>
    <button type="button" data-testid="snap-min-button snap-toggle-button" onClick={() => applyStep('prev')} className={`items-center justify-center w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-transform active:scale-95 ${getArrowDisplay(arrows.showFirst)}`}><span data-testid="snap-handle-icon">{arrows.firstIcon}</span></button>
    <div data-testid="adaptive-control-bar" className="flex items-center gap-1.5 px-1 py-0.5">
      {SWARM_INTENTS.map((item) => (
        <button key={item.id} type="button" data-testid={`intent-btn-${item.id.toLowerCase()}`} onClick={() => onIntentSelect(item.id)} className={getIntentButtonClass(item.id, activeIntent)}><span>{item.icon}</span><span className={getIntentTextClass(item.id, activeIntent)}>{item.label}</span></button>
      ))}
    </div>
    <button type="button" data-testid="snap-max-button" onClick={() => applyStep('next')} className={`items-center justify-center w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-transform active:scale-95 ${getArrowDisplay(arrows.showSecond)}`}><span>{arrows.secondIcon}</span></button>
  </div>
  <section data-testid="lower-pane" style={getPaneSizeStyle(orientation, splitRatio, false)} className="overflow-auto bg-slate-900/60 p-3 flex-1 transition-[height,width] duration-150">
    {lowerContent}
  </section>
</div>
  );
};
