import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getGlobalSwarmEventBus } from '../features/gemini_live_swarm/bus/swarmEventBus';
import { emitPing, PingEvent } from '../features/telemetry';

describe('TCK-TEST-001 - emitPing and EventBus Integration', () => {
  const eventBus = getGlobalSwarmEventBus();

  beforeEach(() => {
    eventBus.clear();
  });

  afterEach(() => {
    eventBus.clear();
  });

  it('should emit a telemetry:ping event when emitPing is called', () => {
    let receivedEvent: PingEvent | null = null;

    const subscription = eventBus.subscribe('telemetry:ping', (event: PingEvent) => {
      receivedEvent = event;
    });

    try {
      const result = emitPing();

      expect(result.success).toBe(true);
      expect(receivedEvent).not.toBeNull();
      expect(receivedEvent?.type).toBe('telemetry:ping');
      expect(typeof receivedEvent?.timestamp).toBe('number');
      expect(result.event).toEqual(receivedEvent);
    } finally {
      subscription.unsubscribe();
    }
  });
});
