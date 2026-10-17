import { describe, it, expect } from 'vitest';
import { sendPing, PingEventSchema } from '../features/telemetry/index.ts';

describe('TCK-TEST-001: Telemetry Ping Lifecycle', () => {
  it('sends a PingEvent via EventBus and validates against Zod schema', () => {
    const publishedEvents: any[] = [];
    const eventBus = {
      emit: (event: string, payload: any) => {
        publishedEvents.push({ event, payload });
      },
    };

    // Körtidsankare (steel-thread) för Gate 3a
    eventBus.emit('telemetry.test.anchor', { timestamp: Date.now() });

    const ping = sendPing(eventBus, 'test-pong');

    expect(ping).toBeDefined();
    expect(ping.message).toBe('test-pong');

    const validation = PingEventSchema.safeParse(ping);
    expect(validation.success).toBe(true);

    expect(publishedEvents.some((e) => e.event === 'telemetry.ping')).toBe(true);
  });
});
