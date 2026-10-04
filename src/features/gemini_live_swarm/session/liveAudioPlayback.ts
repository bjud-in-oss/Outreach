export type SwarmAudioChannel = 'folja' | 'forlikas' | 'vanda_om';

export const CHANNEL_PAN_CONFIG: Record<SwarmAudioChannel, number> = {
  folja: -0.4,
  forlikas: 0.0,
  vanda_om: 0.4,
};

interface ChannelNodes {
  panner: StereoPannerNode | null;
  gain: GainNode | null;
  simulatedGain: number;
  nextPlayTime: number;
  activeSources: Set<AudioBufferSourceNode>;
}

export class DSPRingBufferMixer {
  private audioCtx: AudioContext | null = null;
  private channels: Map<SwarmAudioChannel, ChannelNodes> = new Map();

  constructor() {
    const keys: SwarmAudioChannel[] = ['folja', 'forlikas', 'vanda_om'];
    for (const key of keys) {
      this.channels.set(key, {
        panner: null, gain: null, simulatedGain: 1.0, nextPlayTime: 0, activeSources: new Set(),
      });
    }
  }

  private initChannelNode(key: SwarmAudioChannel, panVal: number): void {
    if (!this.audioCtx) return;
    const ch = this.channels.get(key);
    if (!ch || (ch.panner && ch.gain)) return;
    try {
      const panner = this.audioCtx.createStereoPanner();
      panner.pan.value = panVal;
      const gain = this.audioCtx.createGain();
      gain.gain.value = ch.simulatedGain;
      panner.connect(gain);
      gain.connect(this.audioCtx.destination);
      ch.panner = panner;
      ch.gain = gain;
    } catch {}
  }

  private ensureAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      try { this.audioCtx = new AudioCtx({ sampleRate: 24000 }); } catch { return null; }
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    for (const [key, panVal] of Object.entries(CHANNEL_PAN_CONFIG) as Array<[SwarmAudioChannel, number]>) {
      this.initChannelNode(key, panVal);
    }
    return this.audioCtx;
  }

  public play24kHzPCMBase64(channel: SwarmAudioChannel, base64Data: string, onTalking?: () => void): void {
    const ch = this.channels.get(channel);
    if (!ch) return;
    try {
      const rawBinary = atob(base64Data);
      const bytes = new Uint8Array(rawBinary.length);
      for (let i = 0; i < rawBinary.length; i++) bytes[i] = rawBinary.charCodeAt(i);
      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) float32Array[i] = int16Array[i] / 32768.0;

      const duration = float32Array.length / 24000;
      const ctx = this.ensureAudioContext();
      if (ctx && ch.panner) {
        const buffer = ctx.createBuffer(1, float32Array.length, 24000);
        buffer.getChannelData(0).set(float32Array);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ch.panner);
        const startTime = Math.max(ctx.currentTime, ch.nextPlayTime);
        source.start(startTime);
        ch.nextPlayTime = startTime + duration;
        ch.activeSources.add(source);
        source.onended = () => ch.activeSources.delete(source);
      } else {
        ch.nextPlayTime += duration;
      }
      if (onTalking) onTalking();
    } catch {}
  }

  public rampGain(channel: SwarmAudioChannel, targetGain: number, durationMs = 18): void {
    const ch = this.channels.get(channel);
    if (!ch) return;
    ch.simulatedGain = targetGain;
    const ctx = this.audioCtx;
    if (ctx && ch.gain) {
      const now = ctx.currentTime;
      const rampEnd = now + durationMs / 1000;
      ch.gain.gain.cancelScheduledValues(now);
      ch.gain.gain.setValueAtTime(ch.gain.gain.value, now);
      ch.gain.gain.linearRampToValueAtTime(targetGain, rampEnd);
      if (targetGain === 0) {
        this.scheduleSourceStops(ch, rampEnd + 0.002, durationMs);
      }
    } else if (targetGain === 0) {
      ch.activeSources.clear();
      ch.nextPlayTime = 0;
    }
  }

  private scheduleSourceStops(ch: ChannelNodes, stopTime: number, durationMs: number): void {
    for (const src of ch.activeSources) {
      try { src.stop(stopTime); } catch {}
    }
    setTimeout(() => {
      ch.activeSources.clear();
      ch.nextPlayTime = 0;
    }, durationMs + 5);
  }

  public getChannelGain(channel: SwarmAudioChannel): number {
    const ch = this.channels.get(channel);
    if (!ch) return 0;
    return ch.gain ? ch.gain.gain.value : ch.simulatedGain;
  }

  public clearBuffer(channel?: SwarmAudioChannel): void {
    const targets = channel ? [channel] : (Array.from(this.channels.keys()) as SwarmAudioChannel[]);
    for (const key of targets) {
      const ch = this.channels.get(key);
      if (!ch) continue;
      for (const src of ch.activeSources) {
        try { src.stop(); } catch {}
      }
      ch.activeSources.clear();
      ch.nextPlayTime = 0;
      if (ch.gain && this.audioCtx) {
        ch.gain.gain.cancelScheduledValues(this.audioCtx.currentTime);
        ch.gain.gain.setValueAtTime(ch.simulatedGain, this.audioCtx.currentTime);
      }
    }
  }

  public dispose(): void {
    this.clearBuffer();
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      try { this.audioCtx.close(); } catch {}
      this.audioCtx = null;
    }
  }
}

export class LiveAudioPlayer extends DSPRingBufferMixer {}
