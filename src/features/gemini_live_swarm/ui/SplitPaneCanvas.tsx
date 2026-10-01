import React, { useState, useRef, useEffect, useCallback } from 'react';

export interface SplitPaneCanvasProps {
  upperContent?: React.ReactNode;
  lowerContent?: React.ReactNode;
  initialSplitRatio?: number;
  onSplitChange?: (ratio: number) => void;
  className?: string;
}

const NOOP = () => {};

export const SplitPaneCanvas: React.FC<SplitPaneCanvasProps> = ({
  upperContent = null,
  lowerContent = null,
  initialSplitRatio = 50,
  onSplitChange = NOOP,
  className = '',
}) => {
  const [splitRatio, setSplitRatio] = useState<number>(() =>
    Math.max(15, Math.min(85, initialSplitRatio))
  );
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const updateRatioFromPointer = useCallback(
    (clientY: number) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const rawRatio = ((clientY - rect.top) / rect.height) * 100;
      const clamped = Math.max(15, Math.min(85, Math.round(rawRatio)));
      setSplitRatio(clamped);
      onSplitChange(clamped);
    },
    [onSplitChange]
  );

  useEffect(() => {
    if (!isDragging) return;
    const handlePointerMove = (e: PointerEvent) => updateRatioFromPointer(e.clientY);
    const handlePointerUp = () => setIsDragging(false);

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, updateRatioFromPointer]);

  return (
    <div
      ref={containerRef}
      data-testid="split-pane-container"
      className={`flex-1 flex flex-col overflow-hidden relative ${className}`}
    >
      <section
        data-testid="upper-pane"
        style={{ height: `${splitRatio}%` }}
        className="w-full overflow-auto bg-slate-950 p-3"
      >
        {upperContent}
      </section>

      <div
        role="separator"
        tabIndex={0}
        aria-valuenow={splitRatio}
        data-testid="split-pane-divider"
        onPointerDown={() => setIsDragging(true)}
        className="h-2 w-full bg-slate-800 hover:bg-emerald-500/50 active:bg-emerald-500 cursor-row-resize flex items-center justify-center transition-colors shrink-0"
      >
        <div className="w-8 h-1 rounded-full bg-slate-600" />
      </div>

      <section
        data-testid="lower-pane"
        style={{ height: `${100 - splitRatio}%` }}
        className="w-full overflow-auto bg-slate-900/60 p-3 flex-1"
      >
        {lowerContent}
      </section>
    </div>
  );
};
