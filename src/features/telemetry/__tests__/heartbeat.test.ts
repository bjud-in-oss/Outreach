import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getGlobalSwarmEventBus } from '../../../shared/bus/swarmEventBus';
import { emitHeartbeat, Heartbeat } from '../heartbeat';

describe('TCK-033 Heartbeat och latensmätning', () => {
  it('skall mäta latens och skicka heartbeat event', async () => {
    const eventBus = getGlobalSwarmEventBus();
    const receivedEvents: any[] = [];
    
    // Prenumerera på heartbeat eventet som körtidsankare
    const unsubscribe = eventBus.subscribe('heartbeat', (envelope: any) => {
      receivedEvents.push(envelope.data || envelope);
    });

    try {
      const result = emitHeartbeat();

      // Kontrollera att resultatet från emitHeartbeat är korrekt
      expect(result.success).toBe(true);
      expect(result.event).toHaveProperty('id');
      expect(result.event).toHaveProperty('timestamp');
      expect(result.event).toHaveProperty('latencyMs');
      expect(result.event.latencyMs).toBeGreaterThanOrEqual(0);

      // Kontrollera att eventet skickades på bussen
      expect(receivedEvents.length).toBe(1);
      const receivedHeartbeat = receivedEvents[0] as Heartbeat;
      expect(receivedHeartbeat.id).toBe(result.event.id);
      expect(receivedHeartbeat.latencyMs).toBeDefined();

    } finally {
      unsubscribe();
    }
  });
});
