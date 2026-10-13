import fs from 'node:fs';
import path from 'node:path';

export interface TransientDiagnosticEntry {
  id: string;
  type: string;
  timestamp: string;
  data: Record<string, any>;
  pcmAudioRef?: {
    durationMs: number;
    sampleRate: number;
    hasAudio: boolean;
    byteLength?: number;
  };
}

export class TransientRingBuffer {
  private capacity: number;
  private entries: TransientDiagnosticEntry[] = [];

  constructor(capacity = 5) {
    this.capacity = capacity;
  }

  public push(entry: TransientDiagnosticEntry): void {
    if (this.entries.length >= this.capacity) {
      this.entries.shift(); // FIFO: skriv över äldsta händelse
    }
    this.entries.push(entry);
  }

  public flush(): void {
    this.entries = [];
  }

  public getEntries(): TransientDiagnosticEntry[] {
    return [...this.entries];
  }

  public size(): number {
    return this.entries.length;
  }

  public getCapacity(): number {
    return this.capacity;
  }

  public snapshot() {
    return {
      capacity: this.capacity,
      count: this.entries.length,
      timestamp: new Date().toISOString(),
      entries: this.getEntries(),
    };
  }

  public writeCrashDump(customDir?: string): string {
    const dumpData = this.snapshot();
    const targetDir = customDir || path.join(process.cwd(), 'doc', 'LAST_CYCLE');
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const filePath = path.join(targetDir, 'CRASH_DUMP.json');
    fs.writeFileSync(filePath, JSON.stringify(dumpData, null, 2), 'utf8');
    return filePath;
  }
}
