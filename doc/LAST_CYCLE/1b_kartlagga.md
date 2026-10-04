# Steg 1b: Kartlägga Beroenden & Aktiva Vektorer (TCK-022a)

## 1. Aktiva Vektorer & Skills
- **active_vectors**: `gemini_live_swarm`, `dsp_mixer`, `spatial_audio`, `floor_control`, `multi_bidi_sessions`
- **active_skill**: `gemini-api` (Modell: `models/gemini-3.8-live` med Bidi WebSocket, Extended Thinking och PCM Audio Streaming)

## 2. Berörda Domäner & Filer
- **Domän**: `src/features/gemini_live_swarm/`
- **Filer som modifieras i Fas 2**:
  - `src/features/gemini_live_swarm/session/liveAudioPlayback.ts`:
    - Ersätter `LiveAudioPlayer` / enkel kö med `DSPRingBufferMixer`.
    - 3 kanaler med `StereoPannerNode` (`folja: -0.4`, `forlikas: 0.0`, `vanda_om: +0.4`) och `GainNode`.
    - Metoder: `play24kHzPCMBase64`, `rampGain`, `clearBuffer`, `stopAll`.
  - `src/features/gemini_live_swarm/session/sessionIntentAudio.ts`:
    - Inför 200 ms cirkulär PCM16-buffert (`AudioPreRollBuffer`).
    - Flushar pre-roll vid aktivering av intention så inga konsonanter kapas.
  - `src/features/gemini_live_swarm/session/geminiLiveSession.ts`:
    - Etablerar Floor Control-motorn (Preemptive Floor Controller med prioritetsmatris Prio 1: forlikas, Prio 2: vanda_om, Prio 3: folja).
    - Tre parallella Bidi-anslutningar med unika röster (`Puck`, `Charon`, `Aoede`) och `thinkingLevel: "HIGH"`.
    - Hantering av `interrupted === true` och `turnComplete === true`.
  - `src/__tests__/transient_TCK-022a.test.ts`:
    - Transient testsvit (< 3s exekveringstid) som verifierar DSP-panorering, preemption inom 20 ms, pre-roll-buffring och avbrottssignaler.

## 3. FSD- & Arkitekturbegränsningar
- Inga cirkulära importberoenden.
- Håll alla `.ts`-filer under 250 rader enligt AST-regler i `scripts/drivers/ts.js`.
- Modulär koppling via `SwarmEventBus`.
