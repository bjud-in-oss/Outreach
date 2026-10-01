# Steg 2b: Modellera & Arkitekturdesign (TCK-016)

## 1. Ny Modell för `src/App.tsx`
```tsx
import React from 'react';
import { SwarmProvider } from './features/gemini_live_swarm/index.ts';

export default function App() {
  return (
    <SwarmProvider>
      <main className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden select-none">
        {/* Ren grundvisningsyta redo för TCK-017 Symbol-Krona & Split-Pane */}
      </main>
    </SwarmProvider>
  );
}
```
Detta uppfyller kravet: < 30 rader, inga monolitkomponenter, inga tillfälliga manuella testknappar, 100% bakgrundsöverlevnad via `SwarmProvider`.

## 2. Re-Export Modell (`src/features/gemini_live_swarm/index.ts`)
```tsx
export * from './agents/roleDefinitions.ts';
export * from './coordinator/swarmOrchestrator.ts';
export * from './bus/swarmEventBus.ts';
export * from './session/geminiLiveSession.ts';
export * from './telemetry/telemetrySchema.ts';
export * from './context/SwarmContext.tsx';
```
Samtliga gamla UI-komponenter rensas från index.

## 3. Transient Testmodell (`transient_TCK-016.test.ts`)
1. **Test 1: Ren Renderelektion**:
   - Montera eller simulera rendering av `App.tsx` och validera att inga fel kastas och att `SwarmProvider` ingår i JSX-strukturen.
2. **Test 2: Bakgrundsöverlevnad**:
   - Verifiera att `SwarmEventBus` kan ta emot och distribuera händelser oberoende av UI-noder.
   - Verifiera att `SwarmContext` levererar `eventBus`, `liveSession`, `driveClient` och `orchestrator`.
3. **Test 3: Import-Integritet**:
   - Scanna `src/App.tsx` och `src/features/` via regex/AST och verifiera att inga importer matchar de raderade filnamnen (`SwarmDashboard`, `TelemetrySidebar`, `MasterDevelopmentPlan`, `SwarmControlPanel`, `SwarmUnitCard`, `SwarmStreamLog`, `DriveSyncPanel`).
