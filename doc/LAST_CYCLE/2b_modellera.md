# Steg 2b: Modellera & Arkitekturdesign (TCK-020)

## 1. Intent-Modell & User Gesture Ljudaktivering

```ts
export type SwarmIntent = 'REFLECT' | 'REMEMBER' | 'CONSULT';

export const INTENT_FORCE_MAP: Record<SwarmIntent, { force: string; title: string; symbol: string }> = {
  REFLECT: { force: 'ATT_FOLJA', title: 'Reflektera', symbol: '🎬' },
  REMEMBER: { force: 'ATT_VANDA_OM', title: 'Kom ihåg', symbol: '🧠' },
  CONSULT: { force: 'ATT_FORLIKAS', title: 'Rådgör', symbol: '💬' },
};

export class GeminiLiveSession {
  private activeIntent: SwarmIntent | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;

  public async activateIntent(intent: SwarmIntent): Promise<void> {
    if (this.activeIntent === intent) {
      this.deactivateIntent();
      return;
    }
    this.activeIntent = intent;
    // User Gesture: Säker start av AudioContext och getUserMedia
    await this.initAudioStream();
    this.publishIntentActivated(intent);
  }

  public deactivateIntent(): void {
    this.activeIntent = null;
    this.stopAudioStream();
    this.publishDormantState(); // "🟡 Agenter i dvala"
  }
}
```

## 2. Orientering & Enkelpils-Logik i `splitPaneHelper.ts`

```ts
export type SplitOrientation = 'portrait' | 'landscape';

export interface SplitArrowConfig {
  showFirst: boolean;
  showSecond: boolean;
  firstIcon: string;
  secondIcon: string;
}

export function computeSplitArrows(
  orientation: SplitOrientation,
  ratio: number
): SplitArrowConfig {
  if (orientation === 'landscape') {
    return {
      showFirst: ratio > 0,
      showSecond: ratio < 100,
      firstIcon: '⇐',
      secondIcon: '⇒',
    };
  }
  // Portrait
  return {
    showFirst: ratio > 0,
    showSecond: ratio < 100,
    firstIcon: '⇩',
    secondIcon: '⇧',
  };
}
```

## 3. Delningslinjens Integrerade Knappar

```tsx
<div role="separator" className="delningslinje">
  {arrows.showFirst && <button onClick={snapMin}>{arrows.firstIcon}</button>}
  <div className="lägesknappar-center">
    <button className={getButtonClass('REFLECT', activeIntent)}>🎬 <span>Reflektera</span></button>
    <button className={getButtonClass('REMEMBER', activeIntent)}>🧠 <span>Kom ihåg</span></button>
    <button className={getButtonClass('CONSULT', activeIntent)}>💬 <span>Rådgör</span></button>
  </div>
  {arrows.showSecond && <button onClick={snapMax}>{arrows.secondIcon}</button>}
</div>
```
