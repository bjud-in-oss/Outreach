import { describe, it, expect, beforeEach } from 'vitest';
import { WalEngine } from '../engine/walEngine';
import { WalReplayer } from '../replay/walReplay';
import { EventEnvelope } from '../../../shared/contracts/envelope';

describe('TCK-058 WalLogger Regression & Summary Tests', () => {
  let engine: WalEngine;
  let replayer: WalReplayer;

  beforeEach(() => {
    engine = new WalEngine();
    replayer = new WalReplayer(engine);
  });

  const createMockEnvelope = (id: string, action: string): EventEnvelope => ({
    id,
    source: 'test/wal',
    type: 'wal.test.event',
    specversion: '1.0',
    datacontenttype: 'application/json',
    time: new Date().toISOString(),
    data: { action },
  });

  it('WalEngine.appendWalEntry creates valid record with hash and sequence', async () => {
    const envelope = createMockEnvelope('wal-evt-1', 'write_draft');
    const entry = await engine.appendWalEntry(envelope);

    expect(entry.sequenceNumber).toBe(1);
    expect(entry.status).toBe('PENDING');
    expect(entry.entryHash).toBeDefined();
    expect(entry.entryHash.length).toBeGreaterThan(0);
  });

  it('WalEngine.commitWalEntry updates record status to COMMITTED', async () => {
    const envelope = createMockEnvelope('wal-evt-1', 'write_draft');
    await engine.appendWalEntry(envelope);

    await engine.commitWalEntry(1);
    const history = engine.getWalHistory();

    expect(history[0].status).toBe('COMMITTED');
  });

  it('WalReplayer correctly discovers and replays uncommitted entries', async () => {
    const envelope1 = createMockEnvelope('wal-evt-1', 'task_1');
    const envelope2 = createMockEnvelope('wal-evt-2', 'task_2');

    await engine.appendWalEntry(envelope1); // seq 1, COMMITTED later
    await engine.appendWalEntry(envelope2); // seq 2, PENDING during replay

    await engine.commitWalEntry(1);

    const replayedSequences: number[] = [];
    const replayResult = await replayer.replayUncommittedEntries(async (entry) => {
      replayedSequences.push(entry.sequenceNumber);
    });

    expect(replayResult.replayedCount).toBe(1);
    expect(replayResult.failedCount).toBe(0);
    expect(replayedSequences).toEqual([2]);
    
    const history = engine.getWalHistory();
    const entry2 = history.find(e => e.sequenceNumber === 2);
    expect(entry2?.status).toBe('COMMITTED');
  });

  it('Engine.getWalSummary returns correct counts per status', async () => {
    const env1 = createMockEnvelope('e1', 'a1');
    const env2 = createMockEnvelope('e2', 'a2');
    const env3 = createMockEnvelope('e3', 'a3');

    await engine.appendWalEntry(env1); // seq 1: PENDING
    await engine.appendWalEntry(env2); // seq 2: PENDING
    await engine.appendWalEntry(env3); // seq 3: PENDING

    await engine.commitWalEntry(1); // seq 1: COMMITTED
    await engine.failWalEntry(2, 'Simulated failure'); // seq 2: FAILED

    // TS-kontrakt: getWalSummary() förväntas existera
    const summary = (engine as any).getWalSummary();

    expect(summary).toEqual({
      total: 3,
      pending: 1,
      committed: 1,
      failed: 1
    });
  });
});
