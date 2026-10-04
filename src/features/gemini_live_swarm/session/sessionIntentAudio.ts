import { SwarmEventBus } from '../bus/swarmEventBus.ts';
import { SwarmIntent, INTENT_FORCE_MAP } from '../ui/splitPaneHelper.ts';

export function createBidiSetupPayload(systemInstruction?: string, model = 'models/gemini-3.8-live') {
  return {
    setup: {
      model,
      generationConfig: {
        responseModalities: ['audio', 'AUDIO', 'text', 'TEXT'],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' } } },
        thinkingConfig: { thinkingBudget: 1024, extendedThinking: true },
      },
      systemInstruction: { parts: [{ text: systemInstruction || 'Försoningsmotorns kompass aktiv.' }] },
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
    sumSquares += samples[i] * samples[i];
    if (i > 0 && ((samples[i] >= 0 && samples[i - 1] < 0) || (samples[i] < 0 && samples[i - 1] >= 0))) {
      zeroCrossings++;
    }
  }
  const rms = Math.sqrt(sumSquares / samples.length);
  const zcr = zeroCrossings / samples.length;
  return { isSpeech: rms > rmsThreshold && zcr > zcrThreshold, rms, zcr };
}

export class AudioPreRollBuffer {
  private buffer: Float32Array;
  private writePointer = 0;
  private capacity: number;
  private isFull = false;

  constructor(capacity = 3200) {
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
    if (!this.isFull) return this.buffer.slice(0, this.writePointer);
    const result = new Float32Array(this.capacity);
    const firstPart = this.buffer.slice(this.writePointer);
    result.set(firstPart, 0);
    result.set(this.buffer.slice(0, this.writePointer), firstPart.length);
    return result;
  }

  public clear(): void {
    this.buffer.fill(0);
    this.writePointer = 0;
    this.isFull = false;
  }
}

export class SessionIntentManager {
  private activeIntent: SwarmIntent | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private audioProcessor: ScriptProcessorNode | null = null;
  private eventBus: SwarmEventBus;
  private preRollBuffer = new AudioPreRollBuffer(3200);
  private isVadStreaming = false;
  private lastSpeechTime = 0;
  private readonly postRollMs = 500;

  constructor(eventBus: SwarmEventBus) {
    this.eventBus = eventBus;
  }

  public getActiveIntent(): SwarmIntent | null { return this.activeIntent; }
  public getAudioContext(): AudioContext | null { return this.audioContext; }
  public getMediaStream(): MediaStream | null { return this.mediaStream; }
  public getPreRollBuffer(): AudioPreRollBuffer { return this.preRollBuffer; }

  public async activateIntent(intent: SwarmIntent, onAudioConnect?: () => Promise<void>): Promise<void> {
    if (this.activeIntent === intent) {
      this.deactivateIntent();
      return;
    }
    await this.initUserGestureAudio();
    if (onAudioConnect) {
      try { await onAudioConnect(); } catch (err) { this.deactivateIntent(); throw err; }
    }
    this.activeIntent = intent;
    const meta = INTENT_FORCE_MAP[intent];
    this.eventBus.publishLiveEvent('swarm.live.intent.activated', {
      intent, force: meta.force, title: meta.title, status: 'ACTIVE', activityText: `Aktiv röstström: ${meta.title}`,
    });
  }

  public deactivateIntent(): void {
    this.activeIntent = null;
    this.isVadStreaming = false;
    this.preRollBuffer.clear();
    this.stopAudioStream();
    this.eventBus.publishLiveEvent('swarm.live.intent.deactivated', {
      intent: null, status: 'THINKING', activityText: '🟡 Agenter i dvala',
    });
  }

  public emitAudioTalking(): void {
    this.eventBus.publishLiveEvent('swarm.live.audio.talking', { state: 'SWARM_TALKING', activityText: '🔊 Agenten talar' });
  }

  public emitAudioThinking(): void {
    this.eventBus.publishLiveEvent('swarm.live.audio.thinking', { state: 'SWARM_THINKING', activityText: '🧠 Agenten reflekterar' });
  }

  private async initUserGestureAudio(): Promise<void> {
    if (typeof window === 'undefined') return;
    this.ensureAudioContext();
    try {
      if (navigator?.mediaDevices?.getUserMedia) {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.startPCM16Sampling(this.mediaStream);
      }
    } catch { /* media fallback */ }
  }

  private startPCM16Sampling(stream: MediaStream): void {
    if (!this.audioContext) return;
    try {
      const source = this.audioContext.createMediaStreamSource(stream);
      this.audioProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);
      this.audioProcessor.onaudioprocess = (e) => {
        if (!this.activeIntent) return;
        this.processIncomingChunk(e.inputBuffer.getChannelData(0));
      };
      source.connect(this.audioProcessor);
      this.audioProcessor.connect(this.audioContext.destination);
    } catch { /* sampling fallback */ }
  }

  public processIncomingChunk(inputData: Float32Array): void {
    const currentRate = this.audioContext?.sampleRate || 16000;
    let target16k = inputData;
    if (currentRate !== 16000 && currentRate > 0) {
      const ratio = currentRate / 16000;
      const newLen = Math.round(inputData.length / ratio);
      target16k = new Float32Array(newLen);
      for (let i = 0; i < newLen; i++) target16k[i] = inputData[Math.round(i * ratio)];
    }

    const vad = detectSpeechPCM(target16k);
    const now = Date.now();
    if (vad.isSpeech) {
      this.lastSpeechTime = now;
      if (!this.isVadStreaming) {
        this.isVadStreaming = true;
        const preRoll = this.preRollBuffer.flush();
        this.preRollBuffer.clear();
        if (preRoll.length > 0) this.emitPcm(preRoll);
      }
      this.emitPcm(target16k);
    } else if (this.isVadStreaming) {
      if (now - this.lastSpeechTime < this.postRollMs) {
        this.emitPcm(target16k);
      } else {
        this.isVadStreaming = false;
        this.preRollBuffer.push(target16k);
      }
    } else {
      this.preRollBuffer.push(target16k);
    }
  }

  private emitPcm(samples: Float32Array): void {
    const pcm16 = floatTo16BitPCM(samples);
    let binary = '';
    const bytes = new Uint8Array(pcm16.buffer);
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    const base64PCM = btoa(binary);
    this.eventBus.publishLiveEvent('swarm.live.stream.audio', {
      streamId: `mic-${Date.now()}`, mimeType: 'audio/pcm;rate=16000', byteLength: base64PCM.length,
      hasAudio: true, audioChunkBase64: base64PCM, timestamp: new Date().toISOString(),
    });
  }

  private ensureAudioContext(): void {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    if (!this.audioContext) {
      try { this.audioContext = new AudioCtx({ sampleRate: 16000 }); } catch { this.audioContext = new AudioCtx(); }
      return;
    }
    if (this.audioContext.state === 'suspended') this.audioContext.resume().catch(() => {});
  }

  private stopAudioStream(): void {
    if (this.audioProcessor) { try { this.audioProcessor.disconnect(); } catch {} this.audioProcessor = null; }
    if (this.mediaStream) { try { this.mediaStream.getTracks().forEach((t) => t.stop()); } catch {} this.mediaStream = null; }
  }

  public dispose(): void {
    this.deactivateIntent();
    if (this.audioContext) { try { this.audioContext.close(); } catch {} this.audioContext = null; }
  }
}
