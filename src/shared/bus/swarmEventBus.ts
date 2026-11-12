import { z } from 'zod';

export type SwarmEventType = 'telemetry:ping' | 'telemetry:heartbeat' | 'ui:action' | '*' | string;

export interface SwarmEvent<T = any> {
  id: string;
  source: string;
  specversion: string;
  type: SwarmEventType;
  datacontenttype: string;
  time: string;
  data: T;
}

export type SwarmSubscription = (() => void) & { unsubscribe: () => void };

export class SwarmEventBus {
  private listeners: Map<SwarmEventType, Set<(event: any) => void>> = new Map();

  public subscribe(type: SwarmEventType, callback: (event: any) => void): SwarmSubscription {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);

    let isSubscribed = true;
    
    // AI-Tolerant avregistrering
    const unbind = () => {
      if (!isSubscribed) return;
      isSubscribed = false;
      const subs = this.listeners.get(type);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) this.listeners.delete(type);
      }
    };
    
    unbind.unsubscribe = unbind;
    return unbind as SwarmSubscription;
  }

  public emit(type: SwarmEventType, payload: any): void {
    const cloudEvent: SwarmEvent = {
      id: crypto.randomUUID(),
      source: 'outreach/core',
      specversion: '1.0',
      type,
      datacontenttype: 'application/json',
      time: new Date().toISOString(),
      data: payload,
    };

    const specificHandlers = this.listeners.get(type);
    if (specificHandlers) {
      specificHandlers.forEach(callback => {
        try {
          const dataToSend = (payload && typeof payload === 'object' && 'data' in payload) ? payload.data : payload;
          
          if (dataToSend && typeof dataToSend === 'object' && !Array.isArray(dataToSend) && !('data' in dataToSend)) {
            Object.defineProperty(dataToSend, 'data', {
              value: dataToSend,
              enumerable: false,
              configurable: true
            });
          }
          
          callback(dataToSend);
        } catch (err) {
          console.error(`[SwarmEventBus] Callback error for ${type}:`, err);
        }
      });
    }

    const wildcardHandlers = this.listeners.get('*');
    if (wildcardHandlers) {
      wildcardHandlers.forEach(callback => {
        try {
          callback(cloudEvent);
        } catch (err) {
          console.error(`[SwarmEventBus] Wildcard callback error for ${type}:`, err);
        }
      });
    }
  }

  public publish(type: SwarmEventType, payload: any): void {
    this.emit(type, payload);
  }

  public publishLiveEvent(type: SwarmEventType, payload: any): void {
    this.emit(type, payload);
  }

  public publishSerialMetric(metric: any): void {
    this.emit('swarm.serial.metric', metric);
  }

  public clear(): void {
    this.listeners.clear();
  }
}

let globalBus: SwarmEventBus | null = null;
export function getGlobalSwarmEventBus(): SwarmEventBus {
  if (!globalBus) globalBus = new SwarmEventBus();
  return globalBus;
}
