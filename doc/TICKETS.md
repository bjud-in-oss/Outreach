# TICKETS & LEVERANSPLAN

## AKTIV TICKET
### [AKTIV] TCK-002: SWARM TELEMETRY & REACTIVE STATUS (FAS 1: PLANERING)
- **Status**: FAS 1 PLANERING (Inväntar godkännande vid Steg 3c)
- **Mål & Omfång**:
  - Transformera mönster från referensen https://github.com/bjud-in-oss/Acoustic-Priming-backup:
    - `TelemetrySidebar`: Real-time insyn i svärmens tillstånd, agentpuls och händelselogg.
    - `MasterDevelopmentPlan`: Reaktivt styrkort för systemtickets och leveransfaser knutet till `doc/TICKETS.md`.
    - Händelsestyrd `SwarmEventBus`: Typsäker pub/sub-motor baserad på `EventEnvelope` (`CloudEvents 1.0`).
  - Etablera isolerade TDD-tester under `src/__tests__/swarm_telemetry.test.ts`.
- **Kommande Källkodsändringar (Fas 2)**:
  - `src/features/gemini_live_swarm/bus/swarmEventBus.ts`
  - `src/features/gemini_live_swarm/telemetry/telemetrySchema.ts`
  - `src/features/gemini_live_swarm/telemetry/useSwarmTelemetry.ts`
  - `src/features/gemini_live_swarm/ui/TelemetrySidebar.tsx`
  - `src/features/gemini_live_swarm/ui/MasterDevelopmentPlan.tsx`
  - `src/features/gemini_live_swarm/ui/SwarmDashboard.tsx`
  - `src/features/gemini_live_swarm/index.ts`
  - `src/__tests__/swarm_telemetry.test.ts`
  - `scripts/run-tests.js`

---

## SLUTFÖRDA TICKETS
### [VERIFIERAD] TCK-001: INITIALISERA OUTREACH SAMORDNINGSMOTOR
- **Status**: SLUTFÖRD & VERIFIERAD (Kvittohash: `980bc67d`)
- **Levererat**:
  - Grundläggande FSD-moduler: `google_drive_sync`, `wal_logger`, `mcp_bridge`, `gemini_live_swarm`.
  - Isolerade TDD-enhetstester (15/15 godkända).
  - Scripts: `scripts/init-drive-workspace.js`, `scripts/run-tests.js`.
  - README.md med filosofiskt personligt brev och systemarkitektur.
  - Samordningsmotorns operatörspanel i `src/App.tsx`.

---

## KOMMANDE TICKETS
### [VÄNTAR] TCK-003: MCP BRIDGE & GEMINI LIVE SWARM DJUPINTEGRATION
- **Fokus**: Exekvera avancerade verktygsanrop via MCP och live WebSocket-baserad orkestrering.
- **Artefakter**: Externa agentintegrationer, token-ekonomi och automatiserade Drive-leveranser.
