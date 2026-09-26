import { WalEngine } from '../features/wal_logger/engine/walEngine.ts';
import { WalReplayer } from '../features/wal_logger/replay/walReplay.ts';
import { EventEnvelope } from '../shared/contracts/envelope.ts';

export async function runWalTests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results = [];
  const engine = new WalEngine();

  // Test 1: Append entry genererar sekvensnummer och beräknar hash
  try {
    const envelope: EventEnvelope = {
      id: 'wal-evt-1',
      source: 'test/wal',
      type: 'wal.test.created',
      specversion: '1.0',
      datacontenttype: 'application/json',
      time: new Date().toISOString(),
      data: { action: 'write_draft' },
    };

    const entry = await engine.appendWalEntry(envelope);
    const passed = entry.sequenceNumber === 1 && entry.status === 'PENDING' && Boolean(entry.entryHash);
    results.push({ name: 'WAL append entry creates valid record with hash and sequence', passed });
  } catch (err) {
    results.push({ name: 'WAL append entry creates valid record with hash and sequence', passed: false, error: String(err) });
  }

  // Test 2: Commit ändrar status till COMMITTED
  try {
    await engine.commitWalEntry(1);
    const history = engine.getWalHistory();
    const passed = history[0].status === 'COMMITTED';
    results.push({ name: 'WAL commit updates record status to COMMITTED', passed });
  } catch (err) {
    results.push({ name: 'WAL commit updates record status to COMMITTED', passed: false, error: String(err) });
  }

  // Test 3: Replay uncommitted identifierar oavslutade transaktioner
  try {
    const envelope2: EventEnvelope = {
      id: 'wal-evt-2',
      source: 'test/wal',
      type: 'wal.test.crash',
      specversion: '1.0',
      datacontenttype: 'application/json',
      time: new Date().toISOString(),
      data: { action: 'pending_task' },
    };
    await engine.appendWalEntry(envelope2); // sequence 2, pending

    const replayer = new WalReplayer(engine);
    const replayedSequences: number[] = [];
    const replayResult = await replayer.replayUncommittedEntries(async (entry) => {
      replayedSequences.push(entry.sequenceNumber);
    });

    const passed = replayResult.replayedCount === 1 && replayedSequences[0] === 2;
    results.push({ name: 'WAL replayer correctly discovers and replays uncommitted entries', passed });
  } catch (err) {
    results.push({ name: 'WAL replayer correctly discovers and replays uncommitted entries', passed: false, error: String(err) });
  }

  return results;
}
