import { SwarmEventBus } from '../../shared/bus/swarmEventBus.ts';
import { TransientRingBuffer, TransientDiagnosticEntry } from './engine/transientRingBuffer.ts';

export class WalUiTelemetryListener {
  private ringBuffer: TransientRingBuffer;
  private eventBus: SwarmEventBus;
  private unsubscribe?: () => void;
  private lastAudioTimestamp?: string;
  private lastAudioByteLength = 0;

  constructor(eventBus: SwarmEventBus, capacity = 5) {
    this.eventBus = eventBus;
    this.ringBuffer = new TransientRingBuffer(capacity);
    this.initListeners();
  }

  private isRestore(type: string, data: any): boolean {
    if (type === 'swarm.session.restore') return true;
    if (type === 'wal.buffer.flush') return true;
    return type === 'UI_STATE_CHANGED' && (data.element === 'wal_restore' || data.action === 'restore');
  }

  private isMonitored(type: string): boolean {
    return (
      type === 'UI_STATE_CHANGED' ||
      type === 'MUTEX_TOGGLED' ||
      type === 'SESSION_CONFIG_UPDATED' ||
      type === 'swarm.session.text_delta' ||
      type === 'PENDULUM_STATE_CHANGED' ||
      type === 'swarm.pendulum.mode.changed' ||
      type === 'USER_COMMIT'
    );
  }

  private pushEntry(env: any, type: string, data: any): void {
    const entry: TransientDiagnosticEntry = {
      id: env.id || `diag-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      type,
      timestamp: env.time || new Date().toISOString(),
      data,
      pcmAudioRef: {
        durationMs: 3000,
        sampleRate: 16000,
        hasAudio: Boolean(this.lastAudioTimestamp),
        byteLength: this.lastAudioByteLength,
      },
    };
    this.ringBuffer.push(entry);
  }

  private handleEvent(env: any): void {
    const type = env.type;
    const data = (env.data as any) || {};

    if (type === 'swarm.live.stream.audio') {
      this.lastAudioTimestamp = env.time;
      this.lastAudioByteLength = data.byteLength || 0;
    }

    if (this.isRestore(type, data)) {
      this.flush();
      return;
    }

    if (this.isMonitored(type)) {
      this.pushEntry(env, type, data);
    }
  }

  private initListeners(): void {
    this.unsubscribe = this.eventBus.subscribe('*', (env) => {
      this.handleEvent(env);
    });
  }

  public flush(): void {
    this.ringBuffer.flush();
    this.lastAudioTimestamp = undefined;
    this.lastAudioByteLength = 0;
  }

  public getBuffer(): TransientRingBuffer {
    return this.ringBuffer;
  }

  public getEntries(): TransientDiagnosticEntry[] {
    return this.ringBuffer.getEntries();
  }

  public writeCrashDump(customDir?: string): string {
    return this.ringBuffer.writeCrashDump(customDir);
  }

  public dispose(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = undefined;
    }
    this.ringBuffer.flush();
  }
}
