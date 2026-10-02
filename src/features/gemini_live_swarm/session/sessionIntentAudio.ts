import { SwarmEventBus } from '../bus/swarmEventBus.ts';
import { SwarmIntent, INTENT_FORCE_MAP } from '../ui/splitPaneHelper.ts';

export function createBidiSetupPayload(systemInstruction?: string) {
  const text = systemInstruction || 'Försoningsmotorns kompass aktiv.';
  return {
    setup: {
      model: 'models/gemini-3.8-live',
      generationConfig: {
        responseModalities: ['audio'],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' } } },
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
  private eventBus: SwarmEventBus;

  constructor(eventBus: SwarmEventBus) {
    this.eventBus = eventBus;
  }

  public getActiveIntent(): SwarmIntent | null {
    return this.activeIntent;
  }

  public getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  public getMediaStream(): MediaStream | null {
    return this.mediaStream;
  }

  public async activateIntent(
    intent: SwarmIntent,
    onAudioConnect?: () => Promise<void>
  ): Promise<void> {
    if (this.activeIntent === intent) {
      this.deactivateIntent();
      return;
    }

    this.activeIntent = intent;
    await this.initUserGestureAudio();

    if (onAudioConnect) {
      try {
        await onAudioConnect();
      } catch {
        /* fail-fast log handled by session */
      }
    }

    const intentMeta = INTENT_FORCE_MAP[intent];
    this.eventBus.publishLiveEvent('swarm.live.intent.activated', {
      intent,
      force: intentMeta.force,
      title: intentMeta.title,
      status: 'ACTIVE',
      activityText: `Aktiv röstström: ${intentMeta.title}`,
    });
  }

  public deactivateIntent(): void {
    this.activeIntent = null;
    this.stopAudioStream();

    this.eventBus.publishLiveEvent('swarm.live.intent.deactivated', {
      intent: null,
      status: 'THINKING',
      activityText: '🟡 Agenter i dvala',
    });
  }

  public emitAudioTalking(): void {
    this.eventBus.publishLiveEvent('swarm.live.audio.talking', {
      state: 'SWARM_TALKING',
      activityText: '🔊 Agenten talar',
    });
  }

  public emitAudioThinking(): void {
    this.eventBus.publishLiveEvent('swarm.live.audio.thinking', {
      state: 'SWARM_THINKING',
      activityText: '🧠 Agenten reflekterar',
    });
  }

  private async initUserGestureAudio(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      this.ensureAudioContext();
    } catch {
      /* AudioContext fallback handled */
    }

    try {
      if (navigator?.mediaDevices?.getUserMedia) {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch {
      /* Media stream fallback */
    }
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
    if (!this.mediaStream) return;
    try {
      this.mediaStream.getTracks().forEach((t) => t.stop());
    } catch {
      /* stream stop fallback */
    }
    this.mediaStream = null;
  }

  public dispose(): void {
    this.deactivateIntent();
    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch {
        /* close fallback */
      }
      this.audioContext = null;
    }
  }
}
