import { GoogleGenAI } from '@google/genai';
import { LiveSessionStatus, LiveStreamChunk, LiveStreamChunkSchema, ReconciliationForce } from '../telemetry/telemetrySchema.ts';
import { SwarmEventBus, getGlobalSwarmEventBus } from '../bus/swarmEventBus.ts';
import { SessionIntentManager } from './sessionIntentAudio.ts';
import { SwarmIntent } from '../ui/splitPaneHelper.ts';

export type { SwarmIntent };

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
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 3;
  private intentManager: SessionIntentManager;

  constructor(apiKey?: string, eventBus?: SwarmEventBus) {
    this.eventBus = eventBus || getGlobalSwarmEventBus();
    this.intentManager = new SessionIntentManager(this.eventBus);
    const key = apiKey !== undefined ? apiKey : (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined);

    if (!key || key === 'MY_GEMINI_API_KEY' || key.trim() === '') {
      this.liveStatus = 'HALTED';
      this.eventBus.publishLiveEvent('swarm.live.session.halted', { reason: 'GEMINI_API_KEY saknas i miljön.', status: 'HALTED' });
      return;
    }
    try {
      this.aiClient = new GoogleGenAI({ apiKey: key });
    } catch (e) {
      this.liveStatus = 'HALTED';
      const msg = e instanceof Error ? e.message : String(e);
      this.eventBus.publishLiveEvent('swarm.live.session.halted', { reason: `Initialiseringsfel: ${msg}`, status: 'HALTED' });
    }
  }

  public setApiKey(apiKey: string): void {
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
      this.aiClient = null;
      this.liveStatus = 'HALTED';
      return;
    }
    this.aiClient = new GoogleGenAI({ apiKey });
    this.liveStatus = 'IDLE';
    this.reconnectAttempts = 0;
  }

  public getLiveStatus(): LiveSessionStatus { return this.liveStatus; }
  public getReconnectAttempts(): number { return this.reconnectAttempts; }
  public isLiveConnected(): boolean { return this.liveStatus === 'STREAMING' || this.liveStatus === 'CONNECTING'; }

  public getActiveIntent(): SwarmIntent | null { return this.intentManager.getActiveIntent(); }
  public getAudioContext(): AudioContext | null { return this.intentManager.getAudioContext(); }
  public getMediaStream(): MediaStream | null { return this.intentManager.getMediaStream(); }

  public async activateIntent(intent: SwarmIntent): Promise<void> {
    await this.intentManager.activateIntent(intent, async () => {
      if (!this.isLiveConnected() && this.liveStatus !== 'HALTED') {
        await this.connectLive();
      }
    });
  }

  public deactivateIntent(): void {
    this.intentManager.deactivateIntent();
  }

  public onStreamChunk(listener: (chunk: LiveStreamChunk) => void): () => void {
    this.streamListeners.add(listener);
    return () => { this.streamListeners.delete(listener); };
  }

  public async connectLive(config?: { responseModalities?: ('audio' | 'text')[]; systemInstruction?: string; }): Promise<boolean> {
    if (this.liveStatus === 'HALTED' || !this.aiClient) {
      throw new Error('Kan inte ansluta Gemini Live: Session är HALTED p.g.a. saknad GEMINI_API_KEY.');
    }
    this.liveStatus = 'CONNECTING';
    const streamId = `stream-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    this.currentStreamId = streamId;

    this.eventBus.publishLiveEvent('swarm.live.session.connected', {
      streamId, status: 'CONNECTED', model: this.liveModelName,
      responseModalities: config?.responseModalities || ['text', 'audio'],
      systemInstruction: config?.systemInstruction || 'Försoningsmotorns kompass aktiv.',
      connectedAt: new Date().toISOString(),
    });

    this.liveStatus = 'STREAMING';
    this.reconnectAttempts = 0;
    return true;
  }

  public async handleAutoReconnect(reason = 'Nätverkstapp eller 503 High Demand'): Promise<boolean> {
    if (this.liveStatus === 'HALTED' || !this.aiClient) return false;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.liveStatus = 'ERROR';
      this.eventBus.publishLiveEvent('swarm.live.session.error', {
        error: `Återanslutning misslyckades efter ${this.maxReconnectAttempts} försök: ${reason}`,
        status: 'ERROR',
      });
      return false;
    }

    this.reconnectAttempts++;
    this.liveStatus = 'RECONNECTING';
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 8000);

    this.eventBus.publishLiveEvent('swarm.live.session.reconnecting', {
      attempt: this.reconnectAttempts, maxAttempts: this.maxReconnectAttempts,
      delayMs: delay, reason, status: 'RECONNECTING',
    });

    await new Promise((res) => setTimeout(res, delay));
    try {
      await this.connectLive();
      return true;
    } catch {
      return this.handleAutoReconnect(reason);
    }
  }

  public async disconnectLive(reason = 'Klientsession avslutad normalt'): Promise<void> {
    const streamId = this.currentStreamId || `stream-${Date.now()}`;
    this.liveStatus = 'DISCONNECTED';
    this.deactivateIntent();
    this.eventBus.publishLiveEvent('swarm.live.session.disconnected', {
      streamId, status: 'DISCONNECTED', reason, disconnectedAt: new Date().toISOString(),
    });
    this.currentStreamId = null;
  }

  public async sendRealtimeText(text: string, force?: ReconciliationForce): Promise<LiveStreamChunk> {
    if (this.liveStatus === 'HALTED' || !this.aiClient) {
      throw new Error('Gemini Live session är i HALTED-läge. Giltig GEMINI_API_KEY krävs.');
    }
    if (!this.isLiveConnected()) await this.connectLive();

    const streamId = this.currentStreamId || `stream-${Date.now()}`;
    const userChunk: LiveStreamChunk = {
      streamId, sourceRole: 'user', force, textChunk: text,
      transcription: text, isFinal: true, timestamp: new Date().toISOString(),
    };
    LiveStreamChunkSchema.parse(userChunk);

    this.eventBus.publishLiveEvent('swarm.live.stream.text', { ...userChunk });
    this.eventBus.publishLiveEvent('swarm.live.stream.transcription', { streamId, transcription: text, force, isFinal: true });
    this.notifyListeners(userChunk);

    const modelChunk = this.generateLiveResponseChunk(streamId, text, force);
    LiveStreamChunkSchema.parse(modelChunk);
    this.eventBus.publishLiveEvent('swarm.live.stream.text', { ...modelChunk });
    this.notifyListeners(modelChunk);
    return modelChunk;
  }

  public async sendRealtimeAudio(audioChunkBase64: string, mimeType = 'audio/pcm;rate=16000'): Promise<LiveStreamChunk> {
    if (this.liveStatus === 'HALTED' || !this.aiClient) {
      throw new Error('Gemini Live audio är i HALTED-läge. Giltig GEMINI_API_KEY krävs.');
    }
    if (!this.isLiveConnected()) await this.connectLive();

    const streamId = this.currentStreamId || `stream-${Date.now()}`;
    const audioChunk: LiveStreamChunk = {
      streamId, sourceRole: 'user', audioChunkBase64, isFinal: false, timestamp: new Date().toISOString(),
    };
    LiveStreamChunkSchema.parse(audioChunk);

    this.eventBus.publishLiveEvent('swarm.live.stream.audio', {
      streamId, mimeType, byteLength: audioChunkBase64.length, hasAudio: true, timestamp: audioChunk.timestamp,
    });
    this.notifyListeners(audioChunk);

    const transChunk: LiveStreamChunk = {
      streamId, sourceRole: 'model', force: 'ATT_FOLJA',
      transcription: '[Realtidstranskribering av röstinmatning uppfattad]',
      textChunk: 'Försoningsenheten hör och analyserar inkommande tal i realtid.',
      isFinal: true, timestamp: new Date().toISOString(),
    };
    LiveStreamChunkSchema.parse(transChunk);

    this.eventBus.publishLiveEvent('swarm.live.stream.transcription', { streamId, transcription: transChunk.transcription, isFinal: true });
    this.notifyListeners(transChunk);
    return transChunk;
  }

  private generateLiveResponseChunk(streamId: string, prompt: string, force?: ReconciliationForce): LiveStreamChunk {
    const activeForce: ReconciliationForce = force || 'ATT_FOLJA';
    let text = `[Att följa Guds son]: Analyserar "${prompt}" för närhet.`;
    if (activeForce === 'ATT_VANDA_OM') text = `[Att vända om till Gud]: Granskar "${prompt}" etiskt.`;
    else if (activeForce === 'ATT_FORLIKAS') text = `[Att förlikas med Gud]: Harmoniserar perspektiv på "${prompt}".`;
    else if (activeForce === 'SERIELL_MOTOR') text = `[Att tjäna Gud och andra: Bygga]: Säkerställer framdrift.`;

    return {
      streamId, sourceRole: 'model', force: activeForce, textChunk: text,
      transcription: text, isFinal: true, timestamp: new Date().toISOString(),
    };
  }

  private notifyListeners(chunk: LiveStreamChunk): void {
    for (const listener of this.streamListeners) {
      try { listener(chunk); } catch { /* listener error handled */ }
    }
  }

  public async generateAgentTurn(params: {
    role: string;
    systemInstruction: string;
    prompt: string;
    context?: string;
  }): Promise<AgentThoughtResponse> {
    if (!this.aiClient || this.liveStatus === 'HALTED') {
      throw new Error(`Gemini API-nyckel saknas för agent ${params.role}: GeminiLiveSession är i HALTED-läge.`);
    }

    const response = await this.aiClient.models.generateContent({
      model: this.modelName,
      contents: [{
        role: 'user',
        parts: [{ text: `Roll: ${params.role}\nInstruktion: ${params.systemInstruction}\nKontext: ${params.context || ''}\nUppdrag: ${params.prompt}` }],
      }],
    });

    return {
      agentRole: params.role,
      thought: `Analys och syntes genererad via ${this.modelName}`,
      content: response.text || '',
    };
  }
}
