import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { emitPing, PingEvent } from '../features/telemetry';
import { getGlobalSwarmEventBus } from '../features/gemini_live_swarm';

describe('TCK-TEST-001: emitPing Resiliens', () => {
  let receivedEvents: PingEvent[] = [];
  const eventBus = getGlobalSwarmEventBus();

  beforeEach(() => {
    receivedEvents = [];
    eventBus.subscribe('telemetry:ping', (event: PingEvent) => {
      receivedEvents.push(event);
    });
  });

  afterEach(() => {
    eventBus.unsubscribeAll();
  });

  it('skall emittera telemetry:ping till eventbussen och returnera success', () => {
    const result = emitPing();

    expect(result.success).toBe(true);
    expect(result.event).toBeDefined();
    expect(result.event.type).toBe('telemetry:ping');
    expect(receivedEvents).toHaveLength(1);
    expect(receivedEvents[0]).toEqual(result.event);
  });
});
