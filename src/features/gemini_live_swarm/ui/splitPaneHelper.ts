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
  icon: string;
  force: string;
}

export const SWARM_INTENTS: readonly SwarmIntentDef[] = [
  { id: 'REFLECT', label: 'Reflektera', icon: '🎬', force: 'ATT_FOLJA' },
  { id: 'REMEMBER', label: 'Kom ihåg', icon: '🧠', force: 'ATT_VANDA_OM' },
  { id: 'CONSULT', label: 'Rådgör', icon: '💬', force: 'ATT_FORLIKAS' },
] as const;

export const INTENT_FORCE_MAP: Record<SwarmIntent, { force: string; title: string; symbol: string }> = {
  REFLECT: { force: 'ATT_FOLJA', title: 'Reflektera', symbol: '🎬' },
  REMEMBER: { force: 'ATT_VANDA_OM', title: 'Kom ihåg', symbol: '🧠' },
  CONSULT: { force: 'ATT_FORLIKAS', title: 'Rådgör', symbol: '💬' },
};

export function stepSnapState(
  current: SplitSnapState,
  direction: 'prev' | 'next'
): SplitSnapState {
  if (direction === 'prev') {
    if (current === 100) return 50;
    return 0;
  }
  if (current === 0) return 50;
  return 100;
}

export function handleKeyboardNavigation(
  key: string,
  orientation: SplitOrientation,
  current: SplitSnapState
): SplitSnapState {
  if (orientation === 'portrait') {
    if (key === 'ArrowUp') return stepSnapState(current, 'prev');
    if (key === 'ArrowDown') return stepSnapState(current, 'next');
  } else {
    if (key === 'ArrowLeft') return stepSnapState(current, 'prev');
    if (key === 'ArrowRight') return stepSnapState(current, 'next');
  }
  return current;
}

export function handleSwipeGesture(
  deltaX: number,
  deltaY: number,
  orientation: SplitOrientation,
  current: SplitSnapState
): SplitSnapState {
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

export function computeSplitArrows(
  orientation: SplitOrientation,
  ratio: number
): SplitArrowConfig {
  const isLand = orientation === 'landscape';
  return {
    showFirst: ratio > 0,
    showSecond: ratio < 100,
    firstIcon: isLand ? '⇐' : '⇧',
    secondIcon: isLand ? '⇒' : '⇩',
  };
}

export function getIntentButtonClass(
  intent: SwarmIntent,
  activeIntent: SwarmIntent | null
): string {
  const base = 'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 select-none';
  if (intent === activeIntent) {
    return `${base} bg-emerald-600 text-white scale-105 shadow-md ring-1 ring-emerald-400 font-semibold`;
  }
  return `${base} bg-slate-800/80 hover:bg-slate-700 text-slate-300 scale-95 opacity-80`;
}

export function getIntentTextClass(
  intent: SwarmIntent,
  activeIntent: SwarmIntent | null
): string {
  if (intent === activeIntent) {
    return 'inline-block';
  }
  return 'hidden sm:inline-block';
}

export function getArrowDisplay(show: boolean): string {
  if (show) return 'inline-flex';
  return 'hidden';
}

export function getPaneDirectionClass(orientation: SplitOrientation): string {
  if (orientation === 'landscape') return 'flex-row';
  return 'flex-col';
}

export function getDividerStyleClass(orientation: SplitOrientation): string {
  if (orientation === 'landscape') {
    return 'w-3.5 h-full cursor-col-resize flex-col py-1';
  }
  return 'h-3.5 w-full cursor-row-resize flex-row px-1';
}

export function getPaneSizeStyle(
  orientation: SplitOrientation,
  ratio: number,
  isFirstPane: boolean
): Record<string, string> {
  const percent = isFirstPane ? ratio : 100 - ratio;
  if (orientation === 'landscape') {
    return { width: `${percent}%` };
  }
  return { height: `${percent}%` };
}

export function calculateRatioFromPointer(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  orientation: SplitOrientation
): number {
  const raw = orientation === 'landscape'
    ? ((clientX - rect.left) / rect.width) * 100
    : ((clientY - rect.top) / rect.height) * 100;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

export function clampSnapState(ratio: number): SplitSnapState {
  if (ratio === 0) return 0;
  if (ratio === 100) return 100;
  return 50;
}

export function computeSnapTarget(currentRatio: number, toMin: boolean): number {
  if (toMin) {
    if (currentRatio === 0) return 50;
    return 0;
  }
  if (currentRatio === 100) return 50;
  return 100;
}
