import { SwarmEventType, SwarmEvent, SwarmSubscription, SwarmEventBus as BaseSwarmEventBus } from '../../../shared/bus/swarmEventBus';

export class SwarmEventBus extends BaseSwarmEventBus {
  public emit(type: SwarmEventType, payload: any): void {
    super.emit(type, payload);

    const cloudEvent: SwarmEvent = {
        id: crypto.randomUUID(),
        source: 'outreach/core',
        specversion: '1.0',
        type,
        datacontenttype: 'application/json',
        time: new Date().toISOString(),
        data: payload,
    };

    (this as any).listeners.forEach((handlers: Set<(event: any) => void>, registeredType: string) => {
      if (registeredType.endsWith('*') && registeredType !== '*') {
        const prefix = registeredType.slice(0, -1);
        if (type.startsWith(prefix)) {
          handlers.forEach(callback => {
            try {
              callback(cloudEvent);
            } catch (err) {
              console.error(`[SwarmEventBus] Prefix wildcard callback error for ${registeredType}:`, err);
            }
          });
        }
      }
    });
  }
}

let globalBus: SwarmEventBus | null = null;
export function getGlobalSwarmEventBus(): SwarmEventBus {
  if (!globalBus) globalBus = new SwarmEventBus();
  return globalBus;
}
export * from '../../../shared/bus/swarmEventBus';
