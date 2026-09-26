import { EventEnvelope, EventEnvelopeSchema } from '../../../shared/contracts/envelope.ts';
import { SwarmAgentRole } from '../agents/roleDefinitions.ts';

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
   * Publicerar händelse specifikt för en av SI v10.0-krafterna
   */
  public publishKraftEvent(
    role: SwarmAgentRole,
    eventSubtype: 'thinking' | 'completed' | 'error' | 'contract_locked' | 'e2e_verified',
    data: Record<string, any>
  ): EventEnvelope {
    const envelope: EventEnvelope = {
      id: `evt-kraft-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      source: `outreach/swarm/${role.toLowerCase()}`,
      type: `swarm.kraft.${role.toLowerCase()}.${eventSubtype}`,
      specversion: '1.0',
      datacontenttype: 'application/json',
      time: new Date().toISOString(),
      data: {
        role,
        eventSubtype,
        ...data,
      },
    };
    this.publish(envelope);
    return envelope;
  }

  /**
   * Publicerar händelse för den 4:e fristående Seriella Motorn
   */
  public publishSerialMotorEvent(
    phase: '1a' | '1b' | '2e' | '3c' | '4',
    status: 'started' | 'completed' | 'failed',
    data: Record<string, any>
  ): EventEnvelope {
    const envelope: EventEnvelope = {
      id: `evt-seriell-${phase}-${Date.now()}`,
      source: 'outreach/swarm/seriell_motor',
      type: `swarm.seriell_motor.phase_${phase}.${status}`,
      specversion: '1.0',
      datacontenttype: 'application/json',
      time: new Date().toISOString(),
      data: {
        engine: 'SERIELL_MOTOR',
        phase,
        status,
        ...data,
      },
    };
    this.publish(envelope);
    return envelope;
  }

  /**
   * Registrerar en prenumeration med stöd för wildcard (*, swarm.*, swarm.kraft.*, osv.)
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
