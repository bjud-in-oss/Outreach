# Steg 2b: Modellera DSP Mixer, VAD & Floor Control (TCK-022a)

## 1. Nativ PCM VAD Modell (`sessionIntentAudio.ts`)
```typescript
export interface VadAnalysisResult {
  isSpeech: boolean;
  rms: number;
  zcr: number;
}

export function detectSpeechPCM(samples: Float32Array, rmsThreshold = 0.015, zcrThreshold = 0.05): VadAnalysisResult {
  if (samples.length === 0) return { isSpeech: false, rms: 0, zcr: 0 };
  let sumSquares = 0;
  let zeroCrossings = 0;
  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    sumSquares += s * s;
    if (i > 0 && ((samples[i] >= 0 && samples[i - 1] < 0) || (samples[i] < 0 && samples[i - 1] >= 0))) {
      zeroCrossings++;
    }
  }
  const rms = Math.sqrt(sumSquares / samples.length);
  const zcr = zeroCrossings / samples.length;
  // Tal kännetecknas av energi över brusgolvet och rimlig nollgenomgångsfrekvens
  const isSpeech = rms > rmsThreshold && zcr > zcrThreshold;
  return { isSpeech, rms, zcr };
}

export class AudioPreRollBuffer {
  private buffer: Float32Array;
  private writePointer = 0;
  private capacity: number;
  private isFull = false;

  constructor(capacity = 3200) { // 200 ms vid 16kHz
    this.capacity = capacity;
    this.buffer = new Float32Array(capacity);
  }

  public push(samples: Float32Array): void {
    for (let i = 0; i < samples.length; i++) {
      this.buffer[this.writePointer] = samples[i];
      this.writePointer = (this.writePointer + 1) % this.capacity;
      if (this.writePointer === 0) this.isFull = true;
    }
  }

  public flush(): Float32Array {
    if (!this.isFull) {
      return this.buffer.slice(0, this.writePointer);
    }
    const result = new Float32Array(this.capacity);
    const firstPart = this.buffer.slice(this.writePointer);
    const secondPart = this.buffer.slice(0, this.writePointer);
    result.set(firstPart, 0);
    result.set(secondPart, firstPart.length);
    return result;
  }

  public clear(): void {
    this.buffer.fill(0);
    this.writePointer = 0;
    this.isFull = false;
  }
}
```

## 2. DSPRingBufferMixer Datamodell (`liveAudioPlayback.ts`)
```typescript
export type SwarmAudioChannel = 'folja' | 'forlikas' | 'vanda_om';

export const CHANNEL_PAN_CONFIG: Record<SwarmAudioChannel, number> = {
  folja: -0.4,    // Vänster
  forlikas: 0.0,  // Mitten
  vanda_om: 0.4,  // Höger
};

export interface ChannelNodes {
  panner?: StereoPannerNode;
  gain?: GainNode;
  nextPlayTime: number;
  activeSources: Set<AudioBufferSourceNode>;
}
```

## 3. Preemptive Floor Controller Modell (`geminiLiveSession.ts`)
```typescript
export const CHANNEL_PRIORITY: Record<SwarmAudioChannel, number> = {
  forlikas: 1, // Högst
  vanda_om: 2, // Medel
  folja: 3,    // Lägst
};

export interface FloorQueueItem {
  channel: SwarmAudioChannel;
  priority: number;
  requestedAt: number;
}
```
- **Preemption**: Om talare har lägre prioritet (t.ex. folja=3) och inkommande är forlikas=1, rampar vi talarens Gain till 0 på < 20 ms, skickar dröjt stop till dess aktiva källnoder, publicerar `swarm.floor.preempted`, och ger golvet till forlikas.
- **Arbitration Window**: 15 ms fördröjning samlar förfrågningar när golvet är ledigt innan det allokeras.
- **Cancellation**: `cancelFloorRequest(channel)` plockar bort ur kön.
