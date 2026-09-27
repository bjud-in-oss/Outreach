# 1b Kartlägga: Tyst Röstspärr & Namnutlöst Ljudaktivering i Live-gränssnittet (TCK-011)

## 1. Kartläggning av Källkodsartefakter inom `gemini_live_swarm`

### Kärnkomponenter och Beröringspunkter

1. **`src/features/gemini_live_swarm/telemetry/telemetrySchema.ts`**:
   - Nuvarande läge: Innehåller scheman för `AgentForce`, `SerialExecutionMetric`, `SwarmTelemetrySnapshot`, `LiveSessionStatus`, `LiveStreamChunk`.
   - Förändringsbehov: Inför `AudioOutputStateSchema` och `AudioOutputState`:
     ```typescript
     export const AudioOutputStateSchema = z.object({
       isMuted: z.boolean(),
       activeSpeakerUnitId: z.string().optional(),
       activeForce: AgentForceSchema.optional(),
       triggerReason: z.enum(['NAME_INVOCATION', 'TOKEN_GATE', 'MANUAL_UNMUTE', 'DEFAULT_SILENCE']).optional(),
       lastChangedAt: z.string(),
     });
     ```
   - Utöka `SwarmTelemetrySnapshotSchema` med fältet `audioOutput: AudioOutputStateSchema.optional()`.

2. **`src/features/gemini_live_swarm/telemetry/useSwarmTelemetry.ts`**:
   - Nuvarande läge: Hanterar prenumeration på `*` och uppdaterar `agentMetrics`, `serialExecution` och händelseström.
   - Förändringsbehov:
     - Implementera automatisk tyst röstspärr som standard (`isMuted: true`).
     - Lyssna på `swarm.audio.state.changed` samt analysera inkommande användartext och röstinmatning efter namnanrop på de 4 försoningsenheterna via `detectUnitInvocation`.
     - Lyssna på `swarm.serial.*` händelser: Om `stageStatus === 'GATED'` eller `currentStage === '3c_spec'`, aktivera automatiskt högtalaren med anledning `TOKEN_GATE` och enhet `unit-seriell-motor`.
     - Exponera hjälpfunktioner: `setManualMute(muted: boolean)`, `triggerVoiceByInvocation(text: string)`.

3. **`src/features/gemini_live_swarm/bus/swarmEventBus.ts`**:
   - Nuvarande läge: Reaktiv event-buss med `publish`, `publishLiveEvent`, `publishSerialMetric`.
   - Förändringsbehov:
     - Tillhandahåll `publishAudioState(audioState: AudioOutputState): EventEnvelope`.

4. **`src/features/gemini_live_swarm/ui/SwarmDashboard.tsx`**:
   - Nuvarande läge: Visar de 4 enheterna, live status och seriell motor.
   - Förändringsbehov:
     - Lägg till en ljudstatus-indikator (t.ex. `VolumeX` / `Volume2` ikon) i gränssnittet som tydligt visar:
       - "Tyst röstspärr aktiv (Bakgrundskörning i tystnad)"
       - "Högtalare öppen: [Enhetsnamn] via namnanrop"
       - "Högtalare öppen: Att försonas (ensam agent) vid Token Gate"
     - Ge användaren en manuell knapp för att slå på/av ljud vid behov.

5. **`src/__tests__/transient_TCK-011.test.ts` (Ny testfil i Fas 2)**:
   - Validerar att:
     1. Ljudutgången förblir tyst (`isMuted: true`) under flerstegskörningar.
     2. Namnanrop ("Att följa Guds son", "Att vända om", "Att förlikas", "Att försonas") öppnar högtalaren för rätt enhet.
     3. Token Gate (Steg 3c) automatiskt triggar högtalaren för "Att försonas (ensam agent)".
     4. Återställning till tystnad fungerar deterministiskt.
     5. Exekveras på < 3s i minnet.
