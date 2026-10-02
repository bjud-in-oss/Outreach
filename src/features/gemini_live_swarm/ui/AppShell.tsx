import React from 'react';
import { SymbolCrown } from './SymbolCrown.tsx';
import { SplitPaneCanvas } from './SplitPaneCanvas.tsx';

export const AppShell: React.FC = () => {
  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* Permanent SymbolCrown i toppzonen */}
      <header className="z-30 flex-none bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <SymbolCrown />
      </header>

      {/* Huvudvy med 3-stegs SplitPane */}
      <main className="flex-1 relative overflow-hidden">
        <SplitPaneCanvas />
      </main>
    </div>
  );
};