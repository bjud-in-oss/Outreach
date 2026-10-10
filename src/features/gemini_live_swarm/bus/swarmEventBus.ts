import { EventEnvelope, EventEnvelopeSchema } from '../../../shared/contracts/envelope.ts';
import {
  SerialExecutionMetric,
  SerialExecutionMetricSchema,
  AudioOutputState,
  AudioOutputStateSchema,
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
      if (!this.matchesPattern(sub.pattern, validated.type)) continue;
      try {
        sub.handler(validated);
      } catch (handlerErr) {
        console.error(`[SwarmEventBus] Fel i prenumerationshanterare ${sub.id}:`, handlerErr);
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
   * Publicerar en strömningshändelse för Gemini Live (TCK-010) som CloudEvents 1.0.
   */
  public publishLiveEvent(
    type: string,
    data: Record<string, unknown>,
    source = 'outreach/gemini_live/stream'
  ): EventEnvelope {
    const envelope: EventEnvelope = {
      id: `evt-live-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      source,
      type,
      specversion: '1.0',
      datacontenttype: 'application/json',
      time: new Date().toISOString(),
      data,
    };

    this.publish(envelope);
    return envelope;
  }

  /**
   * Publicerar uppdatering av röst-/ljudspärrstillstånd (TCK-011) som CloudEvents 1.0.
   */
  public publishAudioState(audioState: AudioOutputState): EventEnvelope {
    AudioOutputStateSchema.parse(audioState);

    const envelope: EventEnvelope = {
      id: `evt-audio-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      source: 'outreach/gemini_live/audio_gate',
      type: 'swarm.audio.state.changed',
      specversion: '1.0',
      datacontenttype: 'application/json',
      time: new Date().toISOString(),
      data: audioState as unknown as Record<string, unknown>,
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

  /**
   * Enkel emit-metod för UI- och domänhändelser som paketeras som CloudEvents 1.0.
   */
  public emit(type: string, data: Record<string, unknown> = {}): EventEnvelope {
    return this.publishLiveEvent(type, data, 'outreach/ui/event');
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
