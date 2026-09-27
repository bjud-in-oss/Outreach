import { useState, useEffect, useRef } from 'react';
import { SwarmEventBus, getGlobalSwarmEventBus } from '../bus/swarmEventBus.ts';
import {
  SwarmTelemetrySnapshot,
  AgentTelemetryMetric,
  SwarmTelemetrySnapshotSchema,
} from './telemetrySchema.ts';
import { EventEnvelope } from '../../../shared/contracts/envelope.ts';
import {
  RECONCILIATION_UNITS,
  ReconciliationForce,
  mapRoleToForce,
} from '../agents/roleDefinitions.ts';

export function useSwarmTelemetry(eventBus?: SwarmEventBus) {
  const bus = eventBus || getGlobalSwarmEventBus();

  // Initiera standardmätvärden för de exakt 4 försoningsenheterna
  const initialAgentMetrics: Record<string, AgentTelemetryMetric> = {};
  for (const forceKey of Object.keys(RECONCILIATION_UNITS) as ReconciliationForce[]) {
    const u = RECONCILIATION_UNITS[forceKey];
    if (!u) continue;
    initialAgentMetrics[u.id] = {
      agentId: u.id,
      force: u.force,
      role: u.force,
      displayName: u.displayName,
      reconciliationState: u.reconciliationState,
      status: 'IDLE',
      lastThought: undefined,
      lastActive: new Date().toISOString(),
      totalEventsEmitted: 0,
      averageLatencyMs: 0,
    };
  }

  const [snapshot, setSnapshot] = useState<SwarmTelemetrySnapshot>({
    activeAgentsCount: 4,
    totalEventsCount: 0,
    eventsPerMinute: 0,
    agentMetrics: initialAgentMetrics,
    recentEnvelopes: [],
    healthStatus: 'HEALTHY',
    lastPulseAt: new Date().toISOString(),
    serialExecution: undefined,
  });

  const eventTimestampsRef = useRef<number[]>([]);

  useEffect(() => {
    // Ladda befintlig historik
    const history = bus.getHistory();
    if (history.length > 0) {
      setSnapshot((prev) => ({
        ...prev,
        totalEventsCount: history.length,
        recentEnvelopes: history.slice(-20).reverse(),
      }));
    }

    // Prenumerera på alla händelser via wildcard
    const unsubscribe = bus.subscribe('*', (envelope: EventEnvelope) => {
      const now = Date.now();
      eventTimestampsRef.current.push(now);

      // Behåll endast händelser från senaste 60 sekunderna för throughput
      eventTimestampsRef.current = eventTimestampsRef.current.filter((t) => now - t <= 60000);
      const epm = eventTimestampsRef.current.length;

      setSnapshot((prev) => {
        const updatedMetrics = { ...prev.agentMetrics };

        // Matcha händelsekällor för försoningsenheterna och eventuella legacy-källor
        const match = envelope.source.match(
          /outreach\/swarm\/(att_folja|att_vanda_om|att_forlikas|seriell_motor|orchestrator|researcher|writer|critic|serial_motor)/i
        );

        if (match) {
          const rawSource = match[1].toLowerCase();
          let targetForce: ReconciliationForce = 'ATT_FOLJA';
          if (rawSource.includes('forlikas') || rawSource.includes('orchestrator')) {
            targetForce = 'ATT_FORLIKAS';
          } else if (rawSource.includes('vanda') || rawSource.includes('critic')) {
            targetForce = 'ATT_VANDA_OM';
          } else if (rawSource.includes('seriell') || rawSource.includes('serial')) {
            targetForce = 'SERIELL_MOTOR';
          } else {
            targetForce = 'ATT_FOLJA';
          }

          const unit = RECONCILIATION_UNITS[targetForce];
          if (unit && updatedMetrics[unit.id]) {
            const current = updatedMetrics[unit.id];
            const isThinking = envelope.type.includes('thinking') || envelope.type.includes('started');
            const isDone = envelope.type.includes('completed');

            updatedMetrics[unit.id] = {
              ...current,
              status: isThinking ? 'THINKING' : isDone ? 'DONE' : current.status,
              lastThought: (envelope.data as any)?.summary || (envelope.data as any)?.thought || current.lastThought,
              lastActive: envelope.time,
              totalEventsEmitted: current.totalEventsEmitted + 1,
            };
          }
        }

        // Uppdatera seriell metrik vid swarm.serial.*-händelser
        let updatedSerialExecution = prev.serialExecution;
        if (envelope.type.startsWith('swarm.serial.') && envelope.data) {
          try {
            updatedSerialExecution = envelope.data as any;
          } catch {
            // ignorera formatfel
          }
        }

        const newRecent = [envelope, ...prev.recentEnvelopes].slice(0, 30);

        const newSnapshot: SwarmTelemetrySnapshot = {
          activeAgentsCount: Object.values(updatedMetrics).filter((a) => a.status !== 'ERROR').length,
          totalEventsCount: prev.totalEventsCount + 1,
          eventsPerMinute: epm,
          agentMetrics: updatedMetrics,
          recentEnvelopes: newRecent,
          healthStatus: 'HEALTHY',
          lastPulseAt: new Date().toISOString(),
          serialExecution: updatedSerialExecution,
        };

        // Validera med Zod
        try {
          return SwarmTelemetrySnapshotSchema.parse(newSnapshot);
        } catch (validationErr) {
          console.warn('[Telemetry] Zod-valideringsvarning:', validationErr);
          return newSnapshot;
        }
      });
    });

    return () => {
      unsubscribe();
    };
  }, [bus]);

  return {
    snapshot,
    eventBus: bus,
  };
}
