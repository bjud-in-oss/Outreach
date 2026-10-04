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
export { SwarmProvider, useSwarmContext, useOptionalSwarmContext } from './context/SwarmContext.tsx';
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

// Audio Setup, DSP Mixer, VAD & Floor Control (TCK-020b & TCK-022a)
export { createBidiSetupPayload, floatTo16BitPCM, detectSpeechPCM, AudioPreRollBuffer, SessionIntentManager } from './session/sessionIntentAudio.ts';
export { DSPRingBufferMixer, LiveAudioPlayer, CHANNEL_PAN_CONFIG } from './session/liveAudioPlayback.ts';
export type { SwarmAudioChannel } from './session/liveAudioPlayback.ts';
export { FloorController, CHANNEL_PRIORITY, AGENT_VOICE_MAP } from './session/floorController.ts';

// Symbol-Krona & Split-Pane Layout (TCK-017, TCK-018, TCK-020 & TCK-020b)
export { SymbolCrown, CROWN_SYMBOLS, STATUS_LED_CLASSES } from './ui/SymbolCrown.tsx';
export type { SymbolCrownProps, CrownStatusColor, CrownState } from './ui/SymbolCrown.tsx';
export { SplitPaneCanvas } from './ui/SplitPaneCanvas.tsx';
export type { SplitPaneCanvasProps } from './ui/SplitPaneCanvas.tsx';
export {
  computeSplitArrows,
  getIntentButtonClass,
  getIntentTextClass,
  getArrowDisplay,
  getPaneDirectionClass,
  getDividerStyleClass,
  getPaneSizeStyle,
  calculateRatioFromPointer,
  computeSnapTarget,
  clampSnapState,
  stepSnapState,
  handleKeyboardNavigation,
  handleSwipeGesture,
  SWARM_INTENTS,
  INTENT_FORCE_MAP,
} from './ui/splitPaneHelper.ts';
export type { SwarmIntent, SplitOrientation, SplitArrowConfig, SwarmIntentDef, SplitSnapState } from './ui/splitPaneHelper.ts';

// Immersiv Touch-Overlay, Exekveringskort & Användarlås (TCK-018)
export { ExecutionCard } from './ui/ExecutionCard.tsx';
export type { ExecutionCardProps } from './ui/ExecutionCard.tsx';
export { TouchOverlayMenu } from './ui/TouchOverlayMenu.tsx';
export type { TouchOverlayMenuProps } from './ui/TouchOverlayMenu.tsx';
export { useUserActivityLock } from './ui/useUserActivityLock.ts';
export type { UserActivityLockReturn } from './ui/useUserActivityLock.ts';
export { useImmersiveMode } from './ui/useImmersiveMode.ts';
export type { ImmersiveModeReturn } from './ui/useImmersiveMode.ts';

