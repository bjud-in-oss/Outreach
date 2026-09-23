# 2b Modellera: Datastrukturer, Zod-Scheman och Kontrakt (TCK-002)

## 1. Zod-Scheman (`src/features/gemini_live_swarm/telemetry/telemetrySchema.ts`)

```typescript
import { z } from 'zod';
import { EventEnvelopeSchema } from '../../../shared/contracts/envelope.ts';

/**
 * Individuell agentmetrik
 */
export const AgentTelemetryMetricSchema = z.object({
  agentId: z.string(),
  role: z.enum(['ORCHESTRATOR', 'RESEARCHER', 'OUTREACH_WRITER', 'CRITIC']),
  status: z.enum(['IDLE', 'THINKING', 'EXECUTING_TOOL', 'DONE', 'ERROR']),
  lastThought: z.string().optional(),
  lastActive: z.string().datetime(),
  totalEventsEmitted: z.number().int().nonnegative().default(0),
  averageLatencyMs: z.number().nonnegative().default(0),
});

export type AgentTelemetryMetric = z.infer<typeof AgentTelemetryMetricSchema>;

/**
 * Sammanställt telemetritillstånd för hela svärmen
 */
export const SwarmTelemetrySnapshotSchema = z.object({
  activeAgentsCount: z.number().int().nonnegative(),
  totalEventsCount: z.number().int().nonnegative(),
  eventsPerMinute: z.number().nonnegative(),
  agentMetrics: z.record(z.string(), AgentTelemetryMetricSchema),
  recentEnvelopes: z.array(EventEnvelopeSchema),
  healthStatus: z.enum(['HEALTHY', 'DEGRADED', 'HALTED']),
  lastPulseAt: z.string().datetime(),
});

export type SwarmTelemetrySnapshot = z.infer<typeof SwarmTelemetrySnapshotSchema>;

/**
 * Styrkort / Master Development Plan schema
 */
export const DevelopmentTicketSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.enum(['PLANERING', 'AKTIV', 'VERIFIERAD', 'VÄNTAR']),
  phase: z.string(),
  progressPercentage: z.number().min(0).max(100),
  deliverables: z.array(z.string()),
  tokenHash: z.string().optional(),
  verifiedReceiptHash: z.string().optional(),
});

export type DevelopmentTicket = z.infer<typeof DevelopmentTicketSchema>;
```

## 2. Reaktiv Händelsebuss (`SwarmEventBus`)
Klassen `SwarmEventBus` definieras som en deterministisk pub/sub-motor:
```typescript
export type SwarmEventHandler = (envelope: EventEnvelope) => void;

export interface SwarmSubscription {
  id: string;
  pattern: string; // t.ex. "swarm.*", "ticket.*", eller "*"
  handler: SwarmEventHandler;
}

export class SwarmEventBus {
  private subscriptions: Map<string, SwarmSubscription> = new Map();
  private history: EventEnvelope[] = [];
  private maxHistorySize = 150;

  public publish(envelope: EventEnvelope): void;
  public subscribe(pattern: string, handler: SwarmEventHandler): () => void;
  public getHistory(filterPattern?: string): EventEnvelope[];
  public clear(): void;
}
```

## 3. Komponentstruktur i Gränssnittet
- `SwarmDashboard.tsx`: Huvudyta för kampanjer och steg.
  - Vänster / Mitt: Kampanjinmatning och steg-pipeline (forskning, författande, kritik).
  - Höger / Sidopanel: `TelemetrySidebar` med live mätare, pulserande status per agent och realtidslogg.
  - Överliggande Flik / Vy: `MasterDevelopmentPlan` som visar framsteg för TCK-001, TCK-002 och TCK-003 med förankring i `doc/TICKETS.md`.
