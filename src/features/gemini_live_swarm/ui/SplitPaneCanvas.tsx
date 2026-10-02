import React, { useState, useEffect, useRef } from 'react';
import { SwarmIntent } from './splitPaneHelper.ts';
import { ExecutionCard } from './ExecutionCard.tsx';

export const SplitPaneCanvas: React.FC = () => {
  const [splitPos, setSplitPos] = useState<number>(50); // 0, 50, 100
  const [activeIntent, setActiveIntent] = useState<SwarmIntent | null>(null);
  const [isPortrait, setIsPortrait] = useState<boolean>(true);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Detektera skärmorientering
  useEffect(() => {
    const updateOrientation = () => {
      if (typeof window !== 'undefined') {
        setIsPortrait(window.innerHeight >= window.innerWidth);
      }
    };
    updateOrientation();
    window.addEventListener('resize', updateOrientation);
    return () => window.removeEventListener('resize', updateOrientation);
  }, []);

  // Tangentbordsgenvägar (piltangenter för 3-stegs snap)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowLeft'].includes(e.key)) {
        e.preventDefault();
        setSplitPos((prev) => (prev === 100 ? 50 : 0));
      } else if (['ArrowDown', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        setSplitPos((prev) => (prev === 0 ? 50 : 100));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Svepgester (Swipe handlers)
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    const threshold = 40; // Pixlar krävs för swipe
    if (isPortrait) {
      if (deltaY < -threshold) setSplitPos((prev) => (prev === 100 ? 50 : 0)); // Swipe upp
      if (deltaY > threshold) setSplitPos((prev) => (prev === 0 ? 50 : 100)); // Swipe ned
    } else {
      if (deltaX < -threshold) setSplitPos((prev) => (prev === 100 ? 50 : 0)); // Swipe vänster
      if (deltaX > threshold) setSplitPos((prev) => (prev === 0 ? 50 : 100)); // Swipe höger
    }
  };

  const toggleIntent = (intent: SwarmIntent) => {
    setActiveIntent((prev) => (prev === intent ? null : intent));
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`flex h-full w-full overflow-hidden ${isPortrait ? 'flex-col' : 'flex-row'}`}
    >
      {/* Chattvy (Zon 1) */}
      <div
        style={{ [isPortrait ? 'height' : 'width']: `${splitPos}%` }}
        className="transition-all duration-300 ease-out overflow-hidden bg-slate-900/40 p-4 border-slate-800 flex flex-col"
      >
        <div className="text-xs font-mono text-emerald-400 mb-2">💬 Agentchatt & Dialog</div>
        <div className="flex-1 bg-slate-950/60 rounded border border-slate-800/80 p-3 overflow-y-auto text-sm text-slate-300">
          {activeIntent ? (
            <p className="text-emerald-300 font-mono">Aktiv röstström: {activeIntent}</p>
          ) : (
            <p className="text-slate-500 italic">Välj ett intention-läge på delningsraden för att starta röstinteraktion.</p>
          )}
        </div>
      </div>

      {/* Delningsrad / Kontrollrad */}
      <div className="flex-none bg-slate-800 border-slate-700/60 p-1.5 flex items-center justify-between z-20 shadow-lg">
        {/* Upp / Vänster-pil */}
        <button
          onClick={() => setSplitPos((prev) => (prev === 100 ? 50 : 0))}
          disabled={splitPos === 0}
          className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
            splitPos === 0 ? 'opacity-20 cursor-not-allowed' : 'bg-slate-700 hover:bg-slate-600 text-slate-100'
          }`}
        >
          {isPortrait ? '⇧' : '⇐'}
        </button>

        {/* Mittenknappar (Intent Triggers) */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleIntent('REFLEKTERA')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              activeIntent === 'REFLEKTERA'
                ? 'bg-amber-500 text-slate-950 scale-105 shadow-md shadow-amber-500/20'
                : 'bg-slate-700/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            🎬 Reflektera
          </button>
          <button
            onClick={() => toggleIntent('KOM_IHAG')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              activeIntent === 'KOM_IHAG'
                ? 'bg-sky-500 text-slate-950 scale-105 shadow-md shadow-sky-500/20'
                : 'bg-slate-700/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            🧠 Kom ihåg
          </button>
          <button
            onClick={() => toggleIntent('RADGOR')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              activeIntent === 'RADGOR'
                ? 'bg-emerald-500 text-slate-950 scale-105 shadow-md shadow-emerald-500/20'
                : 'bg-slate-700/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            💬 Rådgör
          </button>
        </div>

        {/* Ned / Höger-pil */}
        <button
          onClick={() => setSplitPos((prev) => (prev === 0 ? 50 : 100))}
          disabled={splitPos === 100}
          className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
            splitPos === 100 ? 'opacity-20 cursor-not-allowed' : 'bg-slate-700 hover:bg-slate-600 text-slate-100'
          }`}
        >
          {isPortrait ? '⇩' : '⇒'}
        </button>
      </div>

      {/* Kanvasvy (Zon 2) */}
      <div
        style={{ [isPortrait ? 'height' : 'width']: `${100 - splitPos}%` }}
        className="transition-all duration-300 ease-out overflow-hidden bg-slate-950 p-4 flex flex-col"
      >
        <div className="text-xs font-mono text-sky-400 mb-2">🖥️ Exekveringskanvas</div>
        <div className="flex-1 overflow-auto">
          <ExecutionCard />
        </div>
      </div>
    </div>
  );
};