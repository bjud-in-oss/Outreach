# 2a Avgränsa: Åtgärda React Render-State Krock & Röstspår Telemetrisynk (TCK-014)

## 1. Avgränsningsmatris

| Område | Ingår i TCK-014 | Ingår INTE (Avgränsat) | Motivering |
| :--- | :--- | :--- | :--- |
| **Domän** | `src/features/gemini_live_swarm/` | Övriga moduler (`mcp_bridge`, `wal_logger`, `google_drive_sync`) | Felet är isolerat till gränssnittet och telemetrisynkroniseringen i `gemini_live_swarm`. |
| **Render-State Hantering** | Åtgärdande av setState inuti updaters i `useSwarmTelemetry.ts` och prop-stöd i `TelemetrySidebar.tsx` | Fullständig omskrivning av state management till Redux/Zustand | Enkelt och deterministiskt enkelriktat dataflöde löser problemet utan nya tunga beroenden. |
| **Röstspårsaktivering** | Ren asynkron telemetrisynk via `SwarmEventBus` vid klick på röstspår | Förändringar i röstmodellens backend-protokoll | Problemet är rent frontend-arkitektoniskt i React-komponenternas livscykel. |
| **Kompatibilitet** | Bakåtkompatibel `TelemetrySidebar` som kan köras både med och utan injicerad `snapshot` | Tvingande ändringar som bryter äldre testfall | Säkerställer att alla regressionssviter förblir gröna. |
| **Token Gate** | Stopp vid Steg 3c under Fas 1 tills godkännandekod ges | Ändringar i `src/` under Fas 1 | Absolut skydd av källkoden. |
