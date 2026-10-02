# Steg 2b: Modellera & Arkitekturdesign (TCK-020b)

## 1. 3-State Modell & Navigeringsregler i `splitPaneHelper.ts`

```ts
export type SplitSnapState = 0 | 50 | 100;

export function stepSnapState(
  current: SplitSnapState,
  direction: 'prev' | 'next'
): SplitSnapState {
  if (direction === 'prev') {
    if (current === 100) return 50;
    if (current === 50) return 0;
    return 0;
  }
  // direction === 'next'
  if (current === 0) return 50;
  if (current === 50) return 100;
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
  ratio: SplitSnapState
): SplitArrowConfig {
  if (orientation === 'landscape') {
    return {
      showFirst: ratio > 0, // [ ⇐ ] vid 50% och 100%
      showSecond: ratio < 100, // [ ⇒ ] vid 0% och 50%
      firstIcon: '⇐',
      secondIcon: '⇒',
    };
  }
  return {
    showFirst: ratio > 0, // [ ⇧ ] vid 50% och 100%
    showSecond: ratio < 100, // [ ⇩ ] vid 0% och 50%
    firstIcon: '⇧',
    secondIcon: '⇩',
  };
}
```

## 2. Gemini Live Bidi Audio Handshake & PCM16 Piping

```ts
export function createBidiSetupPayload(systemInstruction?: string) {
  return {
    setup: {
      model: 'models/gemini-3.8-live',
      generationConfig: {
        responseModalities: ['audio'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Aoede' },
          },
        },
      },
      systemInstruction: {
        parts: [{ text: systemInstruction || 'Försoningsmotorns kompass aktiv.' }],
      },
    },
  };
}

export function floatTo16BitPCM(input: Float32Array): Int16Array {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return output;
}
```
