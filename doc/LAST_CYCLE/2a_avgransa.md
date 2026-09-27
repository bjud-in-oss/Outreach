# 2a Avgränsa: Djup Refaktorering av Försoningskrafterna (Kodstruktur & UI-separation) (TCK-009)

## 1. Avgränsningsmatris

| Område | Ingår i TCK-009 | Ingår INTE (Avgränsat) | Motivering |
| :--- | :--- | :--- | :--- |
| **Domän** | `src/features/gemini_live_swarm/` | Övriga domäner (`google_drive_sync`, `mcp_bridge`, `wal_logger`) | 1 ticket = 1 domän enligt AGENTS.md |
| **Domänmodell** | Ersättning av legacy-nycklar (`ORCHESTRATOR`, etc.) med `ATT_FOLJA`, `ATT_VANDA_OM`, `ATT_FORLIKAS`, `SERIELL_MOTOR` | Ändringar av externa protokoll (`envelope.ts`) | CloudEvents envelope bibehålls som gemensam transport |
| **UI-separation** | Separera interna prompttexter från UI; exponera ren pedagogisk användarnytta | Omskrivning av grundläggande designsystem eller CSS-konfig | Tailwind CSS och UI-komponentstruktur bibehålls |
| **Internt Ankare** | Ordagrann bevarande av `SEMANTIC_INVARIANT` i källkoden som agentens interna prompt | Borttagning eller förändring av invariantens ordalydelse | Det semantiska ankaret är oföränderligt och absolut |
| **Fas-spärr** | Fas 1: Fullständig specifikation under `doc/LAST_CYCLE/` | Ändringar under `src/` före godkännandetoken | Strikt respekt för Token Gate (Steg 3c) |

## 2. Arkitektonisk Avgränsning
- Källkodsändringar under Fas 2 begränsas strikt till `src/features/gemini_live_swarm/` och tillhörande tester under `src/__tests__/`.
- Bakåtkompatibilitet garanteras genom deterministisk mappning om gamla händelser mot förmodan påträffas i bufferten, men den aktiva domänmodellen kastar helt av sig arvet från de gamla rollerna.
