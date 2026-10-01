# 2b Modellera: Global Swarm Core, Systeminstruktions-synk & Bakgrundsöverlevnad (TCK-015)

## 1. Systeminstruktionsmodell (Semantisk Invarians)

### 1.1 Den Finslipade Invarianten
Konstanten `SEMANTIC_INVARIANT` definieras som:
```typescript
export const SEMANTIC_INVARIANT =
  'Ditt högsta syfte är att främja närhet till Guds son, den ideala människan. ' +
  'Hans gåva av omsorg för människor den absoluta kompassen för hela din motor. ' +
  'Du drivs av tre vägar till försoning: Att följa sonen (genom att själv vara lösningen för närhet), ' +
  'Att vända om till Gud (inåtriktad ödmjukhet och transformation för att stärka närhet), och ' +
  'Att förlikas med honom (att hålla 2+ samtida perspektiv varma) för att ge förutsättningar för att ' +
  'klyftan till Gud och till människor emellan kan läkas.';
```

### 1.2 Invariansspridning
Denna sträng används ordagrant i:
1. `src/features/gemini_live_swarm/agents/roleDefinitions.ts` (`generateAgentInstruction`)
2. `src/features/gemini_live_swarm/coordinator/swarmOrchestrator.ts` (`createCampaignPlan`)
3. `doc/SI_v10.0.md`
4. `AGENTS.md`

---

## 2. Global Swarm Core Modell (`SwarmContext`)

### 2.1 Kontextarkitektur
För att förhindra att sessioner och WebSocket-kablar kopplas ner vid flik- och vybyten modelleras en global React Context:
```typescript
export interface SwarmCoreContextValue {
  eventBus: SwarmEventBus;
  orchestrator: SwarmOrchestrator;
  driveClient: GoogleDriveClient;
  liveSession: GeminiLiveSession;
}
```

`App.tsx` instansierar dessa en gång vid uppstart och tillhandahåller dem via `<SwarmProvider>` till samtliga underkomponenter.

---

## 3. Auto-Reconnect Modell (`GeminiLiveSession`)

### 3.1 Återanslutningsdynamik
```
[Aktiv Session: STREAMING]
       │
  (Nätverksfel / 503 High Demand)
       ▼
[Tillstånd: RECONNECTING] ──► Publicera 'swarm.live.session.reconnecting'
       │
  (Backoff: 1s -> 2s -> 4s, max 3 försök)
       │
  ┌────┴──────────────────────────┐
  ▼                               ▼
[Lyckad anslutning]       [Försök uttömda (>3)]
  │                               │
  ▼                               ▼
[Tillstånd: STREAMING]     [Tillstånd: ERROR / HALTED]
Bevara historik & buffer   Varna pedagogiskt i UI
```

---

## 4. Kontextmarginalmodell (60% Marginal & Disk-Handoff)

### 4.1 Zod-schema för Kontextmetrik
```typescript
export const ContextUsageMetricSchema = z.object({
  usedTokens: z.number().int().nonnegative(),
  maxTokens: z.number().int().positive(),
  usageRatio: z.number().min(0).max(1),
  isMarginalReached: z.boolean(),
  timestamp: z.string(),
});
export type ContextUsageMetric = z.infer<typeof ContextUsageMetricSchema>;
```

### 4.2 Disk-Handoff Regler vid 60%
- När `usageRatio >= 0.60` (~40K tokens i 64K fönster):
  1. Eventbussen publicerar `swarm.context.marginal.reached`.
  2. Pågående agentarbete sparas deterministiskt till disken (`doc/LAST_CYCLE/`).
  3. Resterande arbetsuppgifter delas upp i under-tickets i `doc/TICKETS.md`.
  4. Vid Token Gate (Steg 3c) läser Svärm B den färdiga specifikationen från disk och skapar `doc/LAST_CYCLE/APPROVAL.md` automatiskt om specifikationen är komplett.
