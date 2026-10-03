import { SwarmEventBus } from '../bus/swarmEventBus.ts';
import { SwarmIntent, INTENT_FORCE_MAP } from '../ui/splitPaneHelper.ts';

export function createBidiSetupPayload(systemInstruction?: string, model = 'models/gemini-3.8-live') {
  const text = systemInstruction || 'Försoningsmotorns kompass aktiv.';
  return {
    setup: {
      model,
      generationConfig: {
        responseModalities: ['audio', 'AUDIO', 'text', 'TEXT'],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' } } },
        thinkingConfig: { thinkingBudget: 1024, extendedThinking: true },
      },
      systemInstruction: { parts: [{ text }] },
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

export class SessionIntentManager {
  private activeIntent: SwarmIntent | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private audioProcessor: ScriptProcessorNode | null = null;
  private eventBus: SwarmEventBus;

  constructor(eventBus: SwarmEventBus) {
    this.eventBus = eventBus;
  }

  public getActiveIntent(): SwarmIntent | null { return this.activeIntent; }
  public getAudioContext(): AudioContext | null { return this.audioContext; }
  public getMediaStream(): MediaStream | null { return this.mediaStream; }

  public async activateIntent(intent: SwarmIntent, onAudioConnect?: () => Promise<void>): Promise<void> {
    if (this.activeIntent === intent) {
      this.deactivateIntent();
      return;
    }

    await this.initUserGestureAudio();

    if (onAudioConnect) {
      try {
        await onAudioConnect();
      } catch (err) {
        this.deactivateIntent();
        throw err;
      }
    }

    this.activeIntent = intent;
    const intentMeta = INTENT_FORCE_MAP[intent];
    this.eventBus.publishLiveEvent('swarm.live.intent.activated', {
      intent, force: intentMeta.force, title: intentMeta.title,
      status: 'ACTIVE', activityText: `Aktiv röstström: ${intentMeta.title}`,
    });
  }

  public deactivateIntent(): void {
    this.activeIntent = null;
    this.stopAudioStream();

    this.eventBus.publishLiveEvent('swarm.live.intent.deactivated', {
      intent: null, status: 'THINKING', activityText: '🟡 Agenter i dvala',
    });
  }

  public emitAudioTalking(): void {
    this.eventBus.publishLiveEvent('swarm.live.audio.talking', {
      state: 'SWARM_TALKING', activityText: '🔊 Agenten talar',
    });
  }

  public emitAudioThinking(): void {
    this.eventBus.publishLiveEvent('swarm.live.audio.thinking', {
      state: 'SWARM_THINKING', activityText: '🧠 Agenten reflekterar',
    });
  }

  private async initUserGestureAudio(): Promise<void> {
    if (typeof window === 'undefined') return;
    this.ensureAudioContext();

    try {
      if (navigator?.mediaDevices?.getUserMedia) {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.startPCM16Sampling(this.mediaStream);
      }
    } catch {
      /* media fallback */
    }
  }

  private startPCM16Sampling(stream: MediaStream): void {
    if (!this.audioContext) return;
    try {
      const source = this.audioContext.createMediaStreamSource(stream);
      this.audioProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.audioProcessor.onaudioprocess = (e) => {
        if (!this.activeIntent) return;
        this.emitMicPcmChunk(e.inputBuffer.getChannelData(0));
      };

      source.connect(this.audioProcessor);
      this.audioProcessor.connect(this.audioContext.destination);
    } catch {
      /* sampling fallback */
    }
  }

  private emitMicPcmChunk(inputData: Float32Array): void {
    const pcm16 = floatTo16BitPCM(inputData);
    let binary = '';
    const bytes = new Uint8Array(pcm16.buffer);
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    const base64PCM = btoa(binary);

    this.eventBus.publishLiveEvent('swarm.live.stream.audio', {
      streamId: `mic-${Date.now()}`, mimeType: 'audio/pcm;rate=16000',
      byteLength: base64PCM.length, hasAudio: true, audioChunkBase64: base64PCM, timestamp: new Date().toISOString(),
    });
  }

  private ensureAudioContext(): void {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    if (!this.audioContext) {
      this.audioContext = new AudioCtx();
      return;
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }
  }

  private stopAudioStream(): void {
    if (this.audioProcessor) {
      try { this.audioProcessor.disconnect(); } catch { /* ignore */ }
      this.audioProcessor = null;
    }
    if (this.mediaStream) {
      try { this.mediaStream.getTracks().forEach((t) => t.stop()); } catch { /* ignore */ }
      this.mediaStream = null;
    }
  }

  public dispose(): void {
    this.deactivateIntent();
    if (this.audioContext) {
      try { this.audioContext.close(); } catch { /* ignore */ }
      this.audioContext = null;
    }
  }
}