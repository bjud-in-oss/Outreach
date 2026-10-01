import React, { useState, useEffect, useRef } from 'react';
import {
  SwarmProvider,
  SymbolCrown,
  SplitPaneCanvas,
  TouchOverlayMenu,
  useUserActivityLock,
} from './features/gemini_live_swarm/index.ts';

export default function App() {
  const [isImmersive, setIsImmersive] = useState<boolean>(false);
  const [overlayVisible, setOverlayVisible] = useState<boolean>(true);
  const [splitRatio, setSplitRatio] = useState<number>(50);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useUserActivityLock(5000);

  const resetOverlayTimer = () => {
    setOverlayVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setOverlayVisible(false);
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  const crownDisplay = isImmersive && !overlayVisible ? 'hidden' : 'block';

  return (
    <SwarmProvider>
      <main onPointerDown={resetOverlayTimer} className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden select-none relative">
        <div className={crownDisplay}><SymbolCrown /></div>
        <SplitPaneCanvas initialSplitRatio={splitRatio} onSplitChange={setSplitRatio} isImmersive={isImmersive} />
        <TouchOverlayMenu isVisible={overlayVisible} isImmersive={isImmersive} onToggleImmersive={() => setIsImmersive(!isImmersive)} onTriggerConsult={() => setSplitRatio(0)} />
      </main>
    </SwarmProvider>
  );
}
