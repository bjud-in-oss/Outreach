import React from 'react';
import { SwarmProvider } from './features/gemini_live_swarm/index.ts';
import { AppShell } from './features/gemini_live_swarm/ui/AppShell.tsx';

export default function App() {
  return (
    <SwarmProvider>
      <AppShell />
    </SwarmProvider>
  );
}
