import { describe, it, expect } from 'vitest';
import { emitPing } from '../features/telemetry';
import { getGlobalSwarmEventBus } from '../shared/bus/swarmEventBus';

describe('TCK-TEST-001: Telemetry Ping', () => {
  it('sänder en typad PingEvent via EventBus med emit som körtidsankare', () => {
    const eventBus = getGlobalSwarmEventBus();
    let receivedEnvelope: any = null;
    const unsubscribe = eventBus.subscribe('telemetry:ping', (envelope) => {
      receivedEnvelope = envelope;
    });

    // Körtidsankare: verifiera att händelsebussen exekveras i körtid
    expect(typeof eventBus.emit).toBe('function');
    const result = emitPing();

    expect(result.success).toBe(true);
    expect(receivedEnvelope).toBeDefined();
    expect(receivedEnvelope.type).toBe('telemetry:ping');
    unsubscribe();
  });
});
