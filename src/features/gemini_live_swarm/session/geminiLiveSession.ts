import { GoogleGenAI } from '@google/genai';
import { LiveSessionStatus, LiveStreamChunk, LiveStreamChunkSchema, ReconciliationForce } from '../telemetry/telemetrySchema.ts';
import { SwarmEventBus, getGlobalSwarmEventBus } from '../bus/swarmEventBus.ts';
import { SessionIntentManager } from './sessionIntentAudio.ts';
import { LiveAudioPlayer } from './liveAudioPlayback.ts';
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
  private activeSdkSession: any = null;
  private modelName = 'gemini-3.8-flash';
  private liveModelName = 'gemini-3.8-live';
  private liveStatus: LiveSessionStatus = 'IDLE';
  private eventBus: SwarmEventBus;
  private streamListeners = new Set<(chunk: LiveStreamChunk) => void>();
  private currentStreamId: string | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 3;
  private intentManager: SessionIntentManager;
  private audioPlayer = new LiveAudioPlayer();

  constructor(apiKey?: string, eventBus?: SwarmEventBus) {
    this.eventBus = eventBus || getGlobalSwarmEventBus();
    this.intentManager = new SessionIntentManager(this.eventBus);
    const key = apiKey !== undefined ? apiKey : (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) || (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined);
    if (!key || key === 'MY_GEMINI_API_KEY' || !key.trim()) {
      this.liveStatus = 'HALTED';
      this.eventBus.publishLiveEvent('swarm.live.session.halted', { reason: 'GEMINI_API_KEY saknas.', status: 'HALTED' });
      return;
    }
    try {
      this.aiClient = new GoogleGenAI({ apiKey: key });
      this.subscribeToMicPiping();
    } catch (e) {
      this.liveStatus = 'HALTED';
      this.eventBus.publishLiveEvent('swarm.live.session.halted', { reason: `Init-fel: ${e instanceof Error ? e.message : String(e)}`, status: 'HALTED' });
    }
  }

  private subscribeToMicPiping(): void {
    this.eventBus.subscribe('swarm.live.stream.audio', (env) => {
      if (this.isLiveConnected() && this.activeSdkSession?.sendRealtimeInput && env.data?.audioChunkBase64) {
        this.activeSdkSession.sendRealtimeInput({
          audio: { data: env.data.audioChunkBase64, mimeType: env.data.mimeType || 'audio/pcm;rate=16000' }
        });
      }
    });
  }

  public setApiKey(apiKey: string): void {
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || !apiKey.trim()) {
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
      if (!this.isLiveConnected() && this.liveStatus !== 'HALTED') await this.connectLive();
    });
  }

  public deactivateIntent(): void { this.intentManager.deactivateIntent(); }
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

    try {
      this.activeSdkSession = await (this.aiClient as any).live.connect({
        model: this.liveModelName,
        config: {
          responseModalities: ['audio'],
          systemInstruction: { parts: [{ text: config?.systemInstruction || 'Försoningsmotorns kompass aktiv.' }] }
        },
        callbacks: {
          onopen: () => {
            this.liveStatus = 'STREAMING';
            this.reconnectAttempts = 0;
            this.eventBus.publishLiveEvent('swarm.live.session.connected', {
              streamId, status: 'CONNECTED', model: this.liveModelName,
              responseModalities: config?.responseModalities || ['audio'],
              connectedAt: new Date().toISOString(),
            });
          },
          onmessage: (msg: any) => this.handleIncomingLiveMessage(msg),
          onerror: (err: any) => {
            this.liveStatus = 'ERROR';
            this.eventBus.publishLiveEvent('swarm.live.session.error', { error: String(err), status: 'ERROR' });
          },
          onclose: () => {
            this.liveStatus = 'DISCONNECTED';
            this.eventBus.publishLiveEvent('swarm.live.session.disconnected', { streamId, status: 'DISCONNECTED', disconnectedAt: new Date().toISOString() });
          }
        }
      });
      return true;
    } catch (err) {
      this.liveStatus = 'ERROR';
      this.eventBus.publishLiveEvent('swarm.live.session.error', { error: `Anslutningsfel: ${err instanceof Error ? err.message : String(err)}`, status: 'ERROR' });
      return false;
    }
  }

  private handleIncomingLiveMessage(message: any): void {
    if (message?.serverContent?.interrupted) {
      this.intentManager.emitAudioThinking();
      return;
    }
    const parts = message?.serverContent?.modelTurn?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData?.data) {
          this.audioPlayer.play24kHzPCMBase64(part.inlineData.data, () => this.intentManager.emitAudioTalking());
        }
      }
    }
    if (message?.serverContent?.outputTranscription?.text && this.currentStreamId) {
      this.eventBus.publishLiveEvent('swarm.live.stream.transcription', {
        streamId: this.currentStreamId, transcription: message.serverContent.outputTranscription.text, isFinal: true
      });
    }
  }

  public async handleAutoReconnect(reason = 'Nätverkstapp'): Promise<boolean> {
    if (this.liveStatus === 'HALTED' || !this.aiClient) return false;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.liveStatus = 'ERROR';
      this.eventBus.publishLiveEvent('swarm.live.session.error', { error: `Återanslutning misslyckades (${this.maxReconnectAttempts}): ${reason}`, status: 'ERROR' });
      return false;
    }
    this.reconnectAttempts++;
    this.liveStatus = 'RECONNECTING';
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 8000);
    this.eventBus.publishLiveEvent('swarm.live.session.reconnecting', { attempt: this.reconnectAttempts, maxAttempts: this.maxReconnectAttempts, delayMs: delay, reason, status: 'RECONNECTING' });
    await new Promise((res) => setTimeout(res, delay));
    try { return await this.connectLive(); } catch { return this.handleAutoReconnect(reason); }
  }

  public async disconnectLive(reason = 'Klientsession avslutad normalt'): Promise<void> {
    const streamId = this.currentStreamId || `stream-${Date.now()}`;
    if (this.activeSdkSession?.close) { try { this.activeSdkSession.close(); } catch {} }
    this.activeSdkSession = null;
    this.liveStatus = 'DISCONNECTED';
    this.audioPlayer.dispose();
    this.deactivateIntent();
    this.eventBus.publishLiveEvent('swarm.live.session.disconnected', { streamId, status: 'DISCONNECTED', reason, disconnectedAt: new Date().toISOString() });
    this.currentStreamId = null;
  }

  public async sendRealtimeText(text: string, force?: ReconciliationForce): Promise<LiveStreamChunk> {
    if (this.liveStatus === 'HALTED' || !this.aiClient) throw new Error('Gemini Live session i HALTED-läge.');
    if (!this.isLiveConnected()) await this.connectLive();
    if (this.activeSdkSession?.sendRealtimeInput) this.activeSdkSession.sendRealtimeInput({ text });
    const streamId = this.currentStreamId || `stream-${Date.now()}`;
    const userChunk: LiveStreamChunk = { streamId, sourceRole: 'user', force, textChunk: text, transcription: text, isFinal: true, timestamp: new Date().toISOString() };
    LiveStreamChunkSchema.parse(userChunk);
    this.eventBus.publishLiveEvent('swarm.live.stream.text', { ...userChunk });
    this.eventBus.publishLiveEvent('swarm.live.stream.transcription', { streamId, transcription: text, force, isFinal: true });
    this.notifyListeners(userChunk);
    return userChunk;
  }

  public async sendRealtimeAudio(audioChunkBase64: string, mimeType = 'audio/pcm;rate=16000'): Promise<LiveStreamChunk> {
    if (this.liveStatus === 'HALTED' || !this.aiClient) throw new Error('Gemini Live audio i HALTED-läge.');
    if (!this.isLiveConnected()) await this.connectLive();
    if (this.activeSdkSession?.sendRealtimeInput) {
      this.activeSdkSession.sendRealtimeInput({ audio: { data: audioChunkBase64, mimeType } });
    }
    const streamId = this.currentStreamId || `stream-${Date.now()}`;
    const audioChunk: LiveStreamChunk = { streamId, sourceRole: 'user', audioChunkBase64, isFinal: false, timestamp: new Date().toISOString() };
    LiveStreamChunkSchema.parse(audioChunk);
    this.eventBus.publishLiveEvent('swarm.live.stream.audio', { streamId, mimeType, byteLength: audioChunkBase64.length, hasAudio: true, timestamp: audioChunk.timestamp });
    this.notifyListeners(audioChunk);
    return audioChunk;
  }

  private notifyListeners(chunk: LiveStreamChunk): void {
    for (const listener of this.streamListeners) { try { listener(chunk); } catch {} }
  }

  public async generateAgentTurn(params: { role: string; systemInstruction: string; prompt: string; context?: string; }): Promise<AgentThoughtResponse> {
    if (!this.aiClient || this.liveStatus === 'HALTED') throw new Error(`API-nyckel saknas för ${params.role}.`);
    const response = await this.aiClient.models.generateContent({
      model: this.modelName,
      contents: [{ role: 'user', parts: [{ text: `Roll: ${params.role}\nInstruktion: ${params.systemInstruction}\nKontext: ${params.context || ''}\nUppdrag: ${params.prompt}` }] }],
    });
    return { agentRole: params.role, thought: `Analys genererad via ${this.modelName}`, content: response.text || '' };
  }
}