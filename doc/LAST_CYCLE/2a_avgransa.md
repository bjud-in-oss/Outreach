# Steg 2a: Avgränsa & Systemkontrakt (TCK-016)

## 1. Vad som SKA göras i TCK-016
- Radera samtliga föråldrade UI-komponenter:
  - `src/features/gemini_live_swarm/ui/SwarmDashboard.tsx`
  - `src/features/gemini_live_swarm/ui/TelemetrySidebar.tsx`
  - `src/features/gemini_live_swarm/ui/MasterDevelopmentPlan.tsx`
  - `src/features/gemini_live_swarm/ui/components/SwarmControlPanel.tsx`
  - `src/features/gemini_live_swarm/ui/components/SwarmUnitCard.tsx`
  - `src/features/gemini_live_swarm/ui/components/SwarmStreamLog.tsx`
  - `src/features/google_drive_sync/ui/DriveSyncPanel.tsx`
- Rensa `App.tsx` så att den blir ett minimalt rot-skal under 30 rader som tillhandahåller `SwarmProvider` och en ren canvas-visningsyta.
- Rensa re-exports i `src/features/gemini_live_swarm/index.ts` och `src/features/google_drive_sync/index.ts`.
- Registrera framtida tickets (TCK-017, TCK-018) i `doc/TICKETS.md` (redan utfört under Steg 1).
- Skapa och konsolidera `src/__tests__/transient_TCK-016.test.ts`.

## 2. Vad som INTE ska göras i TCK-016 (Avgränsningar)
- Implementera INTE Symbol-Kronan (detta tillhör TCK-017).
- Implementera INTE Split-Pane-kanvas eller dragbar layout (detta tillhör TCK-017).
- Implementera INTE User Activity Lock eller handlingschips (detta tillhör TCK-018).
- Rör INTE icke-UI kärnmoduler: `swarmEventBus.ts`, `geminiLiveSession.ts`, `swarmOrchestrator.ts`, `roleDefinitions.ts`, `driveClient.ts`, `walEngine.ts`, `mcpServer.ts`.

## 3. Framtida Beroenden
- TCK-017 bygger den nya symbol-kronan och den dragbara horisontella split-baren ovanpå det rena rot-skalet som TCK-016 lämnar efter sig.
