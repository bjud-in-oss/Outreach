# 2a Avgränsa: UI & Dashboard-övervakning av Seriell Motor (TCK-007)

## 1. Avgränsningsmatris

| Område | Ingår i TCK-007 | Ingår INTE (Avgränsat) | Motivering |
| :--- | :--- | :--- | :--- |
| **Domän** | `src/features/gemini_live_swarm/ui/` | Övriga domäner (`drive`, `mcp`, `wal`) | 1 ticket = 1 domän enligt AGENTS.md |
| **Komponenter** | `SwarmDashboard.tsx`, `TelemetrySidebar.tsx`, `MasterDevelopmentPlan.tsx` | Nya rader i databasen, externa REST-anrop | Enbart reaktiv visualisering och styrkort |
| **Kontrakt** | Återanvänder befintliga Zod-scheman från TCK-006 | Ändringar i `telemetrySchema.ts` eller `envelope.ts` | Kontrakten är redan fastställda och låsta |
| **Fas-spärr** | Fas 1: Fullständig specifikation under `doc/LAST_CYCLE/` | Ändringar under `src/` före godkännandetoken | Strikt respekt för Token Gate (Steg 3c) |

## 2. Arkitektonisk Avgränsning
- UI-komponenterna ska inte innehålla hårdkodad fördröjning eller artificiell state-mutation; de ska uteslutande läsa från `useSwarmTelemetry` och `SwarmEventBus`.
- När ingen seriell pipeline exekveras visas standardläge med förklaring av de 4 krafterna och motorns kapacitet.
