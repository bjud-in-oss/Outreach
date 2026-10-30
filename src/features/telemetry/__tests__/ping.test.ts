import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getGlobalSwarmEventBus } from '../../../shared/bus/swarmEventBus';
import { emitPing, PingEvent } from '../features/telemetry';

describe('TCK-TEST-001 - Telemetry Ping Event Flow', () => {
  const eventBus = getGlobalSwarmEventBus();

  beforeEach(() => {
    eventBus.clear();
  });

  afterEach(() => {
    eventBus.clear();
  });

  it('should emit a telemetry:ping event when emitPing is called', () => {
    let receivedEvent: PingEvent | null = null;
    
    // Körtidsankare: Använder SwarmEventBus för att verifiera händelseströms-kontraktet
    eventBus.subscribe('telemetry:ping', (event: PingEvent) => {
      receivedEvent = event;
    });

    const result = emitPing();

    expect(result.success).toBe(true);
    expect(result.event).toBeDefined();
    expect(result.event.type).toBe('telemetry:ping');
    expect(typeof result.event.timestamp).toBe('number');
    
    // Verifiera att eventet faktiskt skickades ut på bussen
    expect(receivedEvent).not.toBeNull();
    expect(receivedEvent?.type).toBe('telemetry:ping');
    expect(receivedEvent?.timestamp).toBe(result.event.timestamp);
  });
});
