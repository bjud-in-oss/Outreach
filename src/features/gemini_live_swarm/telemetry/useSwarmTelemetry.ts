import { useState, useEffect, useRef, useCallback } from 'react';
import { SwarmEventBus, getGlobalSwarmEventBus } from '../bus/swarmEventBus.ts';
import {
  SwarmTelemetrySnapshot,
  AgentTelemetryMetric,
  SwarmTelemetrySnapshotSchema,
  AudioOutputState,
  AudioOutputStateSchema,
  detectUnitInvocation,
  AudioTriggerReason,
} from './telemetrySchema.ts';
import { EventEnvelope } from '../../../shared/contracts/envelope.ts';
import {
  RECONCILIATION_UNITS,
  ReconciliationForce,
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

  // Tyst röstspärr aktiv som standard under flerstegskörningar (TCK-011)
  const initialAudioOutput: AudioOutputState = {
    isMuted: true,
    triggerReason: 'DEFAULT_SILENCE',
    lastChangedAt: new Date().toISOString(),
  };

  const [snapshot, setSnapshot] = useState<SwarmTelemetrySnapshot>({
    activeAgentsCount: 4,
    totalEventsCount: 0,
    eventsPerMinute: 0,
    agentMetrics: initialAgentMetrics,
    recentEnvelopes: [],
    healthStatus: 'HEALTHY',
    lastPulseAt: new Date().toISOString(),
    serialExecution: undefined,
    audioOutput: initialAudioOutput,
  });

  const eventTimestampsRef = useRef<number[]>([]);

  useEffect(() => {
    // Ladda befintlig historik
    const history = bus.getHistory();
    if (history.length > 0) {
      // Hitta senast kända ljudstatus i historiken
      let knownAudioState: AudioOutputState | undefined;
      for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].type === 'swarm.audio.state.changed') {
          try {
            knownAudioState = AudioOutputStateSchema.parse(history[i].data);
            break;
          } catch {
            // ignorera
          }
        }
      }

      setSnapshot((prev) => ({
        ...prev,
        totalEventsCount: history.length,
        recentEnvelopes: history.slice(-20).reverse(),
        audioOutput: knownAudioState || prev.audioOutput,
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

        // 1. Matcha händelsekällor för försoningsenheterna
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

        // 2. Uppdatera seriell metrik vid swarm.serial.*-händelser
        let updatedSerialExecution = prev.serialExecution;
        let updatedAudioOutput = prev.audioOutput || initialAudioOutput;

        if (envelope.type.startsWith('swarm.serial.') && envelope.data) {
          try {
            updatedSerialExecution = envelope.data as any;

            // Om Token Gate nås (Steg 3c eller status GATED): Aktivera ljudkanalen för Att försonas (ensam agent)
            const isAtTokenGate =
              updatedSerialExecution?.currentStage === '3c_spec' ||
              updatedSerialExecution?.stageStatus === 'GATED' ||
              updatedSerialExecution?.isTokenGated === true;

            if (isAtTokenGate && updatedAudioOutput.isMuted) {
              const tokenGateAudio: AudioOutputState = {
                isMuted: false,
                activeSpeakerUnitId: 'unit-seriell-motor',
                activeForce: 'SERIELL_MOTOR',
                triggerReason: 'TOKEN_GATE',
                lastChangedAt: new Date().toISOString(),
              };
              updatedAudioOutput = tokenGateAudio;
              // Publicera asynkront utanför react reducer
              setTimeout(() => {
                bus.publishAudioState(tokenGateAudio);
              }, 0);
            }
          } catch {
            // ignorera formatfel
          }
        }

        // 3. Lyssna på direkta ljudstatusändringar
        if (envelope.type === 'swarm.audio.state.changed' && envelope.data) {
          try {
            updatedAudioOutput = AudioOutputStateSchema.parse(envelope.data);
          } catch {
            // ignorera
          }
        }

        // 4. Skanna inkommande text och rösttranskribering efter namnanrop (TCK-011)
        if (
          (envelope.type === 'swarm.live.stream.text' ||
            envelope.type === 'swarm.live.stream.transcription') &&
          envelope.data
        ) {
          const rawData = envelope.data as any;
          if (rawData.sourceRole === 'user' || rawData.transcription || rawData.textChunk) {
            const textToScan = rawData.transcription || rawData.textChunk || '';
            const invocation = detectUnitInvocation(textToScan);
            if (invocation && (updatedAudioOutput.isMuted || updatedAudioOutput.activeSpeakerUnitId !== invocation.unitId)) {
              const invokedAudio: AudioOutputState = {
                isMuted: false,
                activeSpeakerUnitId: invocation.unitId,
                activeForce: invocation.force,
                triggerReason: 'NAME_INVOCATION',
                lastChangedAt: new Date().toISOString(),
              };
              updatedAudioOutput = invokedAudio;
              setTimeout(() => {
                bus.publishAudioState(invokedAudio);
              }, 0);
            }
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
          audioOutput: updatedAudioOutput,
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

  const toggleManualMute = useCallback(() => {
    setSnapshot((prev) => {
      const currentAudio = prev.audioOutput || initialAudioOutput;
      const nextMuted = !currentAudio.isMuted;
      const newAudioState: AudioOutputState = {
        isMuted: nextMuted,
        activeSpeakerUnitId: nextMuted ? undefined : 'unit-seriell-motor',
        activeForce: nextMuted ? undefined : 'SERIELL_MOTOR',
        triggerReason: nextMuted ? 'DEFAULT_SILENCE' : 'MANUAL_UNMUTE',
        lastChangedAt: new Date().toISOString(),
      };

      bus.publishAudioState(newAudioState);

      return {
        ...prev,
        audioOutput: newAudioState,
      };
    });
  }, [bus]);

  const triggerInvocation = useCallback(
    (inputText: string) => {
      const match = detectUnitInvocation(inputText);
      if (match) {
        const audioState: AudioOutputState = {
          isMuted: false,
          activeSpeakerUnitId: match.unitId,
          activeForce: match.force,
          triggerReason: 'NAME_INVOCATION',
          lastChangedAt: new Date().toISOString(),
        };
        bus.publishAudioState(audioState);
        setSnapshot((prev) => ({
          ...prev,
          audioOutput: audioState,
        }));
        return true;
      }
      return false;
    },
    [bus]
  );

  return {
    snapshot,
    eventBus: bus,
    toggleManualMute,
    triggerInvocation,
  };
}
