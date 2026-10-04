# Steg 3c: Filoperativ Källkodsspecifikation (TCK-022a)

## 1. GROW Specifikation
- **Goal (Mål)**: Implementera klickfri DSP Ring Buffer Mixer med spatial panorering (-0.4, 0.0, +0.4) i `liveAudioPlayback.ts`, 200 ms Pre-Roll buffert i `sessionIntentAudio.ts`, samt prioriterad preemptive Floor Control (forlikas [1] > vanda_om [2] > folja [3]) och 3-parallell Bidi WebSocket-session i `geminiLiveSession.ts`.
- **Reality (Nuläge)**: Enkel linjär `LiveAudioPlayer` som inte stödjer multi-kanal eller panorering. Singel-session mot Bidi utan multi-agent Floor Control. Ingen pre-roll vid mikrofonstart.
- **Options (Alternativ)**: Web Audio AudioWorklet vs schemalagd `AudioBufferSourceNode` med ringbuffert och gain-ramper. Vi väljer schemalagd ringbuffert med Gain/Panner-noder då den stöds fullt ut i minnet och browsers utan extra externa worklet-scripts.
- **Will (Plan & Åtagande)**: Bygg om `liveAudioPlayback.ts`, uppgradera `sessionIntentAudio.ts` och `geminiLiveSession.ts`, samt upprätta transient testsvit `src/__tests__/transient_TCK-022a.test.ts`.

## 2. Operativt Delta (Bevara vs Sanera)
- **Bevara**:
  - Existerande 16kHz PCM-sampling och nedskalning av mikrofonljud.
  - Telemetri- och Zod-kontrakt i `src/features/gemini_live_swarm/telemetry/telemetrySchema.ts`.
  - Integrering med `SwarmEventBus`.
- **Sanera / Ersätta**:
  - Ersätt enkel `LiveAudioPlayer` i `liveAudioPlayback.ts` med `DSPRingBufferMixer`.
  - Ersätt singel-agent start i `geminiLiveSession.ts` med 3-agent Bidi-initiering (`Puck`, `Charon`, `Aoede`) och preemptive Floor Control.
  - Sanera eventuella klickframkallande abrupta stopp till förmån för 18 ms gain-ramper.

## 3. Zod- och Typkontrakt
```typescript
import { z } from 'zod';

export const SwarmAudioChannelSchema = z.enum(['folja', 'forlikas', 'vanda_om']);
export type SwarmAudioChannel = z.infer<typeof SwarmAudioChannelSchema>;

export const FloorRequestSchema = z.object({
  channel: SwarmAudioChannelSchema,
  priority: z.number().int().min(1).max(3),
  requestedAt: z.number(),
});
export type FloorRequest = z.infer<typeof FloorRequestSchema>;

export const FloorStatusSchema = z.object({
  currentSpeaker: SwarmAudioChannelSchema.nullable(),
  activePriority: z.number().nullable(),
  isPreempting: z.boolean(),
  queueLength: z.number(),
});
export type FloorStatus = z.infer<typeof FloorStatusSchema>;
```

## 4. Destruktiva Handlingssteg
- Skriva om `liveAudioPlayback.ts` från `LiveAudioPlayer` till `DSPRingBufferMixer`.
- Utöka `sessionIntentAudio.ts` med `AudioPreRollBuffer` och pre-roll flush.
- Uppgradera `geminiLiveSession.ts` med tre parallella agent-sessioner och Floor Controller.
- Skapa `src/__tests__/transient_TCK-022a.test.ts`.
