# 1b Kartlägga: Domänöversikt och Beslutsmatris (TCK-005)

## 1. Kartläggning av Moduler och Identifierade Beslut

### Modul 1: `src/features/gemini_live_swarm`
- **Domänansvar**: Realtidsorkestrering av multi-agent svärm baserad på Gemini Live API med samordnad problemlösning.
- **Identifierade lokala beslut**:
  - `ADR-SWARM-001: 4-Agent Svärmarkitektur med Rollseparation`: Arkitekt, Ingenjör, Granskare, Integratör.
  - `ADR-SWARM-002: In-Memory SwarmEventBus med Ringbuffert (150 händelser)`: Truncated FIFO för att förhindra minnesläckor vid långa live-sessioner.
  - `ADR-SWARM-003: Non-blocking verktygssvar över WebSocket-kabeln`: Automatiskt flöde med BidiGenerateContentToolResponse utan manuell bekräftelse mellan delsteg.

### Modul 2: `src/features/google_drive_sync`
- **Domänansvar**: Tvåvägssynkronisering av arbetsytan med Google Drive, hantering av metadata och hierarkiska mappar.
- **Identifierade lokala beslut**:
  - `ADR-DRIVE-001: In-Memory Token & Explicit Workspace Hierarchy`: Root-mapp `Outreach_Workspace` med deterministiska submappar (`raw_data`, `processed`, `campaigns`, `audit_logs`).
  - `ADR-DRIVE-002: Zod-validerat Manifest (`WORKSPACE_MANIFEST.json`)`: Deterministisk spårning av synkade fil-ID:n och hashes.

### Modul 3: `src/features/mcp_bridge`
- **Domänansvar**: Model Context Protocol (MCP) integrationsbrygga för externa agenter och standardiserad verktygsexekvering.
- **Identifierade lokala beslut**:
  - `ADR-MCP-001: Strikt JSON-RPC 2.0 Protokollvalidering`: Felkoder (-32600, -32601, -32602) enligt officiell JSON-RPC 2.0-specifikation.
  - `ADR-MCP-002: Registreringsmönster för Verktygshandlers`: Modulär registrering via `registerTool` med deklarativa Zod-kontrakt.

### Modul 4: `src/features/wal_logger`
- **Domänansvar**: Write-Ahead Logging (WAL) för händelseflöden, feltolerans och oföränderlig audit-spårning.
- **Identifierade lokala beslut**:
  - `ADR-WAL-001: Append-Only SHA-256 Verifierad Händelselogg`: Varje post beräknar SHA-256 hash över payload och sekvensnummer.
  - `ADR-WAL-002: Tvåfasig Commit-cykel (PENDING -> COMMITTED)`: Crash recovery återspelar enbart bekräftade transaktioner.

---

## 2. Planerad Mappstruktur i Fas 2
```
src/features/
├── gemini_live_swarm/doc/DECISIONS.md
├── google_drive_sync/doc/DECISIONS.md
├── mcp_bridge/doc/DECISIONS.md
└── wal_logger/doc/DECISIONS.md
```

```json
{
  "status": "PLANNING_FAS_1",
  "current_domain": "Global",
  "next_step": "2e_syntetisera",
  "ticket_id": "TCK-005",
  "active_skill": "wayfinder",
  "active_vectors": [
    "adr_standardization",
    "domain_documentation",
    "agentes_rule_3_compliance",
    "token_gate_protection"
  ]
}
```
