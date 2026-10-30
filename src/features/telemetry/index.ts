import { getGlobalSwarmEventBus } from '../../shared/bus/swarmEventBus';

export interface PingEvent {
  type: 'telemetry:ping';
  timestamp: number;
}

export function emitPing(): { success: boolean } {
  const eventBus = getGlobalSwarmEventBus();
  eventBus.emit('telemetry:ping', {
    type: 'telemetry:ping',
    timestamp: Date.now(),
  });
  return { success: true };
}
