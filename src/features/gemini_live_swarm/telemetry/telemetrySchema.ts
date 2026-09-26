import { z } from 'zod';
import { EventEnvelopeSchema } from '../../../shared/contracts/envelope.ts';

/**
 * Zod-schema för roller i SI v10.0 samt bakåtkompatibilitet
 */
export const SwarmAgentRoleSchema = z.enum([
  'ATT_FORLIKAS',
  'ATT_FOLJA',
  'ATT_VANDA_OM',
  'SERIELL_MOTOR',
  'ORCHESTRATOR',
  'RESEARCHER',
  'OUTREACH_WRITER',
  'CRITIC',
]);

export type SwarmAgentRole = z.infer<typeof SwarmAgentRoleSchema>;

/**
 * Individuell agentmetrik för telemetri
 */
export const AgentTelemetryMetricSchema = z.object({
  agentId: z.string(),
  role: SwarmAgentRoleSchema,
  status: z.enum(['IDLE', 'THINKING', 'EXECUTING_TOOL', 'DONE', 'ERROR']),
  lastThought: z.string().optional(),
  lastActive: z.string(),
  totalEventsEmitted: z.number().int().nonnegative().default(0),
  averageLatencyMs: z.number().nonnegative().default(0),
  phase: z.string().optional(),
});

export type AgentTelemetryMetric = z.infer<typeof AgentTelemetryMetricSchema>;

/**
 * Sammanställt telemetritillstånd för hela svärmen och krafterna
 */
export const SwarmTelemetrySnapshotSchema = z.object({
  activeAgentsCount: z.number().int().nonnegative(),
  totalEventsCount: z.number().int().nonnegative(),
  eventsPerMinute: z.number().nonnegative(),
  agentMetrics: z.record(z.string(), AgentTelemetryMetricSchema),
  recentEnvelopes: z.array(EventEnvelopeSchema),
  healthStatus: z.enum(['HEALTHY', 'DEGRADED', 'HALTED']),
  lastPulseAt: z.string(),
  activeEngine: z.enum(['KRAFTER_TRIAD', 'SERIELL_MOTOR']).default('KRAFTER_TRIAD'),
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
  wayfinderMap: z.string().optional(),
});

export type DevelopmentTicket = z.infer<typeof DevelopmentTicketSchema>;
