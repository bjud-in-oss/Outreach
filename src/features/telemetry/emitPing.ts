import { z } from 'zod';
import { getGlobalSwarmEventBus } from '../gemini_live_swarm/bus/swarmEventBus';

export const PingEventSchema = z.object({
  type: z.literal('telemetry:ping'),
  timestamp: z.number(),
});

export type PingEvent = z.infer<typeof PingEventSchema>;

export interface PingResult {
  success: boolean;
  event: PingEvent;
}

export function emitPing(): PingResult {
  const eventBus = getGlobalSwarmEventBus();
  
  const event: PingEvent = {
    type: 'telemetry:ping',
    timestamp: Date.now(),
  };

  // Validera via Zod (även om vi skapar objektet direkt, säkerställer vi kontraktet)
  const validatedEvent = PingEventSchema.parse(event);

  eventBus.emit('telemetry:ping', validatedEvent);

  return {
    success: true,
    event: validatedEvent,
  };
}
