import { EventEnvelope, EventEnvelopeSchema } from '../../../shared/contracts/envelope.ts';
import {
  SerialExecutionMetric,
  SerialExecutionMetricSchema,
} from '../telemetry/telemetrySchema.ts';

export type SwarmEventHandler = (envelope: EventEnvelope) => void;

export interface SwarmSubscription {
  id: string;
  pattern: string;
  handler: SwarmEventHandler;
}

export class SwarmEventBus {
  private subscriptions = new Map<string, SwarmSubscription>();
  private history: EventEnvelope[] = [];
  private maxHistorySize: number;

  constructor(maxHistorySize = 150) {
    this.maxHistorySize = maxHistorySize;
  }

  /**
   * Publicerar ett händelsekuvert till bussen med strikt Zod-validering (Fail Fast)
   */
  public publish(envelope: EventEnvelope): void {
    const validated = EventEnvelopeSchema.parse(envelope);

    // Lägg till i ringbuffert (FIFO)
    this.history.push(validated);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }

    // Distribuera till matchande prenumeranter
    for (const sub of this.subscriptions.values()) {
      if (this.matchesPattern(sub.pattern, validated.type)) {
        try {
          sub.handler(validated);
        } catch (handlerErr) {
          console.error(`[SwarmEventBus] Fel i prenumerationshanterare ${sub.id}:`, handlerErr);
        }
      }
    }
  }

  /**
   * Publicerar seriell exekveringsmetrik (TCK-006) med strikt Zod-validering och CloudEvents-inkapsling.
   */
  public publishSerialMetric(metric: SerialExecutionMetric): EventEnvelope {
    const validated = SerialExecutionMetricSchema.parse(metric);
    const eventType = validated.isTokenGated
      ? 'swarm.serial.gate.evaluated'
      : validated.stageStatus === 'COMPLETED' && validated.currentStage === 'e2e_verify'
      ? 'swarm.serial.pipeline.completed'
      : 'swarm.serial.stage.transition';

    const envelope: EventEnvelope = {
      id: `evt-serial-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      source: 'outreach/swarm/serial_motor',
      type: eventType,
      specversion: '1.0',
      datacontenttype: 'application/json',
      time: validated.lastTransitionAt || new Date().toISOString(),
      data: validated,
    };

    this.publish(envelope);
    return envelope;
  }

  /**
   * Registrerar en prenumeration med stöd för wildcard (*, swarm.*, osv.)
   * Returnerar en cleanup-funktion för avregistrering.
   */
  public subscribe(pattern: string, handler: SwarmEventHandler): () => void {
    const id = `sub-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    this.subscriptions.set(id, { id, pattern, handler });

    return () => {
      this.subscriptions.delete(id);
    };
  }

  /**
   * Returnerar buffrad händelsehistorik med valfri mönstermatchning
   */
  public getHistory(filterPattern?: string): EventEnvelope[] {
    if (!filterPattern || filterPattern === '*') {
      return [...this.history];
    }
    return this.history.filter((env) => this.matchesPattern(filterPattern, env.type));
  }

  /**
   * Tömmer historik och aktiva prenumerationer
   */
  public clear(): void {
    this.history = [];
    this.subscriptions.clear();
  }

  private matchesPattern(pattern: string, eventType: string): boolean {
    if (pattern === '*' || pattern === eventType) {
      return true;
    }
    if (pattern.endsWith('.*')) {
      const prefix = pattern.slice(0, -2);
      return eventType.startsWith(prefix);
    }
    return false;
  }
}

// Global instans för applikationen
let globalSwarmEventBus: SwarmEventBus | null = null;

export function getGlobalSwarmEventBus(): SwarmEventBus {
  if (!globalSwarmEventBus) {
    globalSwarmEventBus = new SwarmEventBus(150);
  }
  return globalSwarmEventBus;
}
