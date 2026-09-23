# 1b Kartlägga: Systemarkitektur, Flöden och Beroenden

## 1. Topologi och Skivningskarta (Feature-Sliced Design)
Systemet organiseras strikt enligt FSD med tydliga ansvarslager:

```
src/
├── app/                  # Applikationsskal, providers och global konfiguration
├── features/             # Funktionsmoduler (implementeras i Fas 2)
│   ├── google_drive_sync/
│   │   ├── api/          # Drive API v3 klient, multipart streaming, folder resolver
│   │   ├── model/        # Drive synkstatus, folder tree cache
│   │   └── ui/           # Drive-koppling och statusindikatorer
│   ├── wal_logger/
│   │   ├── engine/       # Append-only loggmotor, segmentering, CRC-koll
│   │   ├── replay/       # Crash recovery & state replay
│   │   └── contracts/    # WAL entry Zod-kontrakt
│   ├── mcp_bridge/
│   │   ├── server/       # JSON-RPC 2.0 hanterare och verktygsregister
│   │   ├── client/       # MCP klientadapter
│   │   └── tools/        # Exponerade verktyg (Drive, WAL, Swarm)
│   └── gemini_live_swarm/
│       ├── coordinator/  # Svärmorkestrator, meddelandefördelning
│       ├── agents/       # Agentroller (Researcher, OutreachWriter, Evaluator)
│       └── session/      # Gemini Live kontext- och sessionshanterare
└── shared/
    ├── contracts/        # Delade Zod-kontrakt (EventEnvelopeSchema)
    └── lib/              # Gemensamma hjälpfunktioner, tidsstämplar, hashning
```

## 2. Kommunikationsflöde och Händelsedrivet Kretslopp
1. **Initiering**: Användaren ansluter med Google Workspace OAuth.
2. **Workspace Init**: `scripts/init-drive-workspace.js` eller motsvarande in-app modul skapar mappstrukturen `/Outreach_Workspace/` (`Campaigns/`, `Templates/`, `Logs/`, `Artifacts/`).
3. **Event Envelope Generering**: Alla händelser (Drive-skrivningar, agent-interaktioner, MCP-anrop) paketeras som ett `EventEnvelope`.
4. **WAL-spårning**: Varje händelse skrivs först till Write-Ahead Loggen innan asynkrona sidoeffekter tillåts mutera externa resurser.
5. **Swarm Exekvering**: Gemini Live Swarm bearbetar kampanjuppdrag, anropar verktyg via MCP Bridge och synkar utkast/resultat direkt till Google Drive.

```json
{
  "status": "PLANNING_COMPLETED",
  "current_domain": "outreach_coordination_engine",
  "next_step": "TOKEN_GATE_APPROVAL",
  "ticket_id": "TCK-001",
  "active_skill": "workspace-integration",
  "active_vectors": [
    "google_drive_sync",
    "wal_logger",
    "mcp_bridge",
    "gemini_live_swarm"
  ]
}
```
