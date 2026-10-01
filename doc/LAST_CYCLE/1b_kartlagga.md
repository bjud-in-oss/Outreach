# Steg 1b: Kartlägga & Komponentinventering (TCK-016)

## 1. Inventering av Filer att Radera
Följande monolitiska och föråldrade UI-komponenter ska avlägsnas i Fas 2:
1. `src/features/gemini_live_swarm/ui/SwarmDashboard.tsx` (Monolitiskt dashboard)
2. `src/features/gemini_live_swarm/ui/TelemetrySidebar.tsx` (Föråldrad telemetrisidopanel)
3. `src/features/gemini_live_swarm/ui/MasterDevelopmentPlan.tsx` (Monolitisk roadmap-vy)
4. `src/features/gemini_live_swarm/ui/components/SwarmControlPanel.tsx` (Manuella testknappar)
5. `src/features/gemini_live_swarm/ui/components/SwarmUnitCard.tsx` (Gamla agentkort)
6. `src/features/gemini_live_swarm/ui/components/SwarmStreamLog.tsx` (Gammal logg-panel)
7. `src/features/google_drive_sync/ui/DriveSyncPanel.tsx` (Föråldrad synk-panel)

## 2. Inventering av Filer att Refaktorera
1. `src/App.tsx`:
   - Nuvarande: 447 rader, full av manuella flikar ('swarm', 'drive', 'wal', 'mcp', 'letter'), hårdkodade WAL-loggar, mock-händelseknappar.
   - Nytt skick: < 30 rader rot-komponent som returnerar `<SwarmProvider><main className="h-screen w-screen bg-slate-950 text-white overflow-hidden" /></SwarmProvider>`.
2. `src/features/gemini_live_swarm/index.ts`:
   - Rensa re-exports av borttagna komponenter (`SwarmDashboard`, `SwarmHeader`, etc.).
   - Behåll kärnexporter: `SwarmProvider`, `useSwarmContext`, `SwarmEventBus`, `GeminiLiveSession`, `SwarmOrchestrator`, `roleDefinitions`.
3. `src/features/google_drive_sync/index.ts`:
   - Rensa re-export av `DriveSyncPanel`. Behåll `GoogleDriveClient`, `useDriveStore`.
4. `scripts/verify-architecture.js`:
   - Uppdatera `astCheckTargets` så att raderade komponenter inte ingår som obligatoriska filer.
5. Historiska transienta tester:
   - Granska `transient_TCK-007.test.ts`, `transient_TCK-008.test.ts`, `transient_TCK-012.test.ts` så att de inte fallerar på grund av frånvaro av raderade monolitfiler.

## 3. Nya Moduler och Tester
1. `src/__tests__/transient_TCK-016.test.ts`:
   - Test 1: Ren rendering av `App.tsx` utan beroenden till raderade filer.
   - Test 2: Bakgrundsöverlevnad för `SwarmProvider` & `SwarmEventBus`.
   - Test 3: Import-integritet och total avsaknad av monolitiska UI-importer.
2. Uppdatering av `scripts/run-tests.js` och `src/__tests__/suite/e2e_regression.test.ts`.
