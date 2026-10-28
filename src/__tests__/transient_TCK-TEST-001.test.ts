import { describe, it, expect } from 'vitest';
import { emitPing, PingEventSchema } from '../features/telemetry';
import { getGlobalSwarmEventBus } from '../shared/bus/swarmEventBus';

describe('transient_TCK-TEST-001', () => {
  it('should emit telemetry:ping event and match schema', async () => {
    const eventBus = getGlobalSwarmEventBus();

    // Körtidsankare: Verifiera att eventBus.emit existerar och är en funktion
    expect(typeof eventBus.emit).toBe('function');

    const eventReceivedPromise = new Promise((resolve, reject) => {
      const unsubscribe = eventBus.subscribe('telemetry:ping', (envelope: any) => {
        try {
          const payload = envelope.data || envelope;
          const parsed = PingEventSchema.safeParse(payload);
          expect(parsed.success).toBe(true);
          if (parsed.success) {
            expect(parsed.data.type).toBe('telemetry:ping');
            expect(typeof parsed.data.timestamp).toBe('number');
          }
          unsubscribe();
          resolve(true);
        } catch (error) {
          unsubscribe();
          reject(error);
        }
      });
    });

    const result = emitPing();

    expect(result.success).toBe(true);
    expect(result.event.type).toBe('telemetry:ping');

    await eventReceivedPromise;
  });
});
