export interface AudioWorkerMessage {
  type: 'PUSH' | 'CLEAR' | 'GAIN';
  channel?: string;
  samples?: Int16Array;
  gain?: number;
}

const WORKER_INLINE_SCRIPT = [
  'const { parentPort } = require("node:worker_threads");',
  'parentPort?.on("message", (msg) => {',
  '  if (msg.type === "PUSH") {',
  '    parentPort.postMessage({ type: "ACK_PUSH", count: msg.samples?.length || 0 });',
  '  } else if (msg.type === "CLEAR") {',
  '    parentPort.postMessage({ type: "ACK_CLEAR" });',
  '  }',
  '});',
].join('\n');

export class AudioWorkerManager {
  private worker: any = null;
  private isSupported = false;

  constructor() {
    this.initWorker();
  }

  private initWorker(): void {
    if (typeof window !== 'undefined') return;
    try {
      const wt = (globalThis as any).process?.versions?.node
        ? (eval('require')('node:worker_threads'))
        : null;
      if (wt?.Worker) {
        this.worker = new wt.Worker(WORKER_INLINE_SCRIPT, { eval: true });
        try { this.worker.unref?.(); } catch {}
        this.isSupported = true;
      }
    } catch {
      this.isSupported = false;
    }
  }

  public isWorkerActive(): boolean {
    return this.isSupported && this.worker !== null;
  }

  public flush(): void {
    if (this.worker) {
      try { this.worker.postMessage({ type: 'CLEAR' }); } catch {}
    }
  }

  public postMessage(msg: AudioWorkerMessage): void {
    if (this.worker) this.worker.postMessage(msg);
  }

  public terminate(): void {
    if (this.worker) {
      try { this.worker.terminate(); } catch {}
      this.worker = null;
    }
  }
}

export const audioWorker = new AudioWorkerManager();
