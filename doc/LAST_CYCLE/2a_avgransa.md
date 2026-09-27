# 2a Avgränsa: Förankring av Mognadsmodellen & Försoningskrafterna i Källkod och UI (TCK-008)

## 1. Avgränsningsmatris

| Område | Ingår i TCK-008 | Ingår INTE (Avgränsat) | Motivering |
| :--- | :--- | :--- | :--- |
| **Domän** | `src/features/gemini_live_swarm/` | Övriga domäner (`drive`, `mcp`, `wal`) | 1 ticket = 1 domän enligt AGENTS.md |
| **Semantiskt Ankare** | Ordagrann förankring i dokumentation, kod och UI | Ändringar av tekniska krav i SI v10.0 eller verify-architecture | Texten är en oföränderlig semantisk invariant |
| **Källkodsfiler** | `roleDefinitions.ts`, `SwarmDashboard.tsx`, `TelemetrySidebar.tsx`, `MasterDevelopmentPlan.tsx` | Ändringar i `envelope.ts` eller externa protokoll | Inga ändringar av nätverksprotokoll krävs |
| **Fas-spärr** | Fas 1: Fullständig specifikation under `doc/LAST_CYCLE/` | Ändringar under `src/` före godkännandetoken | Strikt respekt för Token Gate (Steg 3c) |

## 2. Arkitektonisk Avgränsning
- Agentkrafterna ska behålla bakåtkompatibilitet med befintliga gränssnitt och tester (`mapRoleToForce`, `mapForceToRole`).
- Försoningsprinciperna berikar agenternas identitet, instruktioner och visning utan att bryta eventbussens kontrakt eller serialiseringslogik.
