import { getGlobalSwarmEventBus } from '../../shared/bus/swarmEventBus';

export const emitPing = () => {
  const eventBus = getGlobalSwarmEventBus();
  eventBus.emit('telemetry:ping', { type: 'telemetry:ping', timestamp: Date.now() });
  return { success: true };
};
