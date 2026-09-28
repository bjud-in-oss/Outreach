import { SwarmEventBus } from '../features/gemini_live_swarm/bus/swarmEventBus.ts';
import {
  SwarmTelemetrySnapshotSchema,
  DevelopmentTicketSchema,
} from '../features/gemini_live_swarm/telemetry/telemetrySchema.ts';
import { EventEnvelope } from '../shared/contracts/envelope.ts';

export async function runTransientTCK002Tests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: Array<{ name: string; passed: boolean; error?: string }> = [];

  function assert(condition: boolean, msg: string) {
    if (!condition) throw new Error(msg);
  }

  // Test 1: SwarmEventBus wildcard prenumeration
  try {
    const bus = new SwarmEventBus(10);
    const received: EventEnvelope[] = [];

    const unsubscribe = bus.subscribe('swarm.*', (evt) => {
      received.push(evt);
    });

    const env1: EventEnvelope = {
      id: 'evt-test-1',
      source: 'outreach/swarm/att_folja',
      type: 'swarm.agent.thinking',
      specversion: '1.0',
      datacontenttype: 'application/json',
      time: new Date().toISOString(),
      data: { force: 'ATT_FOLJA', thought: 'Söker kontakt' },
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
    bus.publish(env2);

    assert(received.length === 1 && received[0].id === 'evt-test-1', 'Wildcard-filter misslyckades');
    unsubscribe();

    results.push({
      name: 'TCK-002: SwarmEventBus wildcard prenumeration filtrerar korrekt',
      passed: true,
    });
  } catch (err) {
    results.push({
      name: 'TCK-002: SwarmEventBus wildcard prenumeration filtrerar korrekt',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Test 2: FIFO ringbuffert kapacitetsbegränsning
  try {
    const bus = new SwarmEventBus(3);
    for (let i = 1; i <= 5; i++) {
      bus.publish({
        id: `evt-${i}`,
        source: 'outreach/test',
        type: 'swarm.test',
        specversion: '1.0',
        datacontenttype: 'application/json',
        time: new Date().toISOString(),
        data: { index: i },
      });
    }

    const history = bus.getHistory();
    assert(history.length === 3, `Förväntade 3 händelser, fick ${history.length}`);
    assert(history[0].id === 'evt-3', 'FIFO-ordning bruten');
    assert(history[2].id === 'evt-5', 'Senaste händelse saknas');

    results.push({
      name: 'TCK-002: SwarmEventBus FIFO ringbuffert begränsar kapacitet strikt',
      passed: true,
    });
  } catch (err) {
    results.push({
      name: 'TCK-002: SwarmEventBus FIFO ringbuffert begränsar kapacitet strikt',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Test 3: Zod-schemavalidering för Telemetri och Styrkort
  try {
    const validTicket = DevelopmentTicketSchema.parse({
      id: 'TCK-002',
      title: 'Swarm Telemetry & Reactive Status',
      status: 'VERIFIERAD',
      phase: 'Fas 2: Slutförd',
      progressPercentage: 100,
      deliverables: ['EventBus', 'Sidebar', 'Zod'],
      tokenHash: 'SWARM-TELEMETRY-TCK002-TOKEN',
    });

    assert(validTicket.id === 'TCK-002', 'Ticket ID ogiltigt');

    const validSnapshot = SwarmTelemetrySnapshotSchema.parse({
      activeAgentsCount: 4,
      totalEventsCount: 42,
      eventsPerMinute: 12,
      agentMetrics: {},
      recentEnvelopes: [],
      healthStatus: 'HEALTHY',
      lastPulseAt: new Date().toISOString(),
    });

    assert(validSnapshot.activeAgentsCount === 4, 'Snapshot enhetsantal ogiltigt');

    results.push({
      name: 'TCK-002: SwarmTelemetrySnapshot och DevelopmentTicket validerar Fail-Fast',
      passed: true,
    });
  } catch (err) {
    results.push({
      name: 'TCK-002: SwarmTelemetrySnapshot och DevelopmentTicket validerar Fail-Fast',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return results;
}
