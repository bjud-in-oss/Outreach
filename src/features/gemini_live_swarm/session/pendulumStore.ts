import { z } from 'zod';
import { SwarmEventBus } from '../bus/swarmEventBus.ts';

export const PendulumModeSchema = z.enum(['LISTEN', 'TALK']);
export type PendulumMode = z.infer<typeof PendulumModeSchema>;

export interface PendulumOptions {
  watchdogTimeoutMs?: number;
  onVadStateChange?: (vadPaused: boolean) => void;
}

export class PendulumStore {
  private mode: PendulumMode = 'LISTEN';
  private watchdogTimer: any = null;
  private watchdogTimeoutMs: number;
  private eventBus?: SwarmEventBus;
  private unsubscribe?: () => void;
  private onVadStateChange?: (vadPaused: boolean) => void;
  private listeners = new Set<(mode: PendulumMode) => void>();

  constructor(eventBus?: SwarmEventBus, options?: PendulumOptions) {
    this.eventBus = eventBus;
    this.watchdogTimeoutMs = options?.watchdogTimeoutMs || 8000;
    this.onVadStateChange = options?.onVadStateChange;

    if (this.eventBus) {
      this.subscribeToBus();
    }
  }

  public getMode(): PendulumMode {
    return this.mode;
  }

  public setMode(newMode: PendulumMode, reason = 'MANUAL'): void {
    if (this.mode === newMode) return;
    this.mode = newMode;

    if (this.mode === 'TALK') {
      this.startWatchdog();
      this.onVadStateChange?.(true);
      this.emitChange('TALK', reason, true);
    } else {
      this.clearWatchdog();
      this.onVadStateChange?.(false);
      this.emitChange('LISTEN', reason, false);
    }

    for (const listener of this.listeners) {
      try { listener(this.mode); } catch {}
    }
  }

  private emitChange(mode: PendulumMode, reason: string, vadPaused: boolean): void {
    this.eventBus?.emit('PENDULUM_STATE_CHANGED', {
      mode,
      reason,
      vadPaused,
      timestamp: new Date().toISOString(),
    });
    this.eventBus?.publishLiveEvent('swarm.pendulum.mode.changed', {
      mode,
      vadPaused,
      reason,
      timestamp: new Date().toISOString(),
    });
  }

  public startWatchdog(): void {
    this.clearWatchdog();
    this.watchdogTimer = setTimeout(() => {
      this.handleWatchdogTimeout();
    }, this.watchdogTimeoutMs);
  }

  public resetWatchdog(): void {
    if (this.mode === 'TALK') {
      this.startWatchdog();
    }
  }

  public clearWatchdog(): void {
    if (this.watchdogTimer) {
      clearTimeout(this.watchdogTimer);
      this.watchdogTimer = null;
    }
  }

  public handleWatchdogTimeout(): void {
    if (this.mode === 'TALK') {
      this.setMode('LISTEN', 'WATCHDOG_TIMEOUT');
    }
  }

  private subscribeToBus(): void {
    if (!this.eventBus) return;
    this.unsubscribe = this.eventBus.subscribe('*', (env) => {
      const type = env.type;
      const data = env.data as any;

      if (type === 'USER_COMMIT' || (type === 'swarm.session.text_delta' && data?.clientMessageId && data?.sourceRole === 'user')) {
        this.setMode('TALK', 'USER_COMMIT');
      } else if (type === 'swarm.live.session.disconnected' || type === 'swarm.live.session.error') {
        this.setMode('LISTEN', 'SOCKET_ERROR');
      } else if (type === 'swarm.live.stream.audio' && data?.sourceRole !== 'user') {
        this.resetWatchdog();
      } else if (type === 'swarm.session.turn.completed' || (type === 'swarm.live.turn.complete' && data?.source !== 'vad' && data?.source !== 'user')) {
        this.setMode('LISTEN', 'TURN_COMPLETED');
      }
    });
  }

  public subscribe(fn: (mode: PendulumMode) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  public dispose(): void {
    this.clearWatchdog();
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = undefined;
    }
    this.listeners.clear();
  }
}
