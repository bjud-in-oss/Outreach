import { getGlobalSwarmEventBus } from '../../shared/bus/swarmEventBus';

export interface Heartbeat {
  id: string;
  timestamp: number;
  latencyMs: number;
}

export function emitHeartbeat() {
  const eventBus = getGlobalSwarmEventBus();
  const id = crypto.randomUUID();
  const timestamp = Date.now();
  const latencyMs = 0; 
  
  const eventPayload: Heartbeat = {
    id,
    timestamp,
    latencyMs
  };

  eventBus.emit('heartbeat', eventPayload);

  return {
    success: true,
    event: eventPayload
  };
}
