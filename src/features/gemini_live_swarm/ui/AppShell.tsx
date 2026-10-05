import React, { useEffect, useState } from 'react';
import { SymbolCrown } from './SymbolCrown.tsx';
import { SplitPaneCanvas } from './SplitPaneCanvas.tsx';

export const AppShell: React.FC = () => {
  const [isPortrait, setIsPortrait] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(orientation: portrait)');
    setIsPortrait(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsPortrait(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden select-none">
      <header className="permanent-crown-zone z-30 flex-none bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <SymbolCrown />
      </header>
      <main className="flex-1 relative overflow-hidden">
        <SplitPaneCanvas />
      </main>
    </div>
  );
};
