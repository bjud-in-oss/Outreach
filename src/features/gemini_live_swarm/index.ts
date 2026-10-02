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

// Symbol-Krona & Split-Pane Layout (TCK-017 & TCK-018)
export { SymbolCrown, CROWN_SYMBOLS, STATUS_LED_CLASSES } from './ui/SymbolCrown.tsx';
export type { SymbolCrownProps, CrownStatusColor, CrownState } from './ui/SymbolCrown.tsx';
export { SplitPaneCanvas } from './ui/SplitPaneCanvas.tsx';
export type { SplitPaneCanvasProps } from './ui/SplitPaneCanvas.tsx';

// Immersiv Touch-Overlay, Exekveringskort & Användarlås (TCK-018)
export { ExecutionCard } from './ui/ExecutionCard.tsx';
export type { ExecutionCardProps } from './ui/ExecutionCard.tsx';
export { TouchOverlayMenu } from './ui/TouchOverlayMenu.tsx';
export type { TouchOverlayMenuProps } from './ui/TouchOverlayMenu.tsx';
export { useUserActivityLock } from './ui/useUserActivityLock.ts';
export type { UserActivityLockReturn } from './ui/useUserActivityLock.ts';
export { useImmersiveMode } from './ui/useImmersiveMode.ts';
export type { ImmersiveModeReturn } from './ui/useImmersiveMode.ts';

