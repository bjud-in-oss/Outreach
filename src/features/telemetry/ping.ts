import { getGlobalSwarmEventBus } from '../../shared/bus/swarmEventBus';

export interface PingEvent {
  type: 'telemetry:ping';
  timestamp: number;
}

export function emitPing() {
  const eventBus = getGlobalSwarmEventBus();
  const event: PingEvent = {
    type: 'telemetry:ping',
    timestamp: Date.now(),
  };

  eventBus.publish('telemetry:ping', event);

  return {
    success: true,
    event,
  };
}
