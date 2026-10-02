import React, { useState, useEffect, useRef } from 'react';
import { useOptionalSwarmContext } from '../context/SwarmContext.tsx';
import {
  SwarmIntent,
  SplitSnapState,
  computeSplitArrows,
  handleKeyboardNavigation,
  handleSwipeGesture,
  getIntentButtonClass,
  getIntentTextClass,
  SWARM_INTENTS,
} from './splitPaneHelper.ts';
import { ExecutionCard } from './ExecutionCard.tsx';

export const SplitPaneCanvas: React.FC = () => {
  const [splitPos, setSplitPos] = useState<SplitSnapState>(50);
  const [activeIntent, setActiveIntent] = useState<SwarmIntent | null>(null);
  const [isPortrait, setIsPortrait] = useState<boolean>(true);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const swarmCtx = useOptionalSwarmContext();

  useEffect(() => {
    const update = () => setIsPortrait(window.innerHeight >= window.innerWidth);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const next = handleKeyboardNavigation(e.key, isPortrait ? 'portrait' : 'landscape', splitPos);
      if (next !== splitPos) {
        e.preventDefault();
        setSplitPos(next);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isPortrait, splitPos]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    touchStartRef.current = null;
    setSplitPos(handleSwipeGesture(dx, dy, isPortrait ? 'portrait' : 'landscape', splitPos));
  };

  const handleIntentClick = async (intentId: SwarmIntent) => {
    const nextIntent = activeIntent === intentId ? null : intentId;
    setActiveIntent(nextIntent);
    if (swarmCtx?.liveSession) {
      if (nextIntent) {
        await swarmCtx.liveSession.activateIntent(nextIntent);
      } else {
        swarmCtx.liveSession.deactivateIntent();
      }
    }
  };

  const arrows = computeSplitArrows(isPortrait ? 'portrait' : 'landscape', splitPos);

  return (
    <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} className={`flex h-full w-full overflow-hidden ${isPortrait ? 'flex-col' : 'flex-row'}`}>
      <div style={{ [isPortrait ? 'height' : 'width']: `${splitPos}%` }} className="transition-all duration-300 overflow-hidden bg-slate-900/40 p-4 border-slate-800 flex flex-col">
        <div className="text-xs font-mono text-emerald-400 mb-2">💬 Agentchatt & Dialog</div>
        <div className="flex-1 bg-slate-950/60 rounded border border-slate-800/80 p-3 overflow-y-auto text-sm text-slate-300">
          {activeIntent ? <p className="text-emerald-300 font-mono">Aktiv röstström: {activeIntent}</p> : <p className="text-slate-500 italic">Välj ett intention-läge på delningsraden för att starta röstinteraktion.</p>}
        </div>
      </div>

      <div className="flex-none bg-slate-800 border-slate-700/60 p-1.5 flex items-center justify-between z-20 shadow-lg">
        <button onClick={() => setSplitPos((prev) => (prev === 100 ? 50 : 0))} disabled={!arrows.showFirst} className={`px-3 py-1.5 rounded text-xs font-bold ${arrows.showFirst ? 'bg-slate-700 hover:bg-slate-600 text-slate-100' : 'opacity-20 cursor-not-allowed'}`}>
          {arrows.firstIcon}
        </button>

        <div className="flex items-center gap-2">
          {SWARM_INTENTS.map((item) => (
            <button key={item.id} onClick={() => handleIntentClick(item.id)} className={getIntentButtonClass(item.id, activeIntent)}>
              <span>{item.icon}</span>
              <span className={getIntentTextClass(item.id, activeIntent)}>{item.label}</span>
            </button>
          ))}
        </div>

        <button onClick={() => setSplitPos((prev) => (prev === 0 ? 50 : 100))} disabled={!arrows.showSecond} className={`px-3 py-1.5 rounded text-xs font-bold ${arrows.showSecond ? 'bg-slate-700 hover:bg-slate-600 text-slate-100' : 'opacity-20 cursor-not-allowed'}`}>
          {arrows.secondIcon}
        </button>
      </div>

      <div style={{ [isPortrait ? 'height' : 'width']: `${100 - splitPos}%` }} className="transition-all duration-300 overflow-hidden bg-slate-950 p-4 flex flex-col">
        <div className="text-xs font-mono text-sky-400 mb-2">🖥️ Exekveringskanvas</div>
        <div className="flex-1 overflow-auto"><ExecutionCard /></div>
      </div>
    </div>
  );
};