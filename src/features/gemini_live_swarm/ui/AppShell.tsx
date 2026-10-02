import React, { useState } from 'react';
import {
  SymbolCrown,
  SplitPaneCanvas,
  TouchOverlayMenu,
  useUserActivityLock,
  useImmersiveMode,
} from '../index.ts';

export const AppShell: React.FC = () => {
  const [splitRatio, setSplitRatio] = useState<number>(50);
  const { isImmersive, overlayVisible, resetOverlayTimer, toggleImmersive } = useImmersiveMode();
  useUserActivityLock(5000);
  const crownDisplay = isImmersive && !overlayVisible ? 'hidden' : 'block';

  return (
<main onPointerDown={resetOverlayTimer} className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden select-none relative">
  <div className={crownDisplay}><SymbolCrown /></div>
  <SplitPaneCanvas initialSplitRatio={splitRatio} onSplitChange={setSplitRatio} isImmersive={isImmersive} />
  <TouchOverlayMenu isVisible={overlayVisible} isImmersive={isImmersive} onToggleImmersive={toggleImmersive} onTriggerConsult={() => setSplitRatio(0)} />
</main>
  );
};
