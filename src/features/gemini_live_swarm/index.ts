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

// Audio Setup, DSP Mixer, VAD & Floor Control (TCK-020b & TCK-022a & TCK-025)
export { createBidiSetupPayload, floatTo16BitPCM, detectSpeechPCM, AudioPreRollBuffer, SessionIntentManager } from './session/sessionIntentAudio.ts';
export { DSPRingBufferMixer, LiveAudioPlayer, CHANNEL_PAN_CONFIG } from './session/liveAudioPlayback.ts';
export { AudioWorkerManager, audioWorker } from './session/audioWorker.ts';
export { VoiceFlowMetricsSchema, measureVoiceFlow } from './telemetry/voiceFlowSchema.ts';
export type { VoiceFlowMetrics } from './telemetry/voiceFlowSchema.ts';
export type { SwarmAudioChannel } from './session/liveAudioPlayback.ts';
export { FloorController, CHANNEL_PRIORITY, AGENT_VOICE_MAP } from './session/floorController.ts';
export { PendulumStore, PendulumModeSchema } from './session/pendulumStore.ts';
export type { PendulumMode, PendulumOptions } from './session/pendulumStore.ts';
export { analyzeTurnBoundary, handleIncomingTranscript, isSemanticQuestion } from './session/turnBoundaryDetector.ts';
export type { TurnBoundaryInput, TurnBoundaryResult } from './session/turnBoundaryDetector.ts';

// Symbol-Krona & TurnContainer Sphere (TCK-017, TCK-030b)
export { SymbolCrown, CROWN_SYMBOLS, STATUS_LED_CLASSES } from './ui/SymbolCrown.tsx';
export type { SymbolCrownProps, CrownStatusColor, CrownState } from './ui/SymbolCrown.tsx';
export { TurnContainer } from './ui/TurnContainer.tsx';
export type { TurnContainerProps } from './ui/TurnContainer.tsx';
export {
  appendStreamChunkToTurns,
  extractTurnEventData,
  toggleSwarmIntent,
  SWARM_INTENTS,
  INTENT_FORCE_MAP,
} from './ui/turnContainerHelper.ts';
export type {
  AccumulatedTurn,
  SwarmIntent,
  SwarmIntentDef,
} from './ui/turnContainerHelper.ts';

// Bakåtkompatibla Split-Pane Helpers (utan dubblerade intents)
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
} from './ui/splitPaneHelper.ts';
export type { SplitOrientation, SplitArrowConfig, SplitSnapState } from './ui/splitPaneHelper.ts';

// Exekveringskort & Användarlås (TCK-018)
export { ExecutionCard } from './ui/ExecutionCard.tsx';
export type { ExecutionCardProps } from './ui/ExecutionCard.tsx';
export { useUserActivityLock } from './ui/useUserActivityLock.ts';
export type { UserActivityLockReturn } from './ui/useUserActivityLock.ts';
export { useImmersiveMode } from './ui/useImmersiveMode.ts';
export type { ImmersiveModeReturn } from './ui/useImmersiveMode.ts';

// Reflektions-Reglage & Oscillationsdjup (TCK-023a)
export { ReflectionModeSelector } from './ui/ReflectionModeSelector.tsx';
export type { ReflectionModeSelectorProps } from './ui/ReflectionModeSelector.tsx';
export {
  ReflectionModeSchema,
  REFLECTION_MODE_EVENT,
  REFLECTION_MODES,
  parseReflectionMode,
  isValidReflectionMode,
} from './ui/reflectionStateHelper.ts';
export type { ReflectionMode, ReflectionModeEventPayload } from './ui/reflectionStateHelper.ts';

// Enhetlig Prompt-Bar & STT/Live-Styrning (TCK-026)
export { UnifiedPromptBar } from './ui/UnifiedPromptBar.tsx';
export type { UnifiedPromptBarProps } from './ui/UnifiedPromptBar.tsx';
export { usePromptBarState, getLiveButtonProps, formatMemoryIndicator } from './ui/promptBarHelper.ts';
