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
  const [messages, setMessages] = useState<string[]>([]);
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
    if (!swarmCtx?.eventBus) return;
    return swarmCtx.eventBus.subscribe('*', (env) => {
      if (env.type === 'swarm.live.stream.transcription' && env.data?.transcription) {
        setMessages((prev) => [...prev.slice(-20), env.data.transcription]);
      }
    });
  }, [swarmCtx]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const next = handleKeyboardNavigation(e.key, isPortrait ? 'portrait' : 'landscape', splitPos);
      e.preventDefault();
      setSplitPos(next);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isPortrait, splitPos]);

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
    if (!swarmCtx?.liveSession) return;
    nextIntent ? await swarmCtx.liveSession.activateIntent(nextIntent) : swarmCtx.liveSession.deactivateIntent();
  };

  const arrows = computeSplitArrows(isPortrait ? 'portrait' : 'landscape', splitPos);

  return (
    <div onTouchStart={(e) => { touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }} onTouchEnd={handleTouchEnd} className={`flex h-full w-full overflow-hidden ${isPortrait ? 'flex-col' : 'flex-row'}`}>
      <div style={{ [isPortrait ? 'height' : 'width']: `${splitPos}%` }} className="transition-all duration-300 overflow-hidden bg-slate-900/40 p-4 border-slate-800 flex flex-col">
        <div className="text-xs font-mono text-emerald-400 mb-2">💬 Agentchatt & Dialog</div>
        <div className="flex-1 bg-slate-950/60 rounded border border-slate-800/80 p-3 overflow-y-auto text-sm text-slate-300 flex flex-col gap-1.5">
          <p className="text-emerald-300 font-mono text-xs">{activeIntent ? `Aktiv röstström: ${activeIntent}` : 'Välj ett intention-läge på delningsraden.'}</p>
          {messages.map((m, i) => (
            <div key={i} className="p-1.5 rounded bg-slate-900/80 text-xs text-slate-200 border border-slate-800">{m}</div>
          ))}
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