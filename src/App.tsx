import React from 'react';
import { SwarmProvider } from './features/gemini_live_swarm/index.ts';
import { AppShell } from './features/gemini_live_swarm/ui/AppShell.tsx';
import { RenderA2UI } from './features/a2ui/index.ts';

export default function App() {
  return (
    <SwarmProvider>
      <AppShell />
      <RenderA2UI />
    </SwarmProvider>
  );
}
