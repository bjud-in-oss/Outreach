# 2a Avgränsa: Konsolidering till 4 Försoningsenheter & UI-renodling (TCK-009)

## 1. Avgränsningsmatris

| Område | Ingår i TCK-009 | Ingår INTE (Avgränsat) | Motivering |
| :--- | :--- | :--- | :--- |
| **Domän** | `src/features/gemini_live_swarm/` | Övriga domäner (`google_drive_sync`, `mcp_bridge`, `wal_logger`) | 1 ticket = 1 domän enligt AGENTS.md |
| **Enheter** | Exakt 4 försoningsenheter (`ATT_FOLJA`, `ATT_VANDA_OM`, `ATT_FORLIKAS`, `SERIELL_MOTOR`) | Fler än 4 enheter eller kvarvarande legacy-roller | Minska från 5 till 4 enheter enligt PROMPT.md |
| **UI-visningsnamn** | Exakt: "Att följa Guds son", "Att vända om till Gud", "Att förlikas med Gud", "Att försonas (ensam agent)" | Andra generiska titlar eller råa prompttexter i UI | Strikt pedagogisk och teologisk renodling i UI |
| **Intern Invariant** | Ordagrann bevarande av `SEMANTIC_INVARIANT` i källkoden som intern prompt | Modifiering eller förkortning av texten | Det semantiska ankaret är oföränderligt |
| **Fas-spärr** | Fas 1: Fullständig specifikation under `doc/LAST_CYCLE/` | Ändringar under `src/` före godkännandetoken | Strikt respekt för Token Gate (Steg 3c) |

## 2. Arkitektonisk Avgränsning
- Samtliga gamla roller (`ORCHESTRATOR`, `RESEARCHER`, `OUTREACH_WRITER`, `CRITIC`) avlägsnas ur de primära typerna.
- Gränssnittet i `SwarmDashboard.tsx` och `TelemetrySidebar.tsx` minskas deterministiskt från 5 till 4 enheter.
