# 3c Fil-operativ Källkodsspecifikation (TCK-005)

## 1. Översikt över Förändringskedjan (Fas 2)

Följande filer är specificerade för skapande/modifiering i Fas 2 så snart godkännandetoken bekräftats:

---

### Fil 1: `doc/DECISIONS.md` (MODIFIERING)
- **Syfte**: Konsolidera centrala principer med:
  - `ADR-004: Decentraliserad Domänarkitektur och Lokal ADR-struktur`
  - `ADR-005: Tvåfasig Exekvering och Token Gate Säkerhetsspärr`

---

### Fil 2: `src/features/gemini_live_swarm/doc/DECISIONS.md` (NY FIL)
- **Innehåll**:
  - `ADR-SWARM-001`: 4-Agent Svärmarkitektur med Rollseparation
  - `ADR-SWARM-002`: SwarmEventBus och 150-elementers FIFO-ringbuffert
  - `ADR-SWARM-003`: Icke-blockerande WebSocket-svarsflöde (NON_BLOCKING)

---

### Fil 3: `src/features/google_drive_sync/doc/DECISIONS.md` (NY FIL)
- **Innehåll**:
  - `ADR-DRIVE-001`: In-Memory Token & Explicit Workspace Hierarchy
  - `ADR-DRIVE-002`: Zod-validerat Manifest (`WORKSPACE_MANIFEST.json`)

---

### Fil 4: `src/features/mcp_bridge/doc/DECISIONS.md` (NY FIL)
- **Innehåll**:
  - `ADR-MCP-001`: Strikt JSON-RPC 2.0 Protokollvalidering
  - `ADR-MCP-002`: Modulärt Registreringsmönster för Verktygshandlers

---

### Fil 5: `src/features/wal_logger/doc/DECISIONS.md` (NY FIL)
- **Innehåll**:
  - `ADR-WAL-001`: Append-Only SHA-256 Verifierad Händelselogg
  - `ADR-WAL-002`: Tvåfasig Commit-cykel (PENDING -> COMMITTED)

---

### Fil 6: `src/__tests__/transient_TCK-005.test.ts` (NY TESTFIL)
- **Innehåll**: E2E-verifiering av att samtliga ADR-dokument finns, är strukturerade enligt specifikation och kan läsas utan I/O-fel (< 3s i minnet).

---

### Fil 7: `doc/TICKETS/TCK-005.md` & `doc/TICKETS.md` (UPPDATERING I FAS 2)
- **Innehåll**: Markera TCK-005 som verifierad och arkivera ärendet.
