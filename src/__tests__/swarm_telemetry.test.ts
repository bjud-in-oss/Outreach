import { SwarmEventBus } from '../features/gemini_live_swarm/bus/swarmEventBus.ts';
import {
  SwarmTelemetrySnapshotSchema,
  DevelopmentTicketSchema,
} from '../features/gemini_live_swarm/telemetry/telemetrySchema.ts';
import { EventEnvelope } from '../shared/contracts/envelope.ts';

export async function runSwarmTelemetryTests() {
  const results: Array<{ name: string; passed: boolean; error?: string }> = [];

  // Test 1: SwarmEventBus publish & subscribe med wildcard
  try {
    const bus = new SwarmEventBus(10);
    const received: EventEnvelope[] = [];

    const unsubscribe = bus.subscribe('swarm.*', (evt) => {
      received.push(evt);
    });

    const env1: EventEnvelope = {
      id: 'evt-test-1',
      source: 'outreach/swarm/researcher',
      type: 'swarm.agent.thinking',
      specversion: '1.0',
      datacontenttype: 'application/json',
      time: new Date().toISOString(),
      data: { agent: 'RESEARCHER', thought: 'Analyzing audience' },
    };

    const env2: EventEnvelope = {
      id: 'evt-test-2',
      source: 'outreach/drive',
      type: 'drive.file.created',
      specversion: '1.0',
      datacontenttype: 'application/json',
      time: new Date().toISOString(),
      data: { file: 'doc.md' },
    };

    bus.publish(env1);
    bus.publish(env2); // ska inte fångas av swarm.*

    if (received.length === 1 && received[0].id === 'evt-test-1') {
      results.push({ name: 'SwarmEventBus wildcard subscription filters correctly', passed: true });
    } else {
      results.push({
        name: 'SwarmEventBus wildcard subscription filters correctly',
        passed: false,
        error: `Expected 1 event, got ${received.length}`,
      });
    }

    unsubscribe();
  } catch (err: any) {
    results.push({
      name: 'SwarmEventBus wildcard subscription filters correctly',
      passed: false,
      error: err.message,
    });
  }

  // Test 2: SwarmEventBus unsubscription förhindrar minnesläckor
  try {
    const bus = new SwarmEventBus(10);
    let count = 0;

    const unsub = bus.subscribe('*', () => {
      count++;
    });

    bus.publish({
      id: 'e-1',
      source: 'test',
      type: 'test.event',
      specversion: '1.0',
      datacontenttype: 'application/json',
      time: new Date().toISOString(),
      data: {},
    });

    unsub();

    bus.publish({
      id: 'e-2',
      source: 'test',
      type: 'test.event',
      specversion: '1.0',
      datacontenttype: 'application/json',
      time: new Date().toISOString(),
      data: {},
    });

    if (count === 1) {
      results.push({ name: 'SwarmEventBus unsubscribe cleanly removes handler', passed: true });
    } else {
      results.push({
        name: 'SwarmEventBus unsubscribe cleanly removes handler',
        passed: false,
        error: `Expected count 1 after unsubscribe, got ${count}`,
      });
    }
  } catch (err: any) {
    results.push({
      name: 'SwarmEventBus unsubscribe cleanly removes handler',
      passed: false,
      error: err.message,
    });
  }

  // Test 3: SwarmEventBus ringbuffert begränsar historiken deterministiskt
  try {
    const limit = 5;
    const bus = new SwarmEventBus(limit);

    for (let i = 0; i < 10; i++) {
      bus.publish({
        id: `seq-${i}`,
        source: 'test',
        type: 'test.metric',
        specversion: '1.0',
        datacontenttype: 'application/json',
        time: new Date().toISOString(),
        data: { index: i },
      });
    }

    const history = bus.getHistory();
    if (history.length === limit && history[0].id === 'seq-5' && history[4].id === 'seq-9') {
      results.push({ name: 'SwarmEventBus FIFO ring buffer limits capacity strictly', passed: true });
    } else {
      results.push({
        name: 'SwarmEventBus FIFO ring buffer limits capacity strictly',
        passed: false,
        error: `Expected capacity ${limit} with seq-5..seq-9, got len=${history.length}`,
      });
    }
  } catch (err: any) {
    results.push({
      name: 'SwarmEventBus FIFO ring buffer limits capacity strictly',
      passed: false,
      error: err.message,
    });
  }

  // Test 4: Zod TelemetrySnapshotSchema validerar ett giltigt tillstånd
  try {
    const validSnapshot = {
      activeAgentsCount: 4,
      totalEventsCount: 42,
      eventsPerMinute: 12.5,
      agentMetrics: {
        'agent-orchestrator': {
          agentId: 'agent-orchestrator',
          role: 'ORCHESTRATOR',
          status: 'IDLE',
          lastThought: 'Väntar på uppdrag',
          lastActive: new Date().toISOString(),
          totalEventsEmitted: 10,
          averageLatencyMs: 120,
        },
      },
      recentEnvelopes: [],
      healthStatus: 'HEALTHY',
      lastPulseAt: new Date().toISOString(),
    };

    SwarmTelemetrySnapshotSchema.parse(validSnapshot);
    results.push({ name: 'SwarmTelemetrySnapshotSchema validates valid snapshot', passed: true });
  } catch (err: any) {
    results.push({
      name: 'SwarmTelemetrySnapshotSchema validates valid snapshot',
      passed: false,
      error: err.message,
    });
  }

  // Test 5: Zod DevelopmentTicketSchema validerar styrkortsmilstenar
  try {
    const validTicket = {
      id: 'TCK-002',
      title: 'Swarm Telemetry & Reactive Status',
      status: 'AKTIV',
      phase: 'Fas 2: Verkställande',
      progressPercentage: 75,
      deliverables: ['SwarmEventBus', 'TelemetrySidebar', 'MasterDevelopmentPlan'],
      tokenHash: 'SWARM-TELEMETRY-TCK002-TOKEN',
      verifiedReceiptHash: '1e9e1478',
    };

    DevelopmentTicketSchema.parse(validTicket);
    results.push({ name: 'DevelopmentTicketSchema validates roadmap tickets', passed: true });
  } catch (err: any) {
    results.push({
      name: 'DevelopmentTicketSchema validates roadmap tickets',
      passed: false,
      error: err.message,
    });
  }

  return results;
}
