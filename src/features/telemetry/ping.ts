import { z } from 'zod';

export const PingEventSchema = z.object({
  timestamp: z.string(),
  nodeId: z.string(),
  status: z.enum(['ok', 'degraded', 'critical']),
});

export type PingEvent = z.infer<typeof PingEventSchema>;

export const emitPing = (event: PingEvent): void => {
  // Här skulle eventuellt sändning till EventBus ske
  console.log('Ping event emitted:', event);
};
