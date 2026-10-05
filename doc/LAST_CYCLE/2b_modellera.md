# Steg 2b: Modellera UI Harmonisering & Stream Concatenation (TCK-023)

## 1. Ikondefinitioner & Försoningsfamnen (Two Joined Rays)
```tsx
export const ReconciliationRaysIcon: React.FC<{ size?: number; className?: string }> = ({ size = 16, className = 'text-amber-400' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 18L12 6L20 18" />
    <path d="M8 14L12 8L16 14" />
    <circle cx="12" cy="7" r="1.5" fill="currentColor" />
  </svg>
);
```

## 2. Textackumulering (Sammanhängande Prosa)
```typescript
export interface AccumulatedTurn {
  id: string;
  agentRole: string;
  forceTitle: string;
  text: string;
  isComplete: boolean;
  timestamp: string;
}

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
    updated[updated.length - 1] = {
      ...last,
      text: last.text + chunkText,
      isComplete: isTurnComplete,
    };
    return updated;
  }
  return [
    ...currentTurns,
    {
      id: `turn-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      agentRole,
      forceTitle,
      text: chunkText,
      isComplete: isTurnComplete,
      timestamp: new Date().toISOString(),
    },
  ];
}
```

## 3. Full Hitbox på Delningsskenan
```typescript
export function computeSplitFromPointer(
  pointerPos: number,
  containerStart: number,
  containerSize: number
): number {
  if (containerSize <= 0) return 50;
  const raw = ((pointerPos - containerStart) / containerSize) * 100;
  return Math.max(0, Math.min(100, Math.round(raw)));
}
```
Detta möjliggör sömlös dragning längs hela delningsskenans yta oavsett orientering.
