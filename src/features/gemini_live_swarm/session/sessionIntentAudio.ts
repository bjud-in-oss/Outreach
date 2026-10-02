import { SwarmEventBus } from '../bus/swarmEventBus.ts';
import { SwarmIntent, INTENT_FORCE_MAP } from '../ui/splitPaneHelper.ts';

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
