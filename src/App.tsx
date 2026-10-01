import React from 'react';
import { SwarmProvider, SymbolCrown, SplitPaneCanvas } from './features/gemini_live_swarm/index.ts';

export default function App() {
  return (
    <SwarmProvider>
      <main className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden select-none">
        <SymbolCrown />
        <SplitPaneCanvas />
      </main>
    </SwarmProvider>
  );
}
