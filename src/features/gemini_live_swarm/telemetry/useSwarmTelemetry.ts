import { useState, useEffect, useRef } from 'react';
import { SwarmEventBus, getGlobalSwarmEventBus } from '../bus/swarmEventBus.ts';
import {
  SwarmTelemetrySnapshot,
  AgentTelemetryMetric,
  SwarmTelemetrySnapshotSchema,
} from './telemetrySchema.ts';
import { EventEnvelope } from '../../../shared/contracts/envelope.ts';
import {
  DEFAULT_SWARM_ROLES,
  SwarmAgentRole,
  getActiveAgentKrafter,
  getSerialMotorAgent,
} from '../agents/roleDefinitions.ts';

export function useSwarmTelemetry(eventBus?: SwarmEventBus) {
  const bus = eventBus || getGlobalSwarmEventBus();

  // Initiera mätvärden för de 3 aktiva krafterna samt seriell motor
  const initialAgentMetrics: Record<string, AgentTelemetryMetric> = {};
  const primaryAgents = [...getActiveAgentKrafter(), getSerialMotorAgent()];

  for (const agent of primaryAgents) {
    initialAgentMetrics[agent.id] = {
      agentId: agent.id,
      role: agent.role,
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
    activeEngine: 'KRAFTER_TRIAD',
  });

  const eventTimestampsRef = useRef<number[]>([]);

  useEffect(() => {
    // Ladda befintlig historik
    const history = bus.getHistory();
    if (history.length > 0) {
      setSnapshot((prev) => ({
        ...prev,
        totalEventsCount: history.length,
        recentEnvelopes: history.slice(-30).reverse(),
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

        // Matchning av källa mot krafter eller seriell motor
        let targetAgentId: string | null = null;
        const sourceLower = envelope.source.toLowerCase();

        if (sourceLower.includes('att_forlikas') || sourceLower.includes('orchestrator')) {
          targetAgentId = DEFAULT_SWARM_ROLES.ATT_FORLIKAS.id;
        } else if (sourceLower.includes('att_folja') || sourceLower.includes('researcher') || sourceLower.includes('writer')) {
          targetAgentId = DEFAULT_SWARM_ROLES.ATT_FOLJA.id;
        } else if (sourceLower.includes('att_vanda_om') || sourceLower.includes('critic')) {
          targetAgentId = DEFAULT_SWARM_ROLES.ATT_VANDA_OM.id;
        } else if (sourceLower.includes('seriell_motor')) {
          targetAgentId = DEFAULT_SWARM_ROLES.SERIELL_MOTOR.id;
        }

        if (targetAgentId && updatedMetrics[targetAgentId]) {
          const current = updatedMetrics[targetAgentId];
          const isThinking =
            envelope.type.includes('thinking') ||
            envelope.type.includes('started') ||
            envelope.type.includes('running');
          const isDone = envelope.type.includes('completed') || envelope.type.includes('verified');
          const isError = envelope.type.includes('failed') || envelope.type.includes('error');

          const dataObj = envelope.data as Record<string, any> | undefined;
          const extractedThought =
            dataObj?.thought ||
            dataObj?.summary ||
            dataObj?.stepOutput ||
            (dataObj?.phase ? `Exekverar Fas ${dataObj.phase}` : undefined);

          updatedMetrics[targetAgentId] = {
            ...current,
            status: isError ? 'ERROR' : isThinking ? 'THINKING' : isDone ? 'DONE' : current.status,
            lastThought: extractedThought || current.lastThought,
            lastActive: envelope.time,
            totalEventsEmitted: current.totalEventsEmitted + 1,
            phase: dataObj?.phase || current.phase,
          };
        }

        const newRecent = [envelope, ...prev.recentEnvelopes].slice(0, 35);
        const isSeriell = envelope.type.includes('seriell_motor');

        const newSnapshot: SwarmTelemetrySnapshot = {
          activeAgentsCount: Object.values(updatedMetrics).filter((a) => a.status !== 'ERROR').length,
          totalEventsCount: prev.totalEventsCount + 1,
          eventsPerMinute: epm,
          agentMetrics: updatedMetrics,
          recentEnvelopes: newRecent,
          healthStatus: 'HEALTHY',
          lastPulseAt: new Date().toISOString(),
          activeEngine: isSeriell ? 'SERIELL_MOTOR' : prev.activeEngine,
        };

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
    clearHistory: () => bus.clear(),
  };
}
