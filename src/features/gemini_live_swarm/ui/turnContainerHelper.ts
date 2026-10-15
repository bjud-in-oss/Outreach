export type SwarmIntent = 'REFLECT' | 'REMEMBER' | 'CONSULT';

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
  walCheckpointId?: string;
  actionHistory?: Array<{ id: string; name: string }>;
}

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

export function extractTurnEventData(data: any, eventType = ''): { text: string; role: string; force: string; isComplete: boolean; shouldReset: boolean } {
  const text = String(data?.transcription ?? data?.delta ?? data?.text ?? data?.error ?? data?.reason ?? '').trim();
  const role = String(data?.agentRole ?? data?.agent ?? data?.force ?? 'Att förlikas');
  const force = String(data?.forceTitle ?? data?.title ?? 'Harmonisk syntes');
  const isComplete = Boolean(data?.isTurnComplete ?? data?.turnComplete ?? data?.isComplete);
  const shouldReset = eventType.includes('deactivated') || eventType.includes('disconnected');
  return { text, role, force, isComplete, shouldReset };
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
