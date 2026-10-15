import React, { useState, useEffect, useRef } from 'react';
import { SymbolCrown } from './SymbolCrown.tsx';
import { UnifiedPromptBar } from './UnifiedPromptBar.tsx';
import { TurnContainer } from './TurnContainer.tsx';
import { useOptionalSwarmContext } from '../context/SwarmContext.tsx';
import {
  AccumulatedTurn,
  appendStreamChunkToTurns,
  extractTurnEventData,
} from './turnContainerHelper.ts';

export const AppShell: React.FC = () => {
  const [turns, setTurns] = useState<AccumulatedTurn[]>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const swarmCtx = useOptionalSwarmContext();

  useEffect(() => {
    const hasWin = typeof window !== 'undefined';
    const mql = hasWin ? window.matchMedia('(orientation: portrait)') : null;
    return () => mql?.removeEventListener?.('change', () => {});
  }, []);

  useEffect(() => {
    return swarmCtx?.eventBus.subscribe('*', (env) => {
      const { text, role, force, isComplete, shouldReset, clientMessageId } = extractTurnEventData(env.data, env.type);
      if (shouldReset) { setTurns([]); return; }
      if (text) setTurns((prev) => appendStreamChunkToTurns(prev, text, role, force, isComplete, clientMessageId));
    });
  }, [swarmCtx]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [turns]);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden select-none">
      <header className="permanent-crown-zone z-30 flex-none bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <SymbolCrown />
      </header>
      <main data-testid="turn-sphere-main" ref={scrollRef} className="flex-1 relative overflow-y-auto p-4 flex flex-col gap-3">
        {turns.length === 0 ? (
        <div data-testid="empty-turn-placeholder" className="flex-1 flex items-center justify-center text-slate-500 font-mono text-xs">Inga aktiva turer än. Tala eller skriv för att starta.</div>
        ) : (
        turns.map((t) => <TurnContainer key={t.id} turn={t} />)
        )}
      </main>
      <footer className="z-30 flex-none p-2 bg-slate-950/90 border-t border-slate-800/80 flex items-center justify-center">
        <UnifiedPromptBar />
      </footer>
    </div>
  );
};
