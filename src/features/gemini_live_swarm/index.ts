export { SwarmOrchestrator } from './coordinator/swarmOrchestrator.ts';
export type { CampaignInput, CampaignPlan, SwarmStep } from './coordinator/swarmOrchestrator.ts';
export { GeminiLiveSession } from './session/geminiLiveSession.ts';
export {
  SEMANTIC_INVARIANT,
  RECONCILIATION_UNITS,
  DEFAULT_SWARM_ROLES,
  mapRoleToForce,
  mapForceToRole,
} from './agents/roleDefinitions.ts';
export type {
  SwarmAgentRole,
  SwarmAgentConfig,
  AgentForce,
} from './agents/roleDefinitions.ts';

// Reaktiv Händelsebuss (TCK-002)
export { SwarmEventBus, getGlobalSwarmEventBus } from './bus/swarmEventBus.ts';
export type { SwarmEventHandler, SwarmSubscription } from './bus/swarmEventBus.ts';

// Kontext & Global Swarm Core (TCK-015)
export { SwarmProvider, useSwarmContext } from './context/SwarmContext.tsx';
export type { SwarmCoreContextValue, SwarmProviderProps } from './context/SwarmContext.tsx';

// Telemetri & Styrkort Scheman & Hooks (TCK-002 & TCK-006)
export {
  AgentForceSchema,
  SerialStageSchema,
  SerialExecutionMetricSchema,
  AgentTelemetryMetricSchema,
  SwarmTelemetrySnapshotSchema,
  DevelopmentTicketSchema,
  LiveSessionStatusSchema,
  LiveStreamChunkSchema,
  AudioTriggerReasonSchema,
  AudioOutputStateSchema,
  ContextUsageMetricSchema,
  detectUnitInvocation,
} from './telemetry/telemetrySchema.ts';
export type {
  SerialStage,
  SerialExecutionMetric,
  AgentTelemetryMetric,
  SwarmTelemetrySnapshot,
  DevelopmentTicket,
  LiveSessionStatus,
  LiveStreamChunk,
  AudioTriggerReason,
  AudioOutputState,
  ContextUsageMetric,
  InvocationMatch,
} from './telemetry/telemetrySchema.ts';
export { useSwarmTelemetry } from './telemetry/useSwarmTelemetry.ts';

// UI Komponenter (TCK-002 & TCK-012)
export { SwarmDashboard } from './ui/SwarmDashboard.tsx';
export { TelemetrySidebar } from './ui/TelemetrySidebar.tsx';
export { MasterDevelopmentPlan } from './ui/MasterDevelopmentPlan.tsx';
export { SwarmHeader } from './ui/components/SwarmHeader.tsx';
export { SwarmUnitCard } from './ui/components/SwarmUnitCard.tsx';
export { SwarmStreamLog } from './ui/components/SwarmStreamLog.tsx';
export { SwarmControlPanel } from './ui/components/SwarmControlPanel.tsx';
