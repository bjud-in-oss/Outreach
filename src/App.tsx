import React from 'react';
import { SwarmProvider } from './features/gemini_live_swarm/index.ts';

export default function App() {
  return (
    <SwarmProvider>
      <main className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden select-none">
        {/* Ren grundvisningsyta förberedd för TCK-017 Symbol-Krona & Split-Pane */}
      </main>
    </SwarmProvider>
  );
}
