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

export interface BidiRealtimeInputPayload {
  realtimeInput?: { mediaChunks?: Array<{ mimeType: string; data: string }> };
  audio?: { data: string; mimeType: string };
}

export class GeminiLiveSession {
  private aiClient: GoogleGenAI | null = null;
  private activeSdkSession: any = null;
  private liveModelName = 'gemini-3.8-live-extended-thinking';
  private liveStatus: LiveSessionStatus = 'IDLE';
  private eventBus: SwarmEventBus;
  private streamListeners = new Set<(chunk: LiveStreamChunk) => void>();
  private currentStreamId: string | null = null;
  private reconnectAttempts = 0;
  private intentManager: SessionIntentManager;
  private audioPlayer = new LiveAudioPlayer();

  constructor(apiKey?: string, eventBus?: SwarmEventBus) {
    this.eventBus = eventBus || getGlobalSwarmEventBus();
    this.intentManager = new SessionIntentManager(this.eventBus);
    const envKey = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) || (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : '');
    const key = (apiKey && apiKey !== 'MY_GEMINI_API_KEY' ? apiKey : envKey || '').trim();
    if (!key) {
      this.liveStatus = 'HALTED';
      this.eventBus.publishLiveEvent('swarm.live.session.halted', { reason: 'GEMINI_API_KEY saknas i miljön (VITE_GEMINI_API_KEY).', status: 'HALTED' });
      return;
    }
    try {
      this.aiClient = new GoogleGenAI({ apiKey: key, apiVersion: 'v1alpha' });
      this.subscribeToMicPiping();
    } catch (e) {
      this.liveStatus = 'HALTED';
      this.eventBus.publishLiveEvent('swarm.live.session.halted', { reason: `Init-fel: ${e instanceof Error ? e.message : String(e)}`, status: 'HALTED' });
    }
  }

  public packRealtimeAudioChunk(data: string, mimeType = 'audio/pcm;rate=16000'): BidiRealtimeInputPayload {
    return {
      realtimeInput: { mediaChunks: [{ mimeType, data }] },
      audio: { data, mimeType },
    };
  }

  private subscribeToMicPiping(): void {
    this.eventBus.subscribe('swarm.live.stream.audio', (env) => {
      const d = env.data as any;
      const chunk = d?.audioChunkBase64;
      if (!this.isLiveConnected() || !this.activeSdkSession?.sendRealtimeInput || !chunk) return;
      const mime = d?.mimeType || 'audio/pcm;rate=16000';
      try {
        this.activeSdkSession.sendRealtimeInput(this.packRealtimeAudioChunk(chunk, mime));
      } catch {
        this.liveStatus = 'DISCONNECTED';
        this.deactivateIntent();
      }
    });
  }

  public setApiKey(apiKey: string): void {
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || !apiKey.trim()) {
      this.aiClient = null;
      this.liveStatus = 'HALTED';
      return;
    }
    this.aiClient = new GoogleGenAI({ apiKey: apiKey.trim(), apiVersion: 'v1alpha' });
    this.liveStatus = 'IDLE';
    this.reconnectAttempts = 0;
  }

  public getApiVersion(): string { return 'v1alpha'; }
  public setLiveModel(model: string): void { this.liveModelName = model; }
  public getLiveModel(): string { return this.liveModelName; }
  public getLiveStatus(): LiveSessionStatus { return this.liveStatus; }
  public getReconnectAttempts(): number { return this.reconnectAttempts; }
  public isLiveConnected(): boolean { return this.liveStatus === 'STREAMING' || this.liveStatus === 'CONNECTING'; }
  public getActiveIntent(): SwarmIntent | null { return this.intentManager.getActiveIntent(); }
  public getAudioContext(): AudioContext | null { return this.intentManager.getAudioContext(); }
  public getMediaStream(): MediaStream | null { return this.intentManager.getMediaStream(); }

  public async activateIntent(intent: SwarmIntent): Promise<void> {
    await this.intentManager.activateIntent(intent, async () => {
      if (!this.isLiveConnected()) await this.connectLive();
    });
  }

  public deactivateIntent(): void { this.intentManager.deactivateIntent(); }
  public onStreamChunk(listener: (chunk: LiveStreamChunk) => void): () => void {
    this.streamListeners.add(listener);
    return () => { this.streamListeners.delete(listener); };
  }

  public async connectLive(config?: { responseModalities?: string[]; systemInstruction?: string; model?: string; }): Promise<boolean> {
    if (this.liveStatus === 'HALTED' || !this.aiClient) {
      const errMsg = 'GEMINI_API_KEY saknas eller är ogiltig i miljön (VITE_GEMINI_API_KEY).';
      this.eventBus.publishLiveEvent('swarm.live.session.error', { error: errMsg, status: 'HALTED' });
      throw new Error(errMsg);
    }
    this.liveStatus = 'CONNECTING';
    const streamId = `stream-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    this.currentStreamId = streamId;

    const rawModel = config?.model || this.liveModelName;
    const modelToUse = rawModel.startsWith('models/') ? rawModel : `models/${rawModel}`;

    const onOpen = () => {
      this.liveStatus = 'STREAMING';
      this.reconnectAttempts = 0;
      this.eventBus.publishLiveEvent('swarm.live.session.connected', {
        streamId, status: 'CONNECTED', model: modelToUse,
        responseModalities: config?.responseModalities || ['AUDIO'],
        connectedAt: new Date().toISOString(),
      });
    };
    const onError = (err: any) => {
      this.liveStatus = 'ERROR';
      this.deactivateIntent();
      this.eventBus.publishLiveEvent('swarm.live.session.error', { error: String(err), status: 'ERROR' });
    };
    const onClose = () => {
      this.liveStatus = 'DISCONNECTED';
      this.deactivateIntent();
      this.eventBus.publishLiveEvent('swarm.live.session.disconnected', { streamId, status: 'DISCONNECTED', disconnectedAt: new Date().toISOString() });
    };

    const liveConfig = {
      model: modelToUse,
      config: {
        responseModalities: config?.responseModalities || ['AUDIO'],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' } } },
        thinkingConfig: { thinking_level: 'low' },
        systemInstruction: { parts: [{ text: config?.systemInstruction || 'Försoningsmotorns kompass aktiv.' }] },
      },
      callbacks: {
        onopen: onOpen,
        onmessage: (msg: any) => this.handleIncomingLiveMessage(msg),
        onerror: onError,
        onclose: onClose,
      },
    };

    console.log('DEBUG SETUP PAYLOAD:', JSON.stringify(liveConfig, null, 2));

    try {
      this.activeSdkSession = await (this.aiClient as any).live.connect(liveConfig);
      if (typeof window !== 'undefined') { (window as any).geminiSession = this; }
      return true;
    } catch (err) {
      this.liveStatus = 'ERROR';
      this.deactivateIntent();
      const msg = `Anslutningsfel: ${err instanceof Error ? err.message : String(err)}`;
      this.eventBus.publishLiveEvent('swarm.live.session.error', { error: msg, status: 'ERROR' });
      throw new Error(msg);
    }
  }

  private handleIncomingLiveMessage(message: any): void {
    if (message?.serverContent?.interrupted) {
      this.intentManager.emitAudioThinking();
      return;
    }
    const parts = message?.serverContent?.modelTurn?.parts || [];
    for (const part of parts) {
      const data = part.inlineData?.data;
      if (data) this.audioPlayer.play24kHzPCMBase64(data, () => this.intentManager.emitAudioTalking());
    }
    if (message?.serverContent?.outputTranscription?.text && this.currentStreamId) {
      this.eventBus.publishLiveEvent('swarm.live.stream.transcription', {
        streamId: this.currentStreamId, transcription: message.serverContent.outputTranscription.text, isFinal: true,
      });
    }
  }

  public sendToolResponse(
    functionResponses: Array<{ id: string; name?: string; response: Record<string, unknown> }>,
    behavior: 'NON_BLOCKING' | 'BLOCKING' = 'NON_BLOCKING'
  ): void {
    const payload = { toolResponse: { functionResponses, behavior } };
    if (this.activeSdkSession?.sendRealtimeInput) {
      this.activeSdkSession.sendRealtimeInput(payload);
    } else if (this.activeSdkSession?.send) {
      this.activeSdkSession.send(JSON.stringify(payload));
    }
    this.eventBus.publishLiveEvent('swarm.live.tool.response', {
      functionResponses, behavior, timestamp: new Date().toISOString(),
    });
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
      this.activeSdkSession.sendRealtimeInput(this.packRealtimeAudioChunk(audioChunkBase64, mimeType));
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

  public async generateAgentTurn(params: { role: string; systemInstruction: string; prompt: string; context?: string; model?: string; }): Promise<AgentThoughtResponse> {
    if (!this.aiClient || this.liveStatus === 'HALTED') throw new Error(`API-nyckel saknas för ${params.role}.`);
    const modelToUse = params.model || this.liveModelName;
    const response = await this.aiClient.models.generateContent({
      model: modelToUse,
      contents: [{ role: 'user', parts: [{ text: `Roll: ${params.role}\nInstruktion: ${params.systemInstruction}\nKontext: ${params.context || ''}\nUppdrag: ${params.prompt}` }] }],
    });
    return { agentRole: params.role, thought: `Analys genererad via ${modelToUse}`, content: response.text || '' };
  }
}
