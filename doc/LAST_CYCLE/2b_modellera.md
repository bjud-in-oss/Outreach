# Steg 2b: Modellera DSP Mixer & Floor Control (TCK-022a)

## 1. DSPRingBufferMixer Datamodell (`liveAudioPlayback.ts`)
```typescript
export type SwarmAudioChannel = 'folja' | 'forlikas' | 'vanda_om';

export interface ChannelNode {
  panner: StereoPannerNode;
  gain: GainNode;
  nextPlayTime: number;
  activeSources: Set<AudioBufferSourceNode>;
}

export const CHANNEL_PAN_CONFIG: Record<SwarmAudioChannel, number> = {
  folja: -0.4,    // Vänster
  forlikas: 0.0,  // Mitten
  vanda_om: 0.4,  // Höger
};
```

## 2. Floor Control Modell (`geminiLiveSession.ts`)
```typescript
export interface FloorRequest {
  channel: SwarmAudioChannel;
  priority: number; // 1 = forlikas, 2 = vanda_om, 3 = folja
  requestedAt: number;
}

export const CHANNEL_PRIORITY: Record<SwarmAudioChannel, number> = {
  forlikas: 1,
  vanda_om: 2,
  folja: 3,
};
```
- **Preemption**: Om `currentSpeaker` har prioritet > inkommande `request.priority`, rampar vi `currentSpeaker` till Gain 0 inom 18 ms, publicerar `swarm.floor.preempted`, och tilldelar golvet till utmanaren.
- **Arbitration Window**: 15 ms timeout samlar förfrågningar när golvet är ledigt innan det allokeras till den med lägst siffra (högst prioritet).

## 3. Pre-Roll Ringbuffert Modell (`sessionIntentAudio.ts`)
```typescript
export class AudioPreRollBuffer {
  private buffer: Float32Array;
  private writePointer = 0;
  private capacity: number;
  private filled = false;

  constructor(capacity = 3200) { // 200 ms vid 16kHz
    this.capacity = capacity;
    this.buffer = new Float32Array(capacity);
  }

  public push(samples: Float32Array): void { ... }
  public flush(): Float32Array { ... }
  public clear(): void { ... }
}
```
