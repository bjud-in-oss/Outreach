import { getGlobalSwarmEventBus } from '../../shared/bus/swarmEventBus';

export interface Ping {
  id: string;
  timestamp: number;
}

export function emitPing() {
  const eventBus = getGlobalSwarmEventBus();
  const id = crypto.randomUUID();
  const timestamp = Date.now();
  
  const eventPayload: Ping = {
    id,
    timestamp
  };

  eventBus.emit('ping', eventPayload);

  return {
    success: true,
    event: eventPayload
  };
}
