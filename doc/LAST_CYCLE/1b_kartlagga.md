# 1b Kartlägga: Filstrukturer, Gränsytor och Händelsebuss (TCK-002)

## 1. Kartläggning av Befintlig Kodbas och Beröringspunkter
1. **Domän: `src/features/gemini_live_swarm/`**
   - Befintliga moduler:
     - `agents/roleDefinitions.ts`: Definitioner av roller (ORCHESTRATOR, RESEARCHER, OUTREACH_WRITER, CRITIC).
     - `coordinator/swarmOrchestrator.ts`: Sekvenskörning av kampanjer och manuell emittering av envelopes.
     - `session/geminiLiveSession.ts`: Gemini SDK wrapper och reservlogik.
     - `ui/SwarmDashboard.tsx`: Kampanjformulär och stegvisning.
     - `index.ts`: Officiell domänfasad.
   - Nya moduler som ska tillföras:
     - `bus/swarmEventBus.ts`: Central händelsebuss med pub/sub, typade topics och ringbuffert.
     - `telemetry/telemetrySchema.ts`: Zod-kontrakt för telemetrimätningar och systemstatus.
     - `telemetry/useSwarmTelemetry.ts`: Hook som aggregerar levande mätvärden (throughput, latens, tankar).
     - `ui/TelemetrySidebar.tsx`: Reaktiv telemetrivisning med mätare, agentstatus och händelseström.
     - `ui/MasterDevelopmentPlan.tsx`: Reaktivt styrkort kopplat till `doc/TICKETS.md` och systemfaser.
2. **Koppling mot Delade Kontrakt: `src/shared/contracts/envelope.ts`**
   - Använder befintligt `EventEnvelopeSchema` som bärare för alla buss-meddelanden (`swarm.agent.thinking`, `swarm.agent.acted`, `swarm.telemetry.pulse`, `ticket.status.updated`).
3. **Koppling mot WAL Logger: `src/features/wal_logger/`**
   - Händelsebussen kan automatiskt spegla kritiska händelser till `WalEngine`, vilket ger automatisk spårbarhet utan extra boilerplate.
4. **Koppling mot App-rot: `src/App.tsx`**
   - Infoga `TelemetrySidebar` och `MasterDevelopmentPlan` som tillgängliga vyer/sektioner i operatörspanelen.

## 2. Intern Riskanalys (Uppföljning och Fördjupning)
- **Risknod 1: State (Asynkron synkronisering & Race Conditions)**
  - *Svar*: Bussen hanterar alla prenumerationsanrop synkront i minnet med en deterministisk `Set<Handler>`. Händelser köas sekventiellt så att ordningsföljden (causality) alltid bevaras.
- **Risknod 2: Contract (Zod-validering & Versionering)**
  - *Svar*: `TelemetrySchema` definieras strikt med Zod. Om ett händelsekuvert saknar obligatoriska fält avvisas det omedelbart och flaggas i `TelemetrySidebar` som ett rött fel (Fail Fast).
- **Risknod 3: Resilience (Skärmfrysning vid snabba agenttankar)**
  - *Svar*: UI-uppdateringar batchas genom standard React 19 microtask-schemaläggning. Telemetrihistoriken har ett tak på 150 händelser med FIFO-rensning.

## 3. Planerade Filoperationer
| Fil | Typ | Syfte |
|---|---|---|
| `src/features/gemini_live_swarm/bus/swarmEventBus.ts` | Ny | Reaktiv händelsebuss baserad på `EventEnvelope` |
| `src/features/gemini_live_swarm/telemetry/telemetrySchema.ts` | Ny | Zod-kontrakt för telemetri och styrkort |
| `src/features/gemini_live_swarm/telemetry/useSwarmTelemetry.ts` | Ny | React-hook för reaktiv telemetri och aggregering |
| `src/features/gemini_live_swarm/ui/TelemetrySidebar.tsx` | Ny | Reaktiv sidopanel för telemetri och event-ström |
| `src/features/gemini_live_swarm/ui/MasterDevelopmentPlan.tsx` | Ny | Reaktivt styrkort baserat på `doc/TICKETS.md` |
| `src/features/gemini_live_swarm/index.ts` | Modifiering | Exponera nya fasader |
| `src/features/gemini_live_swarm/ui/SwarmDashboard.tsx` | Modifiering | Integrera styrkort och telemetridockning |
| `src/__tests__/swarm_telemetry.test.ts` | Ny | Isolerade TDD-tester för buss och telemetrikontrakt |
| `scripts/run-tests.js` | Modifiering | Inkludera de nya testerna |

```json
{
  "status": "PLANNING_FAS_1",
  "current_domain": "gemini_live_swarm",
  "next_step": "2a_avgransa",
  "ticket_id": "TCK-002",
  "active_skill": "real-time-and-multi-user",
  "active_vectors": [
    "reactive_event_bus",
    "swarm_telemetry",
    "master_development_plan",
    "cloud_events_pubsub"
  ]
}
```
