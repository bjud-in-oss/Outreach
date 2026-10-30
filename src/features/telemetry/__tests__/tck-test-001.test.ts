import { describe, it, expect, beforeEach } from 'vitest';
import { getGlobalSwarmEventBus } from '../../../shared/bus/swarmEventBus';
import { emitPing, PingEvent } from '..';

describe('TCK-TEST-001 - Ping Telemetry Flow', () => {
  beforeEach(() => {
    getGlobalSwarmEventBus().clear();
  });

  it('should emit a telemetry:ping event when emitPing is called', () => {
    const eventBus = getGlobalSwarmEventBus();
    let receivedEvent: PingEvent | null = null;

    const subscription = eventBus.subscribe('telemetry:ping', (event: PingEvent) => {
      receivedEvent = event;
    });

    try {
      // Detta anrop kommer att fela i nuläget eftersom emitPing inte är implementerat
      const result = emitPing();

      expect(result.success).toBe(true);
      expect(receivedEvent).not.toBeNull();
      expect(receivedEvent?.type).toBe('telemetry:ping');
      expect(typeof receivedEvent?.timestamp).toBe('number');
    } finally {
      subscription.unsubscribe();
    }
  });
});