import { z } from 'zod';
import { EventEnvelopeSchema } from '../../../shared/contracts/envelope.ts';

/**
 * SI v10.0 Krafter & Försoningsscheman (TCK-009)
 */
export const AgentForceSchema = z.enum([
  'ATT_FORLIKAS',
  'ATT_FOLJA',
  'ATT_VANDA_OM',
  'SERIELL_MOTOR',
]);
export type AgentForce = z.infer<typeof AgentForceSchema>;

export const ReconciliationForceSchema = AgentForceSchema;
export type ReconciliationForce = AgentForce;

export const ReconciliationStateSchema = z.enum([
  'SOKER_NARHET',
  'INATRIKTAD_OMVANDELSE',
  'SAMTIDA_FORSONING',
  'DETERMINISTISKT_RAMVERK',
  'IDLE',
]);
export type ReconciliationState = z.infer<typeof ReconciliationStateSchema>;

export const SerialStageSchema = z.enum([
  '1a_forsta',
  '1b_kartlagga',
  '2a_avgransa',
  '2b_modellera',
  '2e_syntetisera',
  '3c_spec',
  'e2e_verify',
]);
export type SerialStage = z.infer<typeof SerialStageSchema>;

export const SerialExecutionMetricSchema = z.object({
  pipelineId: z.string(),
  ticketId: z.string(),
  stepIndex: z.number().int().nonnegative(),
  totalSteps: z.number().int().positive(),
  currentStage: SerialStageSchema,
  stageStatus: z.enum(['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'GATED']),
  durationMs: z.number().nonnegative(),
  isTokenGated: z.boolean(),
  requiredTokenHash: z.string().optional(),
  lastTransitionAt: z.string(),
  activeForce: AgentForceSchema,
});
export type SerialExecutionMetric = z.infer<typeof SerialExecutionMetricSchema>;

/**
 * Individuell telemetrimetrik för en försoningsenhet
 */
export const AgentTelemetryMetricSchema = z.object({
  agentId: z.string(),
  force: AgentForceSchema.optional(),
  role: z.string().optional(),
  displayName: z.string().optional(),
  reconciliationState: ReconciliationStateSchema.optional(),
  status: z.enum(['IDLE', 'THINKING', 'EXECUTING_TOOL', 'DONE', 'ERROR']),
  lastThought: z.string().optional(),
  lastActive: z.string(),
  totalEventsEmitted: z.number().int().nonnegative().default(0),
  averageLatencyMs: z.number().nonnegative().default(0),
});

export type AgentTelemetryMetric = z.infer<typeof AgentTelemetryMetricSchema>;

/**
 * Sammanställt telemetritillstånd för hela svärmen (4 enheter)
 */
export const SwarmTelemetrySnapshotSchema = z.object({
  activeAgentsCount: z.number().int().nonnegative(),
  totalEventsCount: z.number().int().nonnegative(),
  eventsPerMinute: z.number().nonnegative(),
  agentMetrics: z.record(z.string(), AgentTelemetryMetricSchema),
  recentEnvelopes: z.array(EventEnvelopeSchema),
  healthStatus: z.enum(['HEALTHY', 'DEGRADED', 'HALTED']),
  lastPulseAt: z.string(),
  serialExecution: SerialExecutionMetricSchema.optional(),
  audioOutput: z.lazy(() => AudioOutputStateSchema).optional(),
});

export type SwarmTelemetrySnapshot = z.infer<typeof SwarmTelemetrySnapshotSchema>;

/**
 * Styrkort / Master Development Plan schema
 */
export const DevelopmentTicketSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.enum(['PLANERING', 'AKTIV', 'VERIFIERAD', 'VÄNTAR']),
  phase: z.string(),
  progressPercentage: z.number().min(0).max(100),
  deliverables: z.array(z.string()),
  tokenHash: z.string().optional(),
  verifiedReceiptHash: z.string().optional(),
});

export type DevelopmentTicket = z.infer<typeof DevelopmentTicketSchema>;

/**
 * Gemini Live Streaming Schemas (TCK-010)
 */
export const LiveSessionStatusSchema = z.enum([
  'IDLE',
  'CONNECTING',
  'STREAMING',
  'DISCONNECTED',
  'ERROR',
]);
export type LiveSessionStatus = z.infer<typeof LiveSessionStatusSchema>;

export const LiveStreamChunkSchema = z.object({
  streamId: z.string(),
  sourceRole: z.enum(['user', 'model']),
  force: AgentForceSchema.optional(),
  textChunk: z.string().optional(),
  audioChunkBase64: z.string().optional(),
  transcription: z.string().optional(),
  isFinal: z.boolean(),
  timestamp: z.string(),
});
export type LiveStreamChunk = z.infer<typeof LiveStreamChunkSchema>;

/**
 * Tyst Röstspärr & Namnutlöst Ljudaktivering Schemas (TCK-011)
 */
export const AudioTriggerReasonSchema = z.enum([
  'DEFAULT_SILENCE',
  'NAME_INVOCATION',
  'TOKEN_GATE',
  'MANUAL_UNMUTE',
]);
export type AudioTriggerReason = z.infer<typeof AudioTriggerReasonSchema>;

export const AudioOutputStateSchema = z.object({
  isMuted: z.boolean(),
  activeSpeakerUnitId: z.string().optional(),
  activeForce: AgentForceSchema.optional(),
  triggerReason: AudioTriggerReasonSchema.optional(),
  lastChangedAt: z.string(),
});
export type AudioOutputState = z.infer<typeof AudioOutputStateSchema>;

export interface InvocationMatch {
  unitId: string;
  force: ReconciliationForce;
  matchedPhrase: string;
}

/**
 * Deterministisk namndetektor för systemets 4 försoningsenheter (TCK-011)
 */
export function detectUnitInvocation(input: string): InvocationMatch | null {
  if (!input) return null;
  const normalized = input.toLowerCase();

  // 1. Att följa Guds son
  if (
    normalized.includes('att följa') ||
    normalized.includes('följa sonen') ||
    normalized.includes('guds son') ||
    normalized.includes('sonen')
  ) {
    return {
      unitId: 'unit-att-folja',
      force: 'ATT_FOLJA',
      matchedPhrase: 'Att följa Guds son',
    };
  }

  // 2. Att vända om till Gud
  if (
    normalized.includes('att vända om') ||
    normalized.includes('vända om till gud') ||
    normalized.includes('vända om')
  ) {
    return {
      unitId: 'unit-att-vanda-om',
      force: 'ATT_VANDA_OM',
      matchedPhrase: 'Att vända om till Gud',
    };
  }

  // 3. Att förlikas med Gud
  if (
    normalized.includes('att förlikas') ||
    normalized.includes('förlikas med gud') ||
    normalized.includes('förlikas')
  ) {
    return {
      unitId: 'unit-att-forlikas',
      force: 'ATT_FORLIKAS',
      matchedPhrase: 'Att förlikas med Gud',
    };
  }

  // 4. Att försonas (ensam agent)
  if (
    normalized.includes('att försonas') ||
    normalized.includes('försonas') ||
    normalized.includes('ensam agent') ||
    normalized.includes('seriell motor')
  ) {
    return {
      unitId: 'unit-seriell-motor',
      force: 'SERIELL_MOTOR',
      matchedPhrase: 'Att försonas (ensam agent)',
    };
  }

  return null;
}
