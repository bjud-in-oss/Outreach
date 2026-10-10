import { GoogleGenAI } from '@google/genai';
import { LiveSessionStatus, LiveStreamChunk, LiveStreamChunkSchema, ReconciliationForce } from '../telemetry/telemetrySchema.ts';
import { SwarmEventBus, getGlobalSwarmEventBus } from '../bus/swarmEventBus.ts';
import { SessionIntentManager } from './sessionIntentAudio.ts';
import { DSPRingBufferMixer, SwarmAudioChannel } from './liveAudioPlayback.ts';
import { FloorController, CHANNEL_PRIORITY, AGENT_VOICE_MAP } from './floorController.ts';
import { SwarmIntent } from '../ui/splitPaneHelper.ts';

export type { SwarmIntent, SwarmAudioChannel };
export { CHANNEL_PRIORITY, AGENT_VOICE_MAP };
export interface AgentThoughtResponse {
  agentRole: string; thought: string; content: string; suggestedTools?: string[]; score?: number;
}
export interface BidiRealtimeInputPayload {
  realtimeInput?: { mediaChunks?: Array<{ mimeType: string; data: string }> };
  audio?: { data: string; mimeType: string };
}

export class GeminiLiveSession {
  private aiClient: GoogleGenAI | null = null;
  private activeSdkSession: any = null;
  private agentSessions: Map<SwarmAudioChannel, any> = new Map();
  private liveModelName = 'gemini-3.8-live-extended-thinking';
  private liveStatus: LiveSessionStatus = 'IDLE';
  private eventBus: SwarmEventBus;
  private streamListeners = new Set<(chunk: LiveStreamChunk) => void>();
  private currentStreamId: string | null = null;
  private reconnectAttempts = 0;
  private intentManager: SessionIntentManager;
  private audioPlayer = new DSPRingBufferMixer();
  private floor: FloorController;

  constructor(apiKey?: string, eventBus?: SwarmEventBus) {
    this.eventBus = eventBus || getGlobalSwarmEventBus();
    this.intentManager = new SessionIntentManager(this.eventBus);
    this.floor = new FloorController(this.eventBus);
    const envKey = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) || (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : '');
    const key = (apiKey !== undefined ? (apiKey === 'MY_GEMINI_API_KEY' ? '' : apiKey) : envKey || '').trim();
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
    return { audio: { data, mimeType }, realtimeInput: { mediaChunks: [{ mimeType, data }] } };
  }

  private subscribeToMicPiping(): void {
    this.eventBus.subscribe('swarm.live.stream.audio', (env) => {
      const chunk = (env.data as any)?.audioChunkBase64;
      if (!this.isLiveConnected() || !chunk) return;
      const payload = this.packRealtimeAudioChunk(chunk, (env.data as any)?.mimeType || 'audio/pcm;rate=16000');
      try {
        if (this.activeSdkSession?.sendRealtimeInput) this.activeSdkSession.sendRealtimeInput(payload);
      } catch {
        this.liveStatus = 'DISCONNECTED'; this.deactivateIntent();
      }
    });
  }

  public requestFloor(channel: SwarmAudioChannel): void {
    this.floor.requestFloor(
      channel,
      (preempted, challenger) => { this.audioPlayer.rampGain(preempted, 0, 18); this.audioPlayer.rampGain(challenger, 1.0, 18); },
      (speaker) => this.audioPlayer.rampGain(speaker, 1.0, 18)
    );
  }
  public cancelFloor(channel: SwarmAudioChannel): void { this.floor.cancelFloor(channel); }
  public releaseFloor(channel?: SwarmAudioChannel): void {
    this.floor.releaseFloor(channel, (speaker) => this.audioPlayer.rampGain(speaker, 1.0, 18));
  }
  public getCurrentSpeaker(): SwarmAudioChannel | null { return this.floor.getCurrentSpeaker(); }
  public getAudioPlayer(): DSPRingBufferMixer { return this.audioPlayer; }
  public setApiKey(apiKey: string): void {
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || !apiKey.trim()) {
      this.aiClient = null; this.liveStatus = 'HALTED'; return;
    }
    this.aiClient = new GoogleGenAI({ apiKey: apiKey.trim(), apiVersion: 'v1alpha' });
    this.liveStatus = 'IDLE'; this.reconnectAttempts = 0;
  }

  public getApiVersion(): string { return 'v1alpha'; }
  public setLiveModel(model: string): void { this.liveModelName = model; }
  public getLiveModel(): string { return this.liveModelName; }
  public getLiveStatus(): LiveSessionStatus { return this.liveStatus; }
  public getReconnectAttempts(): number { return this.reconnectAttempts; }
  public getAgentSession(channel: SwarmAudioChannel): any { return this.agentSessions.get(channel); }
  public getAgentSessions(): Map<SwarmAudioChannel, any> { return this.agentSessions; }
  public isLiveConnected(): boolean { return this.liveStatus === 'STREAMING' || this.liveStatus === 'CONNECTING'; }
  public getActiveIntent(): SwarmIntent | null { return this.intentManager.getActiveIntent(); }
  public getAudioContext(): AudioContext | null { return this.intentManager.getAudioContext(); }
  public getMediaStream(): MediaStream | null { return this.intentManager.getMediaStream(); }
  public deactivateIntent(): void { this.intentManager.deactivateIntent(); }
  public onStreamChunk(listener: (chunk: LiveStreamChunk) => void): () => void {
    this.streamListeners.add(listener);
    return () => { this.streamListeners.delete(listener); };
  }
  public async activateIntent(intent: SwarmIntent): Promise<void> {
    await this.intentManager.activateIntent(intent, async () => {
      if (!this.isLiveConnected()) await this.connectLive();
    });
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
      this.liveStatus = 'STREAMING'; this.reconnectAttempts = 0;
      this.eventBus.publishLiveEvent('swarm.live.session.connected', { streamId, status: 'CONNECTED', model: modelToUse });
    };
    const makeAgentConfig = (channel: SwarmAudioChannel, defaultInstruction: string) => ({
      model: modelToUse,
      config: {
        responseModalities: config?.responseModalities || ['AUDIO'],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: AGENT_VOICE_MAP[channel] } } },
        thinkingConfig: { thinkingLevel: 'high' },
        systemInstruction: { parts: [{ text: config?.systemInstruction || defaultInstruction }] },
      },
      callbacks: {
        onopen: onOpen,
        onmessage: (msg: any) => this.handleAgentMessage(channel, msg),
        onerror: (err: any) => { this.liveStatus = 'ERROR'; this.eventBus.publishLiveEvent('swarm.live.session.error', { error: String(err) }); },
        onclose: () => { this.liveStatus = 'DISCONNECTED'; this.releaseFloor(channel); },
      },
    });

    try {
      const hostInstruction = config?.systemInstruction || 'Försoningsmotorns kompass aktiv (Host: Att förlikas).';
      const hostSession = await (this.aiClient as any).live.connect(makeAgentConfig('forlikas', hostInstruction));
      this.agentSessions.clear();
      this.agentSessions.set('forlikas', hostSession);
      this.activeSdkSession = hostSession;
      if (typeof window !== 'undefined') (window as any).geminiSession = this;
      return true;
    } catch (err) {
      this.liveStatus = 'ERROR'; this.deactivateIntent();
      const msg = `Anslutningsfel: ${err instanceof Error ? err.message : String(err)}`;
      this.eventBus.publishLiveEvent('swarm.live.session.error', { error: msg, status: 'ERROR' });
      throw new Error(msg);
    }
  }

  public handleAgentMessage(channel: SwarmAudioChannel, message: any): void {
    if (message?.serverContent?.interrupted) {
      this.audioPlayer.clearBuffer(channel); this.releaseFloor(channel); this.intentManager.emitAudioThinking(); return;
    }
    if (message?.serverContent?.turnComplete) {
      this.releaseFloor(channel); this.eventBus.publishLiveEvent('swarm.live.turn.complete', { channel });
    }
    const parts = message?.serverContent?.modelTurn?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        this.requestFloor(channel);
        this.audioPlayer.play24kHzPCMBase64(channel, part.inlineData.data, () => this.intentManager.emitAudioTalking());
      }
    }
  }

  public sendTurnComplete(channel: SwarmAudioChannel = 'forlikas'): void {
    if (this.activeSdkSession?.sendRealtimeInput) {
      this.activeSdkSession.sendRealtimeInput({ realtimeInput: { turnComplete: true } });
    }
    this.releaseFloor(channel);
    this.eventBus.publishLiveEvent('swarm.live.turn.complete', { channel, source: 'vad' });
  }

  public sendToolResponse(
    functionResponses: Array<{ id: string; name?: string; response: Record<string, unknown> }>,
    behavior: 'NON_BLOCKING' | 'BLOCKING' = 'NON_BLOCKING'
  ): void {
    const payload = { toolResponse: { functionResponses, behavior } };
    if (this.activeSdkSession?.sendRealtimeInput) this.activeSdkSession.sendRealtimeInput(payload);
    this.eventBus.publishLiveEvent('swarm.live.tool.response', { functionResponses, behavior, timestamp: new Date().toISOString() });
  }

  public async disconnectLive(reason = 'Klientsession avslutad normalt'): Promise<void> {
    const streamId = this.currentStreamId || `stream-${Date.now()}`;
    if (this.activeSdkSession?.close) { try { this.activeSdkSession.close(); } catch {} }
    for (const sess of this.agentSessions.values()) { if (sess?.close) { try { sess.close(); } catch {} } }
    this.agentSessions.clear();
    this.activeSdkSession = null;
    this.liveStatus = 'DISCONNECTED';
    this.audioPlayer.dispose();
    this.floor.reset();
    this.deactivateIntent();
    this.eventBus.publishLiveEvent('swarm.live.session.disconnected', { streamId, status: 'DISCONNECTED', reason });
    this.currentStreamId = null;
  }

  public async sendRealtimeText(text: string, force?: ReconciliationForce): Promise<LiveStreamChunk> {
    if (this.liveStatus === 'HALTED' || !this.aiClient) throw new Error('Gemini Live session i HALTED-läge.');
    if (!this.isLiveConnected()) await this.connectLive();
    for (const s of this.agentSessions.values()) { if (s?.sendRealtimeInput) s.sendRealtimeInput({ text }); }
    const streamId = this.currentStreamId || `stream-${Date.now()}`;
    const userChunk: LiveStreamChunk = { streamId, sourceRole: 'user', force, textChunk: text, transcription: text, isFinal: true, timestamp: new Date().toISOString() };
    LiveStreamChunkSchema.parse(userChunk);
    this.eventBus.publishLiveEvent('swarm.live.stream.text', { ...userChunk });
    this.notifyListeners(userChunk);
    return userChunk;
  }

  public async sendRealtimeAudio(audioChunkBase64: string, mimeType = 'audio/pcm;rate=16000'): Promise<LiveStreamChunk> {
    if (this.liveStatus === 'HALTED' || !this.aiClient) throw new Error('Gemini Live audio i HALTED-läge.');
    if (!this.isLiveConnected()) await this.connectLive();
    const payload = this.packRealtimeAudioChunk(audioChunkBase64, mimeType);
    for (const s of this.agentSessions.values()) { if (s?.sendRealtimeInput) s.sendRealtimeInput(payload); }
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
