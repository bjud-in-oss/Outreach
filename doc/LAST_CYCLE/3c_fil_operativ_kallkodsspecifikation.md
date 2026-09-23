# 3c Fil-operativ Källkodsspecifikation (TCK-002)

## 1. Översikt över Förändringskedjan
Följande filer är specificerade för exekvering i Fas 2 så snart godkännandetoken bekräftats:

---

### Fil 1: `src/features/gemini_live_swarm/bus/swarmEventBus.ts` (NY)
- **Syfte**: Deterministisk händelsebuss med pub/sub baserad på `EventEnvelope` (`CloudEvents 1.0`).
- **Funktioner**:
  - `publish(envelope: EventEnvelope): void` - Validerar mot Zod och sänder till matchande prenumeranter samt sparar i ringbuffert.
  - `subscribe(pattern: string, handler: SwarmEventHandler): () => void` - Registrerar lyssnare med wildcard-stöd (`*`, `swarm.*`, `agent.*`). Returnerar unmount cleanup-funktion.
  - `getHistory(filterPattern?: string): EventEnvelope[]` - Returnerar de senaste händelserna (max 150 st).
  - `clear(): void` - Tömmer historik och aktiva prenumeranter.
  - Global instans: `getGlobalSwarmEventBus()`.

---

### Fil 2: `src/features/gemini_live_swarm/telemetry/telemetrySchema.ts` (NY)
- **Syfte**: Zod-kontrakt för telemetri, agentpuls och systemstyrkort.
- **Scheman**:
  - `AgentTelemetryMetricSchema`
  - `SwarmTelemetrySnapshotSchema`
  - `DevelopmentTicketSchema`
  - Typer: `AgentTelemetryMetric`, `SwarmTelemetrySnapshot`, `DevelopmentTicket`.

---

### Fil 3: `src/features/gemini_live_swarm/telemetry/useSwarmTelemetry.ts` (NY)
- **Syfte**: React-hook för reaktiv telemetriaggregering.
- **Funktioner**:
  - Prenumererar på `swarmEventBus` under komponentens livscykel.
  - Beräknar ackumulerade värden: händelsetakt (events/min), aktiv agentstatus, genomsnittlig latens, sista tanke.
  - Returnerar `snapshot: SwarmTelemetrySnapshot` och hjälparfunktioner för filtrering.

---

### Fil 4: `src/features/gemini_live_swarm/ui/TelemetrySidebar.tsx` (NY)
- **Syfte**: Högkvalitativ mörk sidopanel för telemetri inspirerad av *Acoustic-Priming-backup*.
- **Innehåll**:
  - Rubrik med pulserande hälsostatus (`HEALTHY`, `DEGRADED`).
  - Metrikkort: Aktiva agenter, händelsetakt, totalt antal envelopes.
  - Agentgrid: Statusbricka (IDLE, THINKING, DONE), latens och senaste tankeström per specialist (Orchestrator, Researcher, Writer, Critic).
  - Levande händelseström med filter och tidsstämplar.

---

### Fil 5: `src/features/gemini_live_swarm/ui/MasterDevelopmentPlan.tsx` (NY)
- **Syfte**: Reaktivt styrkort integrerat i samordningspanelen med direkt koppling till `doc/TICKETS.md`.
- **Innehåll**:
  - TCK-001 (Verifierad med kvittohash `980bc67d`).
  - TCK-002 (Aktiv: Swarm Telemetry & Reactive Status).
  - TCK-003 (Väntar: MCP Bridge & Avancerad Orkestrering).
  - Förloppsstaplar, acceptanskriterier och verifieringsstatus.

---

### Fil 6: `src/features/gemini_live_swarm/ui/SwarmDashboard.tsx` (MODIFIERING)
- **Syfte**: Integrera `TelemetrySidebar` och `MasterDevelopmentPlan` som flikar/sektioner.
- **Ändring**: Byt ut statisk layout mot en tvåkolumns eller flikbaserad vy där operatören kan växla mellan orkestrering, telemetri och styrkort.

---

### Fil 7: `src/features/gemini_live_swarm/index.ts` (MODIFIERING)
- **Syfte**: Exponera alla nya komponenter, scheman och bussen via officiell FSD-fasad.

---

### Fil 8: `src/__tests__/swarm_telemetry.test.ts` (NY)
- **Syfte**: Isolerade TDD-enhetstester.
- **Testfall**:
  1. `SwarmEventBus`: publish och subscribe med wildcard.
  2. `SwarmEventBus`: korrekt unsubscription utan läckor.
  3. `SwarmEventBus`: ringbuffertkapacitet (begränsar till max 150 poster).
  4. `TelemetrySchema`: validering av giltig Snapshot.
  5. `DevelopmentTicketSchema`: validering av styrkortsobjekt.

---

### Fil 9: `scripts/run-tests.js` (MODIFIERING)
- **Syfte**: Inkludera `runSwarmTelemetryTests()` i testsviten.
