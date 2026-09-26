# TICKETS & LEVERANSPLAN

## AKTIV TICKET
### [AKTIV] TCK-003: STÄDNING & SI v10.0 ARKITEKTURANPASSNING (FAS 2: VERKSTÄLLD & VERIFIERAD)
- **Status**: SLUTFÖRD & VERIFIERAD (Godkänd via OUTREACH-SI10-TCK003-TOKEN)
- **Fokus**: Enhetlig kodstandard, Wayfinder-installation, SI v10.0 Agentkrafter och 4:e Seriell Motor.
- **Levererat**:
  - Wayfinder-installation under `.agents/skills/wayfinder/SKILL.md`.
  - Uppdaterad `README.md` med pnpm-stöd, wayfinder-kommando och förklaring av `/wayfinder` mot `doc/TICKETS.md`.
  - Standardisering av lokala domänbeslut under `src/features/[modul]/doc/DECISIONS.md` samt ADR-004 i `doc/DECISIONS.md`.
  - SI v10.0 Agentkrafter (`ATT_FORLIKAS`, `ATT_FOLJA`, `ATT_VANDA_OM`) och 4:e `SERIELL_MOTOR` i `roleDefinitions.ts`, `telemetrySchema.ts` och `swarmEventBus.ts`.
  - UI-synkronisering i `SwarmDashboard.tsx`, `TelemetrySidebar.tsx` och `MasterDevelopmentPlan.tsx` med realtidsövervakning och interaktiv jämförelsepanel.
  - Transient Mikro-E2E testsvit i `src/__tests__/transient_TCK-003.test.ts` (1.7s, <3s).

---

## PLANERAD NÄSTA TICKET
### [PLANERAD] TCK-004: MCP BRIDGE & GEMINI LIVE SWARM DJUPINTEGRATION
- **Status**: VÄNTAR PÅ INITIERING
- **Fokus**: Exekvera avancerade verktygsanrop via MCP och live WebSocket-baserad orkestrering.
- **Artefakter**: Externa agentintegrationer, token-ekonomi och automatiserade Drive-leveranser.

---

## SLUTFÖRDA TICKETS
### [VERIFIERAD] TCK-002: SWARM TELEMETRY & REACTIVE STATUS
- **Status**: SLUTFÖRD & VERIFIERAD (Godkänd via SWARM-TELEMETRY-TCK002-TOKEN)
- **Levererat**:
  - Reaktiv pub/sub-händelsebuss (`SwarmEventBus`) med CloudEvents 1.0 validering.
  - Telemetri Zod-schema och modeller (`telemetrySchema.ts`).
  - `useSwarmTelemetry` hook för realtidsberäkning av genomströmning och agentpuls.
  - `TelemetrySidebar` med live mätare, agentstatus och händelseström.
  - `MasterDevelopmentPlan` reaktivt styrkort integrerat i `SwarmDashboard`.
  - Isolerade TDD-tester (`swarm_telemetry.test.ts`), 20/20 godkända.

### [VERIFIERAD] TCK-001: INITIALISERA OUTREACH SAMORDNINGSMOTOR
- **Status**: SLUTFÖRD & VERIFIERAD (Kvittohash: `980bc67d`)
- **Levererat**:
  - Grundläggande FSD-moduler: `google_drive_sync`, `wal_logger`, `mcp_bridge`, `gemini_live_swarm`.
  - Isolerade TDD-enhetstester (15/15 godkända).
  - Scripts: `scripts/init-drive-workspace.js`, `scripts/run-tests.js`.
  - README.md med filosofiskt personligt brev och systemarkitektur.
  - Samordningsmotorns operatörspanel i `src/App.tsx`.
