import { useState, useEffect, useRef } from 'react';
import { SwarmEventBus, getGlobalSwarmEventBus } from '../bus/swarmEventBus.ts';
import {
  SwarmTelemetrySnapshot,
  AgentTelemetryMetric,
  SwarmTelemetrySnapshotSchema,
} from './telemetrySchema.ts';
import { EventEnvelope } from '../../../shared/contracts/envelope.ts';
import { DEFAULT_SWARM_ROLES, SwarmAgentRole } from '../agents/roleDefinitions.ts';

export function useSwarmTelemetry(eventBus?: SwarmEventBus) {
  const bus = eventBus || getGlobalSwarmEventBus();

  // Initiera standardmätvärden för standardrollerna
  const initialAgentMetrics: Record<string, AgentTelemetryMetric> = {};
  for (const roleKey of Object.keys(DEFAULT_SWARM_ROLES) as SwarmAgentRole[]) {
    const r = DEFAULT_SWARM_ROLES[roleKey];
    initialAgentMetrics[r.id] = {
      agentId: r.id,
      role: r.role,
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

        // Om händelsen kommer från en agent, uppdatera dess mätvärde
        const roleMatch = envelope.source.match(/outreach\/swarm\/(orchestrator|researcher|writer|critic)/i);
        if (roleMatch) {
          const roleKey = roleMatch[1].toUpperCase() as SwarmAgentRole;
          const agentId = DEFAULT_SWARM_ROLES[roleKey]?.id;
          if (agentId && updatedMetrics[agentId]) {
            const current = updatedMetrics[agentId];
            const isThinking = envelope.type.includes('thinking') || envelope.type.includes('started');
            const isDone = envelope.type.includes('completed');

            updatedMetrics[agentId] = {
              ...current,
              status: isThinking ? 'THINKING' : isDone ? 'DONE' : current.status,
              lastThought: (envelope.data as any)?.summary || (envelope.data as any)?.thought || current.lastThought,
              lastActive: envelope.time,
              totalEventsEmitted: current.totalEventsEmitted + 1,
            };
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
