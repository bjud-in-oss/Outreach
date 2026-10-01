# 1b Kartlägga: Global Swarm Core, Systeminstruktions-synk & Bakgrundsöverlevnad (TCK-015)

## 1. Kartläggning av Befintliga Artefakter

### 1.1 Systeminstruktioner och Invarianter
- **`doc/SI_v10.0.md`**: Innehåller systemets övergripande kompass och försoningsprinciper. Behöver synkroniseras ordagrant med den finslipade texten: "Ditt högsta syfte är att främja närhet till Guds son, den ideala människan...".
- **`AGENTS.md`**: Definierar agenternas körtidskontrakt och kompass under `<RULE[AGENTS_md]>`.
- **`src/features/gemini_live_swarm/agents/roleDefinitions.ts`**:
  - Exporterar `SEMANTIC_INVARIANT`: Den centrala strängkonstanten som injiceras i agenternas systeminstruktioner.
  - Genererar `systemInstruction` för de 4 försoningsenheterna (`ATT_FOLJA`, `ATT_VANDA_OM`, `ATT_FORLIKAS`, `SERIELL_MOTOR`).
- **`src/features/gemini_live_swarm/coordinator/swarmOrchestrator.ts`**:
  - Innehåller kampanjplanering och systemprompter. Använder `SEMANTIC_INVARIANT` för att säkerställa att ingen roll agerar utanför kompassen.

### 1.2 Applikationsrot & Tillståndskärna (`src/App.tsx`)
- **Nuvarande läge**: `App.tsx` instansierar `SwarmOrchestrator` och renderedar flikar. `GeminiLiveSession` och `GoogleDriveClient` initialiseras lokalt eller on-demand.
- **Målbild**: Introducera en `SwarmProvider` (eller global kärna) som initierar och bevarar:
  1. `SwarmEventBus` (singleton eller kontextbunden)
  2. `GoogleDriveClient` (autentiserad instans)
  3. `GeminiLiveSession` (aktiv WebSocket-förbindelse)
  4. `SwarmOrchestrator` (samlad exekveringsmotor)
- Detta säkerställer att pågående dialog och Drive-synk fortsätter obrutet i bakgrunden vid flik- och vybyten.

### 1.3 Realtidsresiliens & Auto-Reconnect (`geminiLiveSession.ts`)
- **Nuvarande läge**: Vid fel sätts sessionen till `ERROR` eller `HALTED`. Om ett nätverksfel eller 503 High Demand inträffar finns ingen automatisk återuppkoppling.
- **Målbild**: Införa en kontrollerad auto-reconnect-loop med exponentiell backoff (1s, 2s, 4s, max 3 försök) som försöker återupprätta sessionen utan att tappa transkriptionshistorik eller buffrade chunks.

### 1.4 Kontextmarginal & Disk-Handoff (`telemetrySchema.ts` & `swarmEventBus.ts`)
- **Nuvarande läge**: Eventbussen samlar händelser upp till ringbuffertens maxkapacitet (150). Tokenförbrukning mäts inte mot en specifik marginalgräns.
- **Målbild**: Introducera `ContextUsageMetric` i `telemetrySchema.ts`. Vid 60% utnyttjande (~40K tokens av 64K fönster) publiceras `swarm.context.marginal.reached`. Systemet stödjer disk-handoff via `doc/LAST_CYCLE/` och registrering av under-tickets i `doc/TICKETS.md`.
