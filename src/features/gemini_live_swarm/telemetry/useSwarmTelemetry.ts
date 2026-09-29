import { useState, useEffect, useRef, useCallback } from 'react';
import { SwarmEventBus, getGlobalSwarmEventBus } from '../bus/swarmEventBus.ts';
import {
  SwarmTelemetrySnapshot,
  AgentTelemetryMetric,
  SwarmTelemetrySnapshotSchema,
  AudioOutputState,
  AudioOutputStateSchema,
  detectUnitInvocation,
} from './telemetrySchema.ts';
import { EventEnvelope } from '../../../shared/contracts/envelope.ts';
import { RECONCILIATION_UNITS, ReconciliationForce } from '../agents/roleDefinitions.ts';

const initialAudioOutput: AudioOutputState = {
  isMuted: true,
  triggerReason: 'DEFAULT_SILENCE',
  lastChangedAt: new Date().toISOString(),
};

function createInitialMetrics(): Record<string, AgentTelemetryMetric> {
  const metrics: Record<string, AgentTelemetryMetric> = {};
  for (const forceKey of Object.keys(RECONCILIATION_UNITS) as ReconciliationForce[]) {
    const u = RECONCILIATION_UNITS[forceKey];
    if (!u) continue;
    metrics[u.id] = {
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
  return metrics;
}

function findKnownAudioState(history: EventEnvelope[]): AudioOutputState | undefined {
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].type !== 'swarm.audio.state.changed') continue;
    try {
      return AudioOutputStateSchema.parse(history[i].data);
    } catch {
      // Ignorera
    }
  }
  return undefined;
}

function handleTokenGateAudio(envelope: EventEnvelope, audioRef: React.MutableRefObject<AudioOutputState>, bus: SwarmEventBus) {
  if (!envelope.type.startsWith('swarm.serial.') || !envelope.data) return;
  const serial = envelope.data as any;
  const isGated = serial?.currentStage === '3c_spec' || serial?.stageStatus === 'GATED' || serial?.isTokenGated;
  if (!isGated || !audioRef.current.isMuted) return;

  const tokenAudio: AudioOutputState = {
    isMuted: false,
    activeSpeakerUnitId: 'unit-seriell-motor',
    activeForce: 'SERIELL_MOTOR',
    triggerReason: 'TOKEN_GATE',
    lastChangedAt: new Date().toISOString(),
  };
  audioRef.current = tokenAudio;
  bus.publishAudioState(tokenAudio);
}

function handleInvocationAudio(envelope: EventEnvelope, audioRef: React.MutableRefObject<AudioOutputState>, bus: SwarmEventBus) {
  const isStream = envelope.type === 'swarm.live.stream.text' || envelope.type === 'swarm.live.stream.transcription';
  if (!isStream || !envelope.data) return;
  const raw = envelope.data as any;
  const text = raw.transcription || raw.textChunk || '';
  const inv = detectUnitInvocation(text);
  if (!inv) return;
  if (!audioRef.current.isMuted && audioRef.current.activeSpeakerUnitId === inv.unitId) return;

  const invAudio: AudioOutputState = {
    isMuted: false,
    activeSpeakerUnitId: inv.unitId,
    activeForce: inv.force,
    triggerReason: 'NAME_INVOCATION',
    lastChangedAt: new Date().toISOString(),
  };
  audioRef.current = invAudio;
  bus.publishAudioState(invAudio);
}

function handleAudioStateChanged(envelope: EventEnvelope, audioRef: React.MutableRefObject<AudioOutputState>) {
  if (envelope.type !== 'swarm.audio.state.changed' || !envelope.data) return;
  try {
    audioRef.current = AudioOutputStateSchema.parse(envelope.data);
  } catch {
    // Ignorera
  }
}

function updateAgentMetrics(
  prevMetrics: Record<string, AgentTelemetryMetric>,
  envelope: EventEnvelope
): Record<string, AgentTelemetryMetric> {
  const match = envelope.source.match(/outreach\/swarm\/(att_folja|att_vanda_om|att_forlikas|seriell_motor|orchestrator|researcher|writer|critic|serial_motor)/i);
  if (!match) return prevMetrics;

  const rawSource = match[1].toLowerCase();
  let targetForce: ReconciliationForce = 'ATT_FOLJA';
  if (rawSource.includes('forlikas') || rawSource.includes('orchestrator')) targetForce = 'ATT_FORLIKAS';
  else if (rawSource.includes('vanda') || rawSource.includes('critic')) targetForce = 'ATT_VANDA_OM';
  else if (rawSource.includes('seriell') || rawSource.includes('serial')) targetForce = 'SERIELL_MOTOR';

  const unit = RECONCILIATION_UNITS[targetForce];
  if (!unit || !prevMetrics[unit.id]) return prevMetrics;

  const current = prevMetrics[unit.id];
  const isThinking = envelope.type.includes('thinking') || envelope.type.includes('started');
  const isDone = envelope.type.includes('completed');
  return {
    ...prevMetrics,
    [unit.id]: {
      ...current,
      status: isThinking ? 'THINKING' : isDone ? 'DONE' : current.status,
      lastThought: (envelope.data as any)?.summary || (envelope.data as any)?.thought || current.lastThought,
      lastActive: envelope.time,
      totalEventsEmitted: current.totalEventsEmitted + 1,
    },
  };
}

function reduceSnapshot(
  prev: SwarmTelemetrySnapshot,
  envelope: EventEnvelope,
  epm: number,
  audioOutput: AudioOutputState
): SwarmTelemetrySnapshot {
  const updatedMetrics = updateAgentMetrics(prev.agentMetrics, envelope);
  const newSnapshot: SwarmTelemetrySnapshot = {
    activeAgentsCount: Object.values(updatedMetrics).filter((a) => a.status !== 'ERROR').length,
    totalEventsCount: prev.totalEventsCount + 1,
    eventsPerMinute: epm,
    agentMetrics: updatedMetrics,
    recentEnvelopes: [envelope, ...prev.recentEnvelopes].slice(0, 30),
    healthStatus: 'HEALTHY',
    lastPulseAt: new Date().toISOString(),
    serialExecution: envelope.type.startsWith('swarm.serial.') && envelope.data ? (envelope.data as any) : prev.serialExecution,
    audioOutput,
  };

  try {
    return SwarmTelemetrySnapshotSchema.parse(newSnapshot);
  } catch {
    return newSnapshot;
  }
}

export function useSwarmTelemetry(eventBus?: SwarmEventBus | null) {
  const bus = eventBus === null ? null : (eventBus || getGlobalSwarmEventBus());
  const eventTimestampsRef = useRef<number[]>([]);
  const audioOutputRef = useRef<AudioOutputState>(initialAudioOutput);

  const [snapshot, setSnapshot] = useState<SwarmTelemetrySnapshot>({
    activeAgentsCount: 4,
    totalEventsCount: 0,
    eventsPerMinute: 0,
    agentMetrics: createInitialMetrics(),
    recentEnvelopes: [],
    healthStatus: 'HEALTHY',
    lastPulseAt: new Date().toISOString(),
    serialExecution: undefined,
    audioOutput: initialAudioOutput,
  });

  useEffect(() => {
    if (!bus) return;
    const history = bus.getHistory();
    if (history.length > 0) {
      const knownAudio = findKnownAudioState(history);
      if (knownAudio) audioOutputRef.current = knownAudio;
      setSnapshot((prev) => ({
        ...prev,
        totalEventsCount: history.length,
        recentEnvelopes: history.slice(-20).reverse(),
        audioOutput: knownAudio || prev.audioOutput,
      }));
    }

    const unsubscribe = bus.subscribe('*', (envelope: EventEnvelope) => {
      const now = Date.now();
      eventTimestampsRef.current.push(now);
      eventTimestampsRef.current = eventTimestampsRef.current.filter((t) => now - t <= 60000);
      const epm = eventTimestampsRef.current.length;

      handleTokenGateAudio(envelope, audioOutputRef, bus);
      handleInvocationAudio(envelope, audioOutputRef, bus);
      handleAudioStateChanged(envelope, audioOutputRef);

      setSnapshot((prev) => reduceSnapshot(prev, envelope, epm, audioOutputRef.current));
    });

    return () => {
      unsubscribe();
    };
  }, [bus]);

  const toggleManualMute = useCallback(() => {
    const currentAudio = audioOutputRef.current || initialAudioOutput;
    const nextMuted = !currentAudio.isMuted;
    const newAudioState: AudioOutputState = {
      isMuted: nextMuted,
      activeSpeakerUnitId: nextMuted ? undefined : 'unit-seriell-motor',
      activeForce: nextMuted ? undefined : 'SERIELL_MOTOR',
      triggerReason: nextMuted ? 'DEFAULT_SILENCE' : 'MANUAL_UNMUTE',
      lastChangedAt: new Date().toISOString(),
    };

    audioOutputRef.current = newAudioState;
    if (bus) bus.publishAudioState(newAudioState);
    setSnapshot((prev) => ({ ...prev, audioOutput: newAudioState }));
  }, [bus]);

  const triggerInvocation = useCallback(
    (inputText: string) => {
      const match = detectUnitInvocation(inputText);
      if (!match) return false;

      const audioState: AudioOutputState = {
        isMuted: false,
        activeSpeakerUnitId: match.unitId,
        activeForce: match.force,
        triggerReason: 'NAME_INVOCATION',
        lastChangedAt: new Date().toISOString(),
      };
      audioOutputRef.current = audioState;
      if (bus) bus.publishAudioState(audioState);
      setSnapshot((prev) => ({ ...prev, audioOutput: audioState }));
      return true;
    },
    [bus]
  );

  return { snapshot, eventBus: bus, toggleManualMute, triggerInvocation };
}
