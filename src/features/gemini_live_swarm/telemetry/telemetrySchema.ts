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
