import React, { useState, useEffect } from 'react';
import {
  SymbolCrown,
  SplitPaneCanvas,
  useOptionalSwarmContext,
  SwarmIntent,
  SplitOrientation,
} from '../index.ts';

export const AppShell: React.FC = () => {
  const [splitRatio, setSplitRatio] = useState<number>(50);
  const [activeIntent, setActiveIntent] = useState<SwarmIntent | null>(null);
  const [orientation, setOrientation] = useState<SplitOrientation>('portrait');
  const swarm = useOptionalSwarmContext();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(orientation: landscape)');
    const update = () => setOrientation(mql.matches ? 'landscape' : 'portrait');
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, []);

  const handleIntent = (intent: SwarmIntent) => {
    if (activeIntent === intent) {
      setActiveIntent(null);
      if (swarm) swarm.liveSession.deactivateIntent();
      return;
    }
    setActiveIntent(intent);
    if (swarm) swarm.liveSession.activateIntent(intent);
  };

  return (
<main className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden select-none relative">
  <header data-testid="permanent-crown-zone" className="w-full shrink-0 z-40 bg-slate-950/95 border-b border-slate-800/80">
    <SymbolCrown />
  </header>
  <SplitPaneCanvas
    initialSplitRatio={splitRatio}
    onSplitChange={setSplitRatio}
    activeIntent={activeIntent}
    onIntentSelect={handleIntent}
    orientation={orientation}
  />
</main>
  );
};
