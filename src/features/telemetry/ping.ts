import { z } from 'zod';
import { getGlobalSwarmEventBus } from '../../shared/bus/swarmEventBus';

export const PingEventSchema = z.object({
  type: z.literal('telemetry:ping'),
  timestamp: z.number(),
});

export type PingEvent = z.infer<typeof PingEventSchema>;

export function emitPing() {
  const eventBus = getGlobalSwarmEventBus();
  const event: PingEvent = {
    type: 'telemetry:ping',
    timestamp: Date.now(),
  };
  
  eventBus.emit('telemetry:ping', event);
  
  return { success: true, event };
}
