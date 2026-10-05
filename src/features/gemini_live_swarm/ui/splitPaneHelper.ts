export type SwarmIntent = 'REFLECT' | 'REMEMBER' | 'CONSULT';
export type SplitOrientation = 'portrait' | 'landscape';
export type SplitSnapState = 0 | 50 | 100;

export interface SplitArrowConfig {
  showFirst: boolean;
  showSecond: boolean;
  firstIcon: string;
  secondIcon: string;
}

export interface SwarmIntentDef {
  id: SwarmIntent;
  label: string;
  force: string;
  color: string;
  icon: string;
  iconName: 'Compass' | 'ReconciliationRays' | 'RotateCcw';
}

export interface AccumulatedTurn {
  id: string;
  agentRole: string;
  forceTitle: string;
  text: string;
  isComplete: boolean;
  timestamp: string;
}

export const PANEL_TITLES = { LEFT: 'Dialog', RIGHT: 'Verktyg' } as const;

export const SWARM_INTENTS: readonly SwarmIntentDef[] = [
  { id: 'REFLECT', label: 'Att följa', force: 'ATT_FOLJA', color: '#38bdf8', icon: 'Compass', iconName: 'Compass' },
  { id: 'CONSULT', label: 'Att förlikas', force: 'ATT_FORLIKAS', color: '#facc15', icon: 'Försoningsfamnen', iconName: 'ReconciliationRays' },
  { id: 'REMEMBER', label: 'Att vända om', force: 'ATT_VANDA_OM', color: '#a855f7', icon: 'RotateCcw', iconName: 'RotateCcw' },
] as const;

export const INTENT_FORCE_MAP: Record<SwarmIntent, { force: string; title: string; color: string; symbol: string; icon: string }> = {
  REFLECT: { force: 'ATT_FOLJA', title: 'Att följa', color: '#38bdf8', symbol: '🧭', icon: 'Compass' },
  CONSULT: { force: 'ATT_FORLIKAS', title: 'Att förlikas', color: '#facc15', symbol: 'Försoningsfamnen', icon: 'ReconciliationRays' },
  REMEMBER: { force: 'ATT_VANDA_OM', title: 'Att vända om', color: '#a855f7', symbol: '↺', icon: 'RotateCcw' },
};

export function appendStreamChunkToTurns(
  currentTurns: AccumulatedTurn[],
  chunkText: string,
  agentRole = 'Att förlikas',
  forceTitle = 'Harmonisk syntes',
  isTurnComplete = false
): AccumulatedTurn[] {
  if (!chunkText && !isTurnComplete) return currentTurns;
  const last = currentTurns[currentTurns.length - 1];
  if (last && !last.isComplete && last.agentRole === agentRole) {
    const updated = [...currentTurns];
    updated[updated.length - 1] = { ...last, text: last.text + chunkText, isComplete: isTurnComplete };
    return updated;
  }
  return [
    ...currentTurns,
    {
      id: `turn-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      agentRole,
      forceTitle,
      text: chunkText,
      isComplete: isTurnComplete,
      timestamp: new Date().toISOString(),
    },
  ];
}

export function computeSplitFromPointer(pointerPos: number, containerStart: number, containerSize: number): number {
  if (containerSize <= 0) return 50;
  const raw = ((pointerPos - containerStart) / containerSize) * 100;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

export function calculateRatioFromPointer(clientX: number, clientY: number, rect: DOMRect, orientation: SplitOrientation): number {
  const isLandscape = orientation === 'landscape';
  const pos = isLandscape ? clientX : clientY;
  const start = isLandscape ? rect.left : rect.top;
  const size = isLandscape ? rect.width : rect.height;
  return computeSplitFromPointer(pos, start, size);
}

export function clampSnapState(ratio: number): SplitSnapState {
  if (ratio <= 25) return 0;
  if (ratio >= 75) return 100;
  return 50;
}

export function stepSnapState(current: SplitSnapState, direction: 'prev' | 'next'): SplitSnapState {
  if (direction === 'prev') return current === 100 ? 50 : 0;
  return current === 0 ? 50 : 100;
}

export function handleKeyboardNavigation(key: string, orientation: SplitOrientation, current: SplitSnapState): SplitSnapState {
  if (orientation === 'portrait') {
    if (key === 'ArrowUp') return stepSnapState(current, 'prev');
    if (key === 'ArrowDown') return stepSnapState(current, 'next');
  } else {
    if (key === 'ArrowLeft') return stepSnapState(current, 'prev');
    if (key === 'ArrowRight') return stepSnapState(current, 'next');
  }
  return current;
}

export function handleSwipeGesture(deltaX: number, deltaY: number, orientation: SplitOrientation, current: SplitSnapState): SplitSnapState {
  const threshold = 30;
  if (orientation === 'portrait') {
    if (deltaY < -threshold) return stepSnapState(current, 'prev');
    if (deltaY > threshold) return stepSnapState(current, 'next');
  } else {
    if (deltaX < -threshold) return stepSnapState(current, 'prev');
    if (deltaX > threshold) return stepSnapState(current, 'next');
  }
  return current;
}

export function computeSplitArrows(orientation: SplitOrientation, ratio: number): SplitArrowConfig {
  const isLand = orientation === 'landscape';
  return {
    showFirst: ratio > 0,
    showSecond: ratio < 100,
    firstIcon: isLand ? '⇐' : '⇧',
    secondIcon: isLand ? '⇒' : '⇩',
  };
}

export function getIntentButtonClass(intent: SwarmIntent, activeIntent: SwarmIntent | null): string {
  const base = 'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200 select-none';
  if (intent === activeIntent) {
    if (intent === 'REFLECT') return `${base} bg-sky-950/80 text-sky-300 ring-1 ring-sky-400 shadow-md font-semibold`;
    if (intent === 'CONSULT') return `${base} bg-amber-950/80 text-amber-300 ring-1 ring-amber-400 shadow-md font-semibold`;
    return `${base} bg-purple-950/80 text-purple-300 ring-1 ring-purple-400 shadow-md font-semibold`;
  }
  return `${base} bg-slate-800/80 hover:bg-slate-700 text-slate-300 opacity-90`;
}

export function getIntentTextClass(isPortrait: boolean): string {
  if (isPortrait) return 'inline-block text-xs';
  return 'hidden';
}

export function getArrowDisplay(show: boolean): string {
  return show ? 'inline-flex' : 'hidden';
}

export function getPaneDirectionClass(orientation: SplitOrientation): string {
  return orientation === 'landscape' ? 'flex-row' : 'flex-col';
}

export function getDividerStyleClass(orientation: SplitOrientation): string {
  if (orientation === 'landscape') return 'w-3.5 h-full cursor-col-resize flex-col py-1';
  return 'h-3.5 w-full cursor-row-resize flex-row px-1';
}

export function computeSnapTarget(currentRatio: number, toMin: boolean): number {
  if (toMin) return currentRatio === 0 ? 50 : 0;
  return currentRatio === 100 ? 50 : 100;
}

export function getDividerContainerClass(isPortrait: boolean): string {
  const base = 'flex-none bg-slate-800 border-slate-700/60 z-20 shadow-lg touch-none select-none';
  if (isPortrait) {
    return `${base} h-11 w-full border-y px-3 flex flex-row items-center justify-between cursor-row-resize`;
  }
  return `${base} w-14 h-full border-x py-3 flex flex-col items-center justify-between cursor-col-resize`;
}

export function getPaneSizeStyle(orientation: SplitOrientation, ratio: number, isFirstPane: boolean): Record<string, string> {
  const percent = isFirstPane ? ratio : 100 - ratio;
  if (orientation === 'landscape') return { width: `${percent}%` };
  return { height: `${percent}%` };
}

export function extractTurnEventData(data: any, eventType = ''): { text: string; role: string; force: string; isComplete: boolean; shouldReset: boolean } {
  const text = String(data?.transcription ?? data?.delta ?? data?.text ?? data?.error ?? data?.reason ?? '').trim();
  const role = String(data?.agentRole ?? data?.agent ?? data?.force ?? 'Att förlikas');
  const force = String(data?.forceTitle ?? data?.title ?? 'Harmonisk syntes');
  const isComplete = Boolean(data?.isTurnComplete ?? data?.turnComplete ?? data?.isComplete);
  const shouldReset = eventType.includes('deactivated') || eventType.includes('disconnected');
  return { text, role, force, isComplete, shouldReset };
}

export function handlePointerMoveOnDivider(
  isDragging: boolean,
  container: HTMLElement | null,
  clientX: number,
  clientY: number,
  isPortrait: boolean,
  onUpdate: (next: SplitSnapState) => void
): void {
  if (!isDragging || !container) return;
  const rect = container.getBoundingClientRect();
  const ratio = calculateRatioFromPointer(clientX, clientY, rect, isPortrait ? 'portrait' : 'landscape');
  onUpdate(clampSnapState(ratio));
}

export async function toggleSwarmIntent(liveSession: any, current: SwarmIntent | null, target: SwarmIntent): Promise<SwarmIntent | null> {
  const next = current === target ? null : target;
  if (!liveSession) return next;
  try {
    if (next) await liveSession.activateIntent(next);
    else liveSession.deactivateIntent();
    return next;
  } catch {
    return null;
  }
}
