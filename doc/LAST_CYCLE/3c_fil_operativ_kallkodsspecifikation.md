# Steg 3c: Filoperativ Källkodsspecifikation (TCK-022a)

## 1. GROW Specifikation
- **Goal (Mål)**: Etablera en klickfri DSP Ring Buffer Mixer med spatial panorering (-0.4, 0.0, +0.4) och Node.js-säker körning i `liveAudioPlayback.ts`, nativ PCM VAD (RMS-energi + Zero-Crossing Rate) med 200 ms Pre-Roll och 500 ms Post-Roll i `sessionIntentAudio.ts`, samt prioriterad preemptive Floor Control (forlikas [1] > vanda_om [2] > folja [3]) och 3-parallella Bidi WebSocket-sessioner (`Puck`, `Aoede`, `Charon`) i `geminiLiveSession.ts`.
- **Reality (Nuläge)**: Enkel linjär `LiveAudioPlayer` som saknar spatial stereopanering och kraschar i Node.js utan AudioContext. Inget VAD-skydd eller pre-roll i `sessionIntentAudio.ts`. Singel-Bidi session utan röstseparation eller preemptive golvkontroll.
- **Options (Alternativ)**: Externa npm-paket (Silero ONNX runtime) vs ren nativ PCM VAD i TypeScript. Vi väljer nativ PCM VAD för noll externa beroenden, garanterad stabilitet i sandlådan och omedelbar deterministisk respons under < 1 ms.
- **Will (Plan & Åtagande)**: Bygg om `liveAudioPlayback.ts` till `DSPRingBufferMixer`, uppgradera `sessionIntentAudio.ts` med VAD och pre-roll, modularisera `geminiLiveSession.ts` för 3 parallella Bidi-anslutningar, och etablera den transienta testsviten `src/__tests__/transient_TCK-022a.test.ts`.

## 2. Operativt Delta (Bevara vs Sanera)
- **Bevara**:
  - Existerande 16kHz PCM-sampling och nedskalning av mikrofonljud.
  - Zod-kontrakt och telemetri i `src/features/gemini_live_swarm/telemetry/telemetrySchema.ts`.
  - Integrering med `SwarmEventBus`.
- **Sanera / Ersätta**:
  - Ersätt enkel `LiveAudioPlayer` i `liveAudioPlayback.ts` med `DSPRingBufferMixer` med spatial stereopanering (-0.4, 0.0, +0.4).
  - Ersätt singel-agent start i `geminiLiveSession.ts` med 3-parallell Bidi-initiering (`Puck`, `Aoede`, `Charon`) och preemptive Floor Control med 15 ms arbitration window och 18 ms mjuk gain-rampning.
  - Ersätt oskyddad mikrofonströmning i `sessionIntentAudio.ts` med nativ PCM VAD, 200 ms Pre-Roll och 500 ms Post-Roll.

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

export const VadEventPayloadSchema = z.object({
  isSpeech: z.boolean(),
  rms: z.number(),
  zcr: z.number(),
  timestamp: z.string(),
});
export type VadEventPayload = z.infer<typeof VadEventPayloadSchema>;
```

## 4. Destruktiva Handlingssteg
- Bygg om `liveAudioPlayback.ts` från `LiveAudioPlayer` till `DSPRingBufferMixer`.
- Utöka `sessionIntentAudio.ts` med nativ PCM VAD, 200 ms Pre-Roll och 500 ms Post-Roll.
- Modularisera och uppgradera `geminiLiveSession.ts` med 3-parallella Bidi-anslutningar och Floor Controller (< 250 rader).
- Skapa `src/__tests__/transient_TCK-022a.test.ts`.
