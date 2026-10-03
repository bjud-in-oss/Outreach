# Steg 2b: Modellera (TCK-020c)

## 1. Datastrukturer & Scheman

### BidiGenerateContentSetup Payload
```typescript
export interface BidiLiveSetupConfig {
  setup: {
    model: string;
    generationConfig: {
      responseModalities: ('TEXT' | 'AUDIO')[];
      speechConfig?: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: string;
          };
        };
      };
      thinkingConfig?: {
        thinkingLevel?: 'HIGH' | 'LOW' | 'MINIMAL';
      };
    };
    systemInstruction?: {
      parts: Array<{ text: string }>;
    };
    tools?: Array<any>;
  };
}
```

### RealtimeInput MediaChunks Payload
```typescript
export interface BidiRealtimeInputPayload {
  realtimeInput: {
    mediaChunks?: Array<{
      mimeType: string;
      data: string; // Base64 PCM16
    }>;
    audio?: {
      mimeType: string;
      data: string;
    };
    audioStreamEnd?: boolean;
  };
}
```

### Tool Response Payload (NON_BLOCKING)
```typescript
export interface BidiToolResponsePayload {
  toolResponse: {
    functionResponses: Array<{
      response: Record<string, unknown>;
      id: string;
    }>;
    behavior?: 'NON_BLOCKING' | 'BLOCKING';
  };
}
```

## 2. Sekvensflöde
1. **User Gesture (Intent Click)**: Användaren klickar på t.ex. *Reflektera*.
2. **Setup Handshake**: `geminiLiveSession.ts` ansluter till WebSocket-kabeln med extended thinking och responsmodaliteter `['TEXT', 'AUDIO']`.
3. **Mikrofonströmning**: `sessionIntentAudio.ts` samlar 16kHz PCM16, sänder över `SwarmEventBus` som `swarm.live.stream.audio`.
4. **MediaChunks Packaging**: `geminiLiveSession.ts` paketerar ljudpaketen strikt under `realtimeInput.mediaChunks` (och `audio`) till WebSocket.
5. **Autonoma Verktygssvar**: Inkommande `toolCall` exekveras och returneras autonomt som `NON_BLOCKING` utan att avbryta röst- eller tankeflödet.
