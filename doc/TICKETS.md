# TICKETS & LEVERANSPLAN

## AKTIV TICKET
### [AKTIV] TCK-001: INITIALISERA OUTREACH SAMORDNINGSMOTOR (FAS 2: VERKSTÄLLANDE & TDD)
- **Status**: FAS 2 EXEKVERING (Godkänd via OUTREACH-COORD-TCK001-TOKEN)
- **Mål**:
  - Etablera isolerade TDD-tester under `src/__tests__/`.
  - Implementera FSD-modulerna:
    - `src/features/google_drive_sync`
    - `src/features/wal_logger`
    - `src/features/mcp_bridge`
    - `src/features/gemini_live_swarm`
  - Generera `scripts/init-drive-workspace.js`.
  - Generera `README.md` med personligt brev och fullständig systemdokumentation.
  - Skapa samordningsmotorns operatörspanel i `src/App.tsx`.
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
