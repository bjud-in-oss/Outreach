# 2a Avgränsa: MCP Bridge & Gemini Live Swarm djupintegration (TCK-003)

## 1. Avgränsningsmatris

| Område | Ingår i TCK-003 | Ingår INTE (Avgränsat) | Motivering |
| :--- | :--- | :--- | :--- |
| **Domän** | `src/features/mcp_bridge/` (med integration mot `gemini_live_swarm`) | Ändringar i Google Drive API-klientens nätverksarkitektur | Klientens existerande multipart-stöd är komplett |
| **MCP-verktyg** | Drive-verktyg, WAL-verktyg och kvalitetsbedömning i en enhetlig server | Externa 3:e-parts MCP servrar över STDIO | Browser/Vite-miljön kör in-memory JSON-RPC 2.0 |
| **WebSocket Protokoll** | Klientorkestratör med `BidiGenerateContentToolResponse` och `behavior: 'NON_BLOCKING'` | Etablering av skarp live-WebSocket mot Google servrar utan API-nyckel | Skarpa anrop sker deterministiskt eller via live-test vid tillgång till nyckel |
| **Försoningsenheter** | 4 enheternas möjlighet att använda verktyg | Ändringar av försoningskrafternas namn eller teologiska invariant | Invarianten och de 4 enheterna är fixerade i TCK-009 |
| **Fas-spärr** | Fas 1: Fullständig specifikation under `doc/LAST_CYCLE/` | Ändringar under `src/` före godkännandetoken | Strikt respekt för Token Gate (Steg 3c) |

## 2. Arkitektonisk Avgränsning
- `mcp_bridge` agerar nav för verktygsexekvering och omvandlar MCP JSON-RPC 2.0-anrop till Gemini Live API-kompatibla verktygssvar.
- Inga moduler utanför `mcp_bridge` och dess integrationspunkt i `gemini_live_swarm` berörs.
