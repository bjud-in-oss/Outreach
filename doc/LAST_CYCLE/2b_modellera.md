# Steg 2b: Modellera VAD & Continuous Stream (TCK-022c)

## 1. Uppdaterad VAD-logik (`detectSpeechPCM`)
```typescript
export function detectSpeechPCM(
  samples: Float32Array,
  rmsThreshold = 0.015,
  zcrThreshold = 0.05
): VadAnalysisResult {
  if (samples.length === 0) return { isSpeech: false, rms: 0, zcr: 0 };
  let sumSquares = 0;
  let zeroCrossings = 0;
  for (let i = 0; i < samples.length; i++) {
    sumSquares += samples[i] * samples[i];
    if (i > 0 && ((samples[i] >= 0 && samples[i - 1] < 0) || (samples[i] < 0 && samples[i - 1] >= 0))) {
      zeroCrossings++;
    }
  }
  const rms = Math.sqrt(sumSquares / samples.length);
  const zcr = zeroCrossings / samples.length;
  const isSpeech = rms > (rmsThreshold * 1.5) || (rms > rmsThreshold && zcr > zcrThreshold);
  return { isSpeech, rms, zcr };
}
```

## 2. Kontinuerlig PCM-sampling utan Intent-lås
```typescript
this.audioProcessor.onaudioprocess = (e) => {
  this.processIncomingChunk(e.inputBuffer.getChannelData(0));
};
```
Genom att ta bort `if (!this.activeIntent) return;` kan mikrofonen skicka PCM-paket (`swarm.live.stream.audio`) via `SwarmEventBus` direkt när tal detekteras av VAD.
