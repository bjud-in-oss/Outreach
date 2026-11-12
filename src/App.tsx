import React, { useEffect } from 'react';
import { SwarmProvider, useSwarmContext } from './features/gemini_live_swarm/index.ts';
import { AppShell } from './features/gemini_live_swarm/ui/AppShell.tsx';
import { A2UIContainer } from './features/a2ui/index.ts';

function AppContent() {
  const { eventBus } = useSwarmContext();

  useEffect(() => {
    (window as any).__SWARM_BUS__ = eventBus;
  }, [eventBus]);

  return (
    <>
      <AppShell />
      <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4 pointer-events-none">
        <div className="pointer-events-auto">
          <A2UIContainer bus={eventBus} />
        </div>
      </div>
    </>
  );
}

export default function App() {
  return (
    <SwarmProvider>
      <AppContent />
    </SwarmProvider>
  );
}
