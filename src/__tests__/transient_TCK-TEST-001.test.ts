import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getGlobalSwarmEventBus, SwarmEventBus } from '../shared/bus/swarmEventBus';
import { emitPing, PingEvent } from '../features/telemetry';

describe('transient_TCK-TEST-001: emitPing Resiliens', () => {
  let eventBus: SwarmEventBus;

  beforeEach(() => {
    eventBus = getGlobalSwarmEventBus();
    eventBus.clear();
  });

  afterEach(() => {
    eventBus.clear();
  });

  it('ska emittera en giltig telemetry:ping händelse via SwarmEventBus', () => {
    const receivedEvents: PingEvent[] = [];
    
    eventBus.subscribe('telemetry:ping', (event: PingEvent) => {
      receivedEvents.push(event);
    });

    const result = emitPing();

    expect(result.success).toBe(true);
    expect(result.event).toBeDefined();
    expect(result.event.type).toBe('telemetry:ping');
    expect(receivedEvents).toHaveLength(1);
    expect(receivedEvents[0]).toEqual(result.event);
  });
});
