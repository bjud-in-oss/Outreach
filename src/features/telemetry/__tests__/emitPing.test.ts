import { describe, it, expect } from 'vitest';
import { getGlobalSwarmEventBus } from '../features/gemini_live_swarm/bus/swarmEventBus';
import { emitPing, PingEvent } from '..';

describe('TCK-TEST-001 - Telemetry Ping Flow', () => {
  it('should emit a telemetry:ping event when emitPing is called', () => {
    const eventBus = getGlobalSwarmEventBus();
    let receivedEvent: PingEvent | null = null;
    
    // Körtidsankare: Använd eventBus.subscribe för att fånga upp händelsen
    const subscription = eventBus.subscribe('telemetry:ping', (event: PingEvent) => {
      receivedEvent = event;
    });
    
    try {
      // Anropa funktionen som ska testas
      const result = emitPing();
      
      // Verifiera resultat
      expect(result.success).toBe(true);
      expect(receivedEvent).not.toBeNull();
      expect(receivedEvent?.type).toBe('telemetry:ping');
      expect(typeof receivedEvent?.timestamp).toBe('number');
    } finally {
      subscription.unsubscribe();
    }
  });
});
