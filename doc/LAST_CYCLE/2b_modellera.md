# Steg 2b: Modellera & Arkitekturdesign (TCK-017)

## 1. Symbol-Krona Kontrakt (`SymbolCrown.tsx`)
```tsx
export type CrownStatusColor = 'ACTIVE' | 'THINKING' | 'ERROR';

export interface CrownState {
  symbol: '⇑' | '↔' | '●';
  color: CrownStatusColor;
  activityText: string;
}

export const CROWN_SYMBOLS = {
  ATT_FOLJA: '⇑',
  ATT_VANDA_OM: '↔',
  ATT_FORLIKAS: '●',
  SERIELL_MOTOR: '●',
} as const;

export const STATUS_LED_CLASSES = {
  ACTIVE: 'text-emerald-400',
  THINKING: 'text-amber-400',
  ERROR: 'text-red-400',
} as const;
```

Kronan renderas med formatet:
`<span className={STATUS_LED_CLASSES[color]}>{symbol}</span> <span className="text-slate-400 truncate">{activityText}</span>`

## 2. Split-Pane Kanvas Modell (`SplitPaneCanvas.tsx`)
- Props:
  - `upperContent?: React.ReactNode` (visas direkt i övre sektionen, inga rubriker)
  - `lowerContent?: React.ReactNode` (visas direkt i nedre sektionen, inga rubriker)
  - `initialSplitRatio?: number` (standard: 50)
- Draglogik:
  - `isDragging`-tillstånd och `pointerdown`-lyssnare på delaren.
  - Global `pointermove`- och `pointerup`-lyssnare under pågående drag för jämn följsamhet.
  - Beräknar `clientY` i förhållande till containerns rektangel (`getBoundingClientRect()`).
  - Begränsar höjdfördelningen mellan 15% och 85% för att undvika nollhöjder.

## 3. Rot-Integrering i `App.tsx`
```tsx
import React from 'react';
import { SwarmProvider, SymbolCrown, SplitPaneCanvas } from './features/gemini_live_swarm/index.ts';

export default function App() {
  return (
    <SwarmProvider>
      <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden select-none">
        <SymbolCrown />
        <SplitPaneCanvas />
      </div>
    </SwarmProvider>
  );
}
```
Detta håller `App.tsx` på cirka 15 rader, långt under 30-radersgränsen.
