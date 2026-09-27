# 1b Kartlägga: Gemini Live Session Streaming & WebSocket Integration (TCK-010)

## 1. Kartläggning av Källkodsartefakter inom `gemini_live_swarm`

### Kärnkomponenter och Beröringspunkter

1. **`src/features/gemini_live_swarm/session/geminiLiveSession.ts`**:
   - Nuvarande implementation: Innehåller `GoogleGenAI` wrapper med `generateContent` samt statisk deterministisk fallback.
   - Förändringsbehov: Utöka med `gemini-3.8-live` anslutningshantering över WebSockets via `@google/genai` (`ai.live.connect`), metoder för realtidsinmatning (`sendRealtimeText`, `sendRealtimeAudio`), händelselyssnare och deterministisk strömningsfallback för in-memory testning.

2. **`src/features/gemini_live_swarm/telemetry/telemetrySchema.ts`**:
   - Nuvarande implementation: Innehåller scheman för `AgentForce`, `SerialExecutionMetric`, `SwarmTelemetrySnapshot`.
   - Förändringsbehov: Komplettera med `LiveSessionStatusSchema`, `LiveStreamChunkSchema` och CloudEvents-typer för strömning.

3. **`src/features/gemini_live_swarm/bus/swarmEventBus.ts`**:
   - Nuvarande implementation: Reaktiv pub/sub-buss med 150-elementers ringbuffert och `publishSerialMetric`.
   - Förändringsbehov: Tillhandahålla bekvämlighetsmetod `publishLiveStreamEvent` för typad distribution av strömningshändelser till gränssnittet.

4. **`src/features/gemini_live_swarm/coordinator/swarmOrchestrator.ts`**:
   - Nuvarande implementation: Exekverar kampanjsteg för de försonande enheterna.
   - Förändringsbehov: Reaktiv koppling till sessionsströmmen så att realtidstranskribering och delutkast distribueras direkt till de 4 enheterna under körning.

5. **`src/features/gemini_live_swarm/ui/SwarmDashboard.tsx` & `TelemetrySidebar.tsx`**:
   - Nuvarande implementation: Visar de 4 försoningsenheterna ("Att följa Guds son", "Att vända om till Gud", "Att förlikas med Gud", "Att försonas (ensam agent)").
   - Förändringsbehov: Reagera på strömningshändelser och visa realtidspuls/ljudströmning i gränssnittet.

6. **`src/__tests__/transient_TCK-010.test.ts` (Ny testfil i Fas 2)**:
   - Transient mikro-E2E-test som validerar anslutning, strömning av text och ljud, CloudEvents-distribution och reaktiv konsumtion hos de 4 försoningsenheterna.
