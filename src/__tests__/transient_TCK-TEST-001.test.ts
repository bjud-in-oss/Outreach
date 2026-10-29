import { describe, it, expect } from 'vitest';
import { emitPing, PingEventSchema } from '../features/telemetry';
import { getGlobalSwarmEventBus } from '../features/gemini_live_swarm/bus/swarmEventBus';

describe('emitPing (TCK-TEST-001)', () => {
  it('should emit a telemetry:ping event onto the event bus', async () => {
    const eventBus = getGlobalSwarmEventBus();
    const receivedEvents: any[] = [];
    
    // Subscribe to the event bus using the real mechanism
    const subscription = eventBus.subscribe((event: any) => {
      if (event.type === 'telemetry:ping') {
        receivedEvents.push(event);
      }
    });

    try {
      // Execute the function under test
      const result = emitPing();

      // Verify the result object
      expect(result.success).toBe(true);
      expect(result.event).toBeDefined();
      
      // Validate event structure via Zod
      const parseResult = PingEventSchema.safeParse(result.event);
      expect(parseResult.success).toBe(true);

      // Verify that the event was actually emitted on the event bus
      expect(receivedEvents.length).toBe(1);
      expect(receivedEvents[0]).toEqual(result.event);
      expect(receivedEvents[0].type).toBe('telemetry:ping');
    } finally {
      // Clean up the subscription
      subscription.unsubscribe();
    }
  });
});
