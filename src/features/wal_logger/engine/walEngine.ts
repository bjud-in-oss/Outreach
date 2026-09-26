import { EventEnvelope } from '../../../shared/contracts/envelope.ts';
import { WalEntry, WalEntrySchema } from '../contracts/walSchema.ts';

/**
 * Enkel SHA-256 / FNV-liknande hashfunktion för in-memory och webbläsarmiljö
 */
function computeHash(data: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < data.length; i++) {
    hash ^= data.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

export class WalEngine {
  private entries: WalEntry[] = [];
  private sequenceCounter = 0;
  private lastHash = '0000000000000000';

  /**
   * Append-only metod för att skriva händelse före sidoeffekter (Write-Ahead)
   */
  public async appendWalEntry(envelope: EventEnvelope): Promise<WalEntry> {
    this.sequenceCounter += 1;
    const seq = this.sequenceCounter;
    const timestamp = new Date().toISOString();
    const prevHash = this.lastHash;
    const payloadStr = JSON.stringify(envelope) + seq + prevHash + timestamp;
    const entryHash = computeHash(payloadStr);

    const record: WalEntry = {
      sequenceNumber: seq,
      entryHash,
      previousHash: prevHash,
      timestamp,
      status: 'PENDING',
      envelope,
    };

    // Strikt validering mot schemat innan append
    const validated = WalEntrySchema.parse(record);
    this.entries.push(validated);
    this.lastHash = entryHash;
    return validated;
  }

  /**
   * Markerar en WAL-post som COMMITTED efter framgångsrik extern sidoeffekt
   */
  public async commitWalEntry(sequenceNumber: number): Promise<void> {
    const entry = this.entries.find((e) => e.sequenceNumber === sequenceNumber);
    if (!entry) {
      throw new Error(`WAL post #${sequenceNumber} hittades inte`);
    }
    entry.status = 'COMMITTED';
  }

  /**
   * Markerar en WAL-post som FAILED med felmeddelande för Fail Fast-audit
   */
  public async failWalEntry(sequenceNumber: number, error: string): Promise<void> {
    const entry = this.entries.find((e) => e.sequenceNumber === sequenceNumber);
    if (!entry) {
      throw new Error(`WAL post #${sequenceNumber} hittades inte`);
    }
    entry.status = 'FAILED';
    entry.errorMessage = error;
  }

  /**
   * Returnerar kopia av hela WAL-historiken (senaste först eller äldsta först)
   */
  public getWalHistory(): WalEntry[] {
    return [...this.entries];
  }

  /**
   * Hämtar alla oavslutade (PENDING) poster för återstart (crash recovery)
   */
  public getUncommittedEntries(): WalEntry[] {
    return this.entries.filter((e) => e.status === 'PENDING');
  }

  /**
   * Rensar loggen (endast för tester och reset)
   */
  public reset(): void {
    this.entries = [];
    this.sequenceCounter = 0;
    this.lastHash = '0000000000000000';
  }
}
