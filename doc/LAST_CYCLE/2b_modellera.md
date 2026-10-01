# Steg 2b: Modellera & Arkitekturdesign (TCK-018)

## 1. Symbol-Krona Kontrakt & Integrerad Färgsättning
```ts
export const CROWN_SYMBOLS = {
  ATT_FOLJA: '⇑',
  ATT_VANDA_OM: '⇐',
  ATT_FORLIKAS: '●',
  SERIELL_MOTOR: '●',
} as const;

export const STATUS_LED_CLASSES = {
  ACTIVE: 'text-emerald-400',
  THINKING: 'text-amber-400',
  ERROR: 'text-red-400',
} as const;
```
Kronan renderas utan separat LED-cirkel:
`<span className={`font-bold text-sm leading-none transition-colors ${STATUS_LED_CLASSES[state.color]}`}>{state.symbol}</span>`

## 2. User Activity Lock (`useUserActivityLock.ts`)
```ts
export interface UserActivityLockState {
  isLocked: boolean;
  lockUntil: number;
  triggerUserActivity: () => void;
  canAutonomouslyUpdate: () => boolean;
}
```
Vid användarinteraktion sätts `lockUntil = Date.now() + 5000`. Efter 5 sekunders inaktivitet återställs `isLocked` till `false`.

## 3. Snap & Immersiv Touch-Overlay (`SplitPaneCanvas.tsx` / `TouchOverlayMenu.tsx`)
- Grepplisten visar `[ ⇕ ]` och hanterar `onClick`:
  - Om `splitRatio > 0`: Sätt till `0` (100% fullskärmschatt).
  - Om `splitRatio === 0`: Sätt till tidigare läge (standard `50`).
- Immersivt läge (`isImmersive`):
  - Döljer permanent krona och bottenmeny.
  - Vid touch/pointerdown fälls en flytande touch-overlay ut som försvinner efter 3 sekunder.

## 4. Exekveringskort (`ExecutionCard.tsx`)
```ts
export interface ExecutionCardData {
  id: string;
  force: 'ATT_FOLJA' | 'ATT_VANDA_OM' | 'ATT_FORLIKAS' | 'SERIELL_MOTOR';
  stepNumber: number;
  title: string;
  createdFiles?: string[];
  changesSummary?: string;
  voiceSummary?: string;
  timestamp: string;
}
```
Kortet har fällbart tillstånd (`isExpanded`) och visar symbol, stegnummer, rubrik, samt detaljer över ändrade filer.
