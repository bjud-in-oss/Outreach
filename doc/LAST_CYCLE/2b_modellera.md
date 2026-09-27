# 2b Modellera: Gemini Live Session Streaming & WebSocket Integration (TCK-010)

## 1. Domän- och Kontraktsmodellering

### 1.1 Live Session Status & Typer
```typescript
export type LiveSessionStatus = 'IDLE' | 'CONNECTING' | 'STREAMING' | 'DISCONNECTED' | 'ERROR';

export interface LiveStreamChunk {
  streamId: string;
  sourceRole: 'user' | 'model';
  force?: 'ATT_FOLJA' | 'ATT_VANDA_OM' | 'ATT_FORLIKAS' | 'SERIELL_MOTOR';
  textChunk?: string;
  audioChunkBase64?: string;
  transcription?: string;
  isFinal: boolean;
  timestamp: string;
}
```

### 1.2 CloudEvents 1.0 Specifikation för Strömning
Samtliga strömningshändelser kapslas i `EventEnvelope` kompatibelt med CloudEvents 1.0:
1. `swarm.live.session.connected`:
   - `source`: `outreach/gemini_live/session`
   - `data`: `{ status: 'CONNECTED', model: 'gemini-3.8-live', responseModalities: ['audio', 'text'] }`
2. `swarm.live.stream.text`:
   - `source`: `outreach/gemini_live/stream`
   - `data`: `{ streamId, chunk, force, isFinal }`
3. `swarm.live.stream.audio`:
   - `source`: `outreach/gemini_live/audio`
   - `data`: `{ streamId, mimeType: 'audio/pcm;rate=24000', hasAudio: true }`
4. `swarm.live.stream.transcription`:
   - `source`: `outreach/gemini_live/transcription`
   - `data`: `{ text, isInterim: false, force }`
5. `swarm.live.session.disconnected`:
   - `source`: `outreach/gemini_live/session`
   - `data`: `{ status: 'DISCONNECTED', reason: string }`

### 1.3 Försoningsenheternas Reaktivitet
Varje strömningschunk distribueras reaktivt via `SwarmEventBus` så att gränssnittets 4 enheter uppdaterar sina statusfält:
- **Att följa Guds son**: Tar emot inkommande behovsanalys och strömmande dialogunderlag.
- **Att vända om till Gud**: Tar emot transkribering och granskar kontinuerligt mot etiska spam-indikatorer.
- **Att förlikas med Gud**: Sammanväver strömmande perspektiv och genererar försonande konsensus i realtid.
- **Att försonas (ensam agent)**: Övervakar linjär framdrift och fasintegritet.
