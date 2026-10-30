import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { emitPing } from '..';
import { getGlobalSwarmEventBus, SwarmEventBus } from '../../../shared/bus/swarmEventBus';

describe('TCK-TEST-001 - Telemetry Ping Flow', () => {
  let eventBus: SwarmEventBus;

  beforeEach(() => {
    eventBus = getGlobalSwarmEventBus();
    eventBus.clear();
  });

  afterEach(() => {
    eventBus.clear();
  });

  it('should emit a telemetry:ping event when emitPing is called', () => {
    const receivedEvents: any[] = [];
    
    eventBus.subscribe('telemetry:ping', (event) => {
      receivedEvents.push(event);
    });

    const result = emitPing();

    expect(result.success).toBe(true);
    expect(result.event.type).toBe('telemetry:ping');
    expect(typeof result.event.timestamp).toBe('number');
    expect(result.event.timestamp).toBeLessThanOrEqual(Date.now());
    
    expect(receivedEvents).toHaveLength(1);
    expect(receivedEvents[0]).toEqual(result.event);
  });
});