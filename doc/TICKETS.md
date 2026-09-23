# TICKETS & LEVERANSPLAN

## AKTIV TICKET
### [AKTIV] TCK-001: INITIALISERA OUTREACH SAMORDNINGSMOTOR (FAS 1: MASTER-SKAL & PLANERING 1a -> 3c)
- **Status**: PÅGÅENDE (Fas 1 - Steg 3c inväntar Token Gate)
- **Mål**:
  - Etablera master-skal, arkitekturkontroller och logistik.
  - Generera grundläggande verifieringsskript (`scripts/verify-architecture.js`, `scripts/drivers/ts.js`).
  - Upprätta CloudEvents-kompatibelt `EventEnvelopeSchema` i `src/shared/contracts/envelope.ts`.
  - Genomföra hela planeringskedjan (1a till 3c) för FSD-modulerna:
    - `google_drive_sync`
    - `mcp_bridge`
    - `wal_logger`
    - `gemini_live_swarm`
    - `scripts/init-drive-workspace.js`
    - `README.md` (med personligt brev)
- **Källkodskällor för migrering**:
  - Master-frö: https://github.com/bjud-in-oss/outreach-template
  - Skarp Drive-skrivning: https://github.com/bjud-in-oss/sandras-historia-2
  - DriveSync, WAL & Swarm: https://github.com/bjud-in-oss/Ouroboros-Agent
  - MCP Bridge: https://github.com/bjud-in-oss/agent-test
- **Infrastrukturkomponenter**:
  - `doc/TICKETS.md`
  - `doc/FEATURE_INDEX.json`
  - `scripts/verify-architecture.js`
  - `scripts/drivers/ts.js`
  - `src/shared/contracts/envelope.ts`

---

## KOMMANDE TICKETS
### [VÄNTAR] TCK-002: KÄRNIMPLEMENTERING AV DRIVE SYNC & WAL LOGGER
- **Fokus**: Exekvera källkod för `src/features/google_drive_sync` och `src/features/wal_logger`.
- **Artefakter**: `scripts/init-drive-workspace.js`, enhetstester och live-verifiering mot Google Drive.

### [VÄNTAR] TCK-003: MCP BRIDGE & GEMINI LIVE SWARM ORKESTRERING
- **Fokus**: Exekvera källkod för `src/features/mcp_bridge` och `src/features/gemini_live_swarm`.
- **Artefakter**: Fullständig dashboard, verktygsanrop via MCP och multi-agent svärmsamordning.
