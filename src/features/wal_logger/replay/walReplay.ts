import { WalEngine } from '../engine/walEngine.ts';
import { WalEntry } from '../contracts/walSchema.ts';

export interface ReplayResult {
  replayedCount: number;
  failedCount: number;
  errors: string[];
}

export class WalReplayer {
  constructor(private engine: WalEngine) {}

  /**
   * Återspelar alla PENDING-poster sekventiellt för att garantera resiliens vid omladdning
   */
  public async replayUncommittedEntries(
    handler: (entry: WalEntry) => Promise<void>
  ): Promise<ReplayResult> {
    const pendingEntries = this.engine.getUncommittedEntries();
    let replayedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const entry of pendingEntries) {
      try {
        await handler(entry);
        await this.engine.commitWalEntry(entry.sequenceNumber);
        replayedCount++;
      } catch (err) {
        failedCount++;
        const errMsg = err instanceof Error ? err.message : String(err);
        errors.push(`Kunde inte återspela post #${entry.sequenceNumber}: ${errMsg}`);
        await this.engine.failWalEntry(entry.sequenceNumber, errMsg);
      }
    }

    return {
      replayedCount,
      failedCount,
      errors,
    };
  }
}
