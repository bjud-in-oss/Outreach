import { EventEnvelope } from '../../../shared/contracts/envelope.ts';

export type CrownStatusColor = 'ACTIVE' | 'THINKING' | 'ERROR';

export interface CrownState {
  symbol: '⇑' | '⇐' | '↔' | '●';
  color: CrownStatusColor;
  activityText: string;
  activeForce?: string;
  activeUnitId?: string;
  updatedAt?: string;
  isDriveAuthExpired?: boolean;
}

export const CROWN_SYMBOLS = {
  ATT_FOLJA: '⇑',
  ATT_VANDA_OM: '⇐',
  ATT_VANDA_OM_LEGACY: '↔',
  ATT_FORLIKAS: '●',
  SERIELL_MOTOR: '●',
} as const;

export const STATUS_LED_CLASSES = {
  ACTIVE: 'text-emerald-400',
  THINKING: 'text-amber-400',
  ERROR: 'text-red-400',
} as const;

export const LED_BG_CLASSES: Record<CrownStatusColor, string> = {
  ACTIVE: 'bg-emerald-400',
  THINKING: 'bg-amber-400',
  ERROR: 'bg-red-400',
};

export function getForceLabel(force?: string): string {
  if (force) return force;
  return 'ATT_FOLJA';
}

export function getExpandIcon(expanded: boolean): string {
  if (expanded) return '▲';
  return '▼';
}

export function getDetailDisplay(expanded: boolean): string {
  if (expanded) return 'block';
  return 'hidden';
}

export function getReauthClass(isExpired?: boolean): string {
  if (isExpired) return 'inline-flex';
  return 'hidden';
}

const FORCE_MAP: Record<string, '⇑' | '⇐' | '↔' | '●'> = {
  ATT_FOLJA: '⇑',
  ATT_VANDA_OM: '⇐',
  ATT_FORLIKAS: '●',
  SERIELL_MOTOR: '●',
  'unit-att-folja': '⇑',
  'unit-att-vanda-om': '⇐',
  'unit-att-forlikas': '●',
};

const COLOR_MAP: Record<string, CrownStatusColor> = {
  ACTIVE: 'ACTIVE',
  RUNNING: 'ACTIVE',
  COMPLETED: 'ACTIVE',
  THINKING: 'THINKING',
  PENDING: 'THINKING',
  EXECUTING_TOOL: 'THINKING',
  RECONNECTING: 'THINKING',
  ERROR: 'ERROR',
  FAILED: 'ERROR',
  HALTED: 'ERROR',
};

export function resolveCrownFromEnvelope(
  envelope: EventEnvelope,
  current: CrownState
): CrownState {
  const data = (envelope.data || {}) as Record<string, unknown>;
  const rawForce = String(data.force || data.activeForce || data.unitId || '');
  const rawStatus = String(data.color || data.status || data.stageStatus || '');
  const rawText = String(data.activityText || data.text || data.currentThought || '');

  const eventName = String(data.event || envelope.type || '');
  const isDriveExpired = eventName === 'DRIVE_AUTH_EXPIRED' || envelope.type === 'swarm.drive.auth.expired';
  const isDriveRefreshed = eventName === 'DRIVE_AUTH_REFRESHED' || envelope.type === 'swarm.drive.auth.refreshed';

  let nextDriveExpired = current.isDriveAuthExpired || false;
  if (isDriveExpired) {
    nextDriveExpired = true;
  } else if (isDriveRefreshed) {
    nextDriveExpired = false;
  }

  const nextSymbol = FORCE_MAP[rawForce] || current.symbol;
  let nextColor = COLOR_MAP[rawStatus] || current.color;
  if (isDriveExpired) {
    nextColor = 'ERROR';
  } else if (isDriveRefreshed) {
    nextColor = 'ACTIVE';
  }
  const nextText = rawText.trim() ? rawText.trim() : current.activityText;

  return {
    symbol: nextSymbol,
    color: nextColor,
    activityText: nextText,
    activeForce: rawForce || current.activeForce,
    activeUnitId: String(data.unitId || current.activeUnitId || ''),
    updatedAt: envelope.time || new Date().toISOString(),
    isDriveAuthExpired: nextDriveExpired,
  };
}
