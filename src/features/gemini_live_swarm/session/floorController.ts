import { SwarmAudioChannel } from './liveAudioPlayback.ts';
import { SwarmEventBus } from '../bus/swarmEventBus.ts';

export const CHANNEL_PRIORITY: Record<SwarmAudioChannel, number> = {
  forlikas: 1,
  vanda_om: 2,
  folja: 3,
};

export const AGENT_VOICE_MAP: Record<SwarmAudioChannel, string> = {
  folja: 'Puck',
  forlikas: 'Aoede',
  vanda_om: 'Charon',
};

export interface FloorQueueItem {
  channel: SwarmAudioChannel;
  priority: number;
  requestedAt: number;
}

export class FloorController {
  private currentSpeaker: SwarmAudioChannel | null = null;
  private floorQueue: FloorQueueItem[] = [];
  private arbitrationTimer: any = null;
  private eventBus: SwarmEventBus;

  constructor(eventBus: SwarmEventBus) {
    this.eventBus = eventBus;
  }

  public getCurrentSpeaker(): SwarmAudioChannel | null {
    return this.currentSpeaker;
  }

  public requestFloor(
    channel: SwarmAudioChannel,
    onPreempt?: (preempted: SwarmAudioChannel, challenger: SwarmAudioChannel) => void,
    onGrant?: (speaker: SwarmAudioChannel) => void
  ): boolean {
    const priority = CHANNEL_PRIORITY[channel];
    if (this.currentSpeaker && this.currentSpeaker !== channel) {
      const currentPrio = CHANNEL_PRIORITY[this.currentSpeaker];
      if (priority < currentPrio) {
        const preempted = this.currentSpeaker;
        this.currentSpeaker = channel;
        if (onPreempt) onPreempt(preempted, channel);
        this.eventBus.publishLiveEvent('swarm.floor.preempted', { preemptedChannel: preempted, byChannel: channel });
        return true;
      }
    }
    if (!this.currentSpeaker) {
      this.floorQueue.push({ channel, priority, requestedAt: Date.now() });
      if (!this.arbitrationTimer) {
        this.arbitrationTimer = setTimeout(() => this.arbitrateFloor(onGrant), 15);
      }
    }
    return false;
  }

  public cancelFloor(channel: SwarmAudioChannel): void {
    this.floorQueue = this.floorQueue.filter((req) => req.channel !== channel);
  }

  public releaseFloor(channel?: SwarmAudioChannel, onGrant?: (speaker: SwarmAudioChannel) => void): void {
    if (!channel || this.currentSpeaker === channel) {
      this.currentSpeaker = null;
      if (this.floorQueue.length > 0 && !this.arbitrationTimer) {
        this.arbitrationTimer = setTimeout(() => this.arbitrateFloor(onGrant), 15);
      }
    }
  }

  private arbitrateFloor(onGrant?: (speaker: SwarmAudioChannel) => void): void {
    this.arbitrationTimer = null;
    if (this.floorQueue.length === 0) return;
    this.floorQueue.sort((a, b) => a.priority - b.priority || a.requestedAt - b.requestedAt);
    const winner = this.floorQueue.shift()!;
    this.currentSpeaker = winner.channel;
    if (onGrant) onGrant(winner.channel);
    this.eventBus.publishLiveEvent('swarm.floor.granted', { channel: winner.channel, priority: winner.priority });
  }

  public reset(): void {
    if (this.arbitrationTimer) {
      clearTimeout(this.arbitrationTimer);
      this.arbitrationTimer = null;
    }
    this.currentSpeaker = null;
    this.floorQueue = [];
  }
}
