import React, { useState } from 'react';
import {
  SymbolCrown,
  SplitPaneCanvas,
  TouchOverlayMenu,
  useUserActivityLock,
  useImmersiveMode,
  useOptionalSwarmContext,
  SwarmIntent,
} from '../index.ts';

export const AppShell: React.FC = () => {
  const [splitRatio, setSplitRatio] = useState<number>(50);
  const [activeIntent, setActiveIntent] = useState<SwarmIntent | null>(null);
  const { isImmersive, overlayVisible, resetOverlayTimer, toggleImmersive } = useImmersiveMode();
  const swarm = useOptionalSwarmContext();
  useUserActivityLock(5000);

  const handleIntent = (intent: SwarmIntent) => {
    if (activeIntent === intent) {
      setActiveIntent(null);
      if (swarm) swarm.liveSession.deactivateIntent();
      return;
    }
    setActiveIntent(intent);
    if (swarm) swarm.liveSession.activateIntent(intent);
  };

  const handleToggleImmersive = () => {
    if (isImmersive) {
      setSplitRatio(50);
    }
    toggleImmersive();
  };

  return (
<main onPointerDown={resetOverlayTimer} className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden select-none relative">
  <header data-testid="permanent-crown-zone" className="w-full shrink-0 z-40 bg-slate-950/95 border-b border-slate-800/80">
    <SymbolCrown />
  </header>
  <SplitPaneCanvas initialSplitRatio={splitRatio} onSplitChange={setSplitRatio} isImmersive={isImmersive} activeIntent={activeIntent} onIntentSelect={handleIntent} />
  <TouchOverlayMenu isVisible={overlayVisible} isImmersive={isImmersive} onToggleImmersive={handleToggleImmersive} onTriggerReflect={() => handleIntent('REFLECT')} onTriggerRemember={() => handleIntent('REMEMBER')} onTriggerConsult={() => handleIntent('CONSULT')} />
</main>
  );
};
