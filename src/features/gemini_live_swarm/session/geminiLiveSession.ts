import { GoogleGenAI } from '@google/genai';
import {
  LiveSessionStatus,
  LiveStreamChunk,
  LiveStreamChunkSchema,
  ReconciliationForce,
} from '../telemetry/telemetrySchema.ts';
import { SwarmEventBus, getGlobalSwarmEventBus } from '../bus/swarmEventBus.ts';

export interface AgentThoughtResponse {
  agentRole: string;
  thought: string;
  content: string;
  suggestedTools?: string[];
  score?: number;
}

export class GeminiLiveSession {
  private aiClient: GoogleGenAI | null = null;
  private modelName = 'gemini-3.8-flash';
  private liveModelName = 'gemini-3.8-live';
  private liveStatus: LiveSessionStatus = 'IDLE';
  private eventBus: SwarmEventBus;
  private streamListeners = new Set<(chunk: LiveStreamChunk) => void>();
  private currentStreamId: string | null = null;

  constructor(apiKey?: string, eventBus?: SwarmEventBus) {
    this.eventBus = eventBus || getGlobalSwarmEventBus();
    const key = apiKey || (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined);

    if (!key || key === 'MY_GEMINI_API_KEY') {
      this.liveStatus = 'HALTED';
      this.eventBus.publishLiveEvent('swarm.live.session.halted', {
        reason: 'GEMINI_API_KEY saknas i miljön. Produktionsmockar är avstängda.',
        status: 'HALTED',
      });
      return;
    }

    try {
      this.aiClient = new GoogleGenAI({ apiKey: key });
    } catch (e) {
      this.liveStatus = 'HALTED';
      this.eventBus.publishLiveEvent('swarm.live.session.halted', {
        reason: `Initialiseringsfel för GoogleGenAI: ${e instanceof Error ? e.message : String(e)}`,
        status: 'HALTED',
      });
    }
  }

  public setApiKey(apiKey: string): void {
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      this.aiClient = null;
      this.liveStatus = 'HALTED';
      return;
    }
    this.aiClient = new GoogleGenAI({ apiKey });
    this.liveStatus = 'IDLE';
  }

  public getLiveStatus(): LiveSessionStatus {
    return this.liveStatus;
  }

  public isLiveConnected(): boolean {
    return this.liveStatus === 'STREAMING' || this.liveStatus === 'CONNECTING';
  }

  public onStreamChunk(listener: (chunk: LiveStreamChunk) => void): () => void {
    this.streamListeners.add(listener);
    return () => {
      this.streamListeners.delete(listener);
    };
  }

  public async connectLive(config?: {
    responseModalities?: ('audio' | 'text')[];
    systemInstruction?: string;
  }): Promise<boolean> {
    if (this.liveStatus === 'HALTED' || !this.aiClient) {
      throw new Error('Kan inte ansluta Gemini Live: Session är HALTED p.g.a. saknad GEMINI_API_KEY.');
    }
    this.liveStatus = 'CONNECTING';
    const streamId = `stream-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    this.currentStreamId = streamId;

    this.eventBus.publishLiveEvent('swarm.live.session.connected', {
      streamId,
      status: 'CONNECTED',
      model: this.liveModelName,
      responseModalities: config?.responseModalities || ['text', 'audio'],
      systemInstruction: config?.systemInstruction || 'Försoningsmotorns kompass aktiv.',
      connectedAt: new Date().toISOString(),
    });

    this.liveStatus = 'STREAMING';
    return true;
  }

  public async disconnectLive(reason = 'Klientsession avslutad normalt'): Promise<void> {
    const streamId = this.currentStreamId || `stream-${Date.now()}`;
    this.liveStatus = 'DISCONNECTED';

    this.eventBus.publishLiveEvent('swarm.live.session.disconnected', {
      streamId,
      status: 'DISCONNECTED',
      reason,
      disconnectedAt: new Date().toISOString(),
    });

    this.currentStreamId = null;
  }

  public async sendRealtimeText(
    text: string,
    force?: ReconciliationForce
  ): Promise<LiveStreamChunk> {
    if (this.liveStatus === 'HALTED' || !this.aiClient) {
      throw new Error('Gemini Live session är i HALTED-läge. Giltig GEMINI_API_KEY krävs.');
    }
    if (!this.isLiveConnected()) {
      await this.connectLive();
    }

    const streamId = this.currentStreamId || `stream-${Date.now()}`;
    const userChunk: LiveStreamChunk = {
      streamId,
      sourceRole: 'user',
      force,
      textChunk: text,
      transcription: text,
      isFinal: true,
      timestamp: new Date().toISOString(),
    };
    LiveStreamChunkSchema.parse(userChunk);

    this.eventBus.publishLiveEvent('swarm.live.stream.text', { ...userChunk });
    this.notifyListeners(userChunk);
    return userChunk;
  }

  public async sendRealtimeAudio(
    audioChunkBase64: string,
    mimeType = 'audio/pcm;rate=16000'
  ): Promise<LiveStreamChunk> {
    if (this.liveStatus === 'HALTED' || !this.aiClient) {
      throw new Error('Gemini Live audio är i HALTED-läge. Giltig GEMINI_API_KEY krävs.');
    }
    if (!this.isLiveConnected()) {
      await this.connectLive();
    }

    const streamId = this.currentStreamId || `stream-${Date.now()}`;
    const audioChunk: LiveStreamChunk = {
      streamId,
      sourceRole: 'user',
      audioChunkBase64,
      isFinal: false,
      timestamp: new Date().toISOString(),
    };
    LiveStreamChunkSchema.parse(audioChunk);

    this.eventBus.publishLiveEvent('swarm.live.stream.audio', {
      streamId,
      mimeType,
      byteLength: audioChunkBase64.length,
      hasAudio: true,
      timestamp: audioChunk.timestamp,
    });
    this.notifyListeners(audioChunk);
    return audioChunk;
  }

  private notifyListeners(chunk: LiveStreamChunk): void {
    for (const listener of this.streamListeners) {
      try {
        listener(chunk);
      } catch (err) {
        console.error('[GeminiLiveSession] Fel i stream listener:', err);
      }
    }
  }

  public async generateAgentTurn(params: {
    role: string;
    systemInstruction: string;
    prompt: string;
    context?: string;
  }): Promise<AgentThoughtResponse> {
    if (!this.aiClient || this.liveStatus === 'HALTED') {
      throw new Error(
        `Gemini API-nyckel saknas för agent ${params.role}: GeminiLiveSession är i HALTED-läge. Produktionsmockar är avstängda enligt Fail-Fast.`
      );
    }

    const response = await this.aiClient.models.generateContent({
      model: this.modelName,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Roll: ${params.role}\nInstruktion: ${params.systemInstruction}\nKontext: ${params.context || ''}\nUppdrag: ${params.prompt}`,
            },
          ],
        },
      ],
    });

    return {
      agentRole: params.role,
      thought: `Analys och syntes genererad via ${this.modelName}`,
      content: response.text || '',
    };
  }
}
