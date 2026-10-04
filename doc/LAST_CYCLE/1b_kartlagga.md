# Steg 1b: Kartlägga Beroenden & Aktiva Vektorer (TCK-022a)

## 1. Aktiva Vektorer & Skills
- **active_vectors**: `gemini_live_swarm`, `dsp_mixer`, `spatial_audio`, `native_pcm_vad`, `floor_control`, `multi_bidi_sessions`
- **active_skill**: `gemini-api` (Modell: `models/gemini-3.8-live` med Bidi WebSocket, Extended Thinking och PCM Audio Streaming)

## 2. Berörda Domäner & Filer
- **Domän**: `src/features/gemini_live_swarm/`
- **Källkodsfiler som berörs i Fas 2**:
  - `src/features/gemini_live_swarm/session/liveAudioPlayback.ts`:
    - `DSPRingBufferMixer` med tre stereokanaler:
      * `folja`: Pan `-0.4` (Vänster)
      * `forlikas`: Pan `0.0` (Mitten)
      * `vanda_om`: Pan `+0.4` (Höger)
    - Node.js-säker AudioContext-hantering med fullt teststöd under `pnpm verify`.
    - 18 ms mjuk gain-rampning och dröjt stopp av källnoder vid preemption.
  - `src/features/gemini_live_swarm/session/sessionIntentAudio.ts`:
    - Nativ PCM VAD-algoritm (RMS-energi + Zero-Crossing Rate).
    - Cirkulär RAM-ringbuffert för 200 ms Pre-Roll (3200 samplingar vid 16kHz).
    - 500 ms Post-Roll för bevarande av meningsslut och tvekan.
  - `src/features/gemini_live_swarm/session/geminiLiveSession.ts`:
    - Floor Control-orkestrering (Prioritet: forlikas [1] > vanda_om [2] > folja [3]).
    - Tre parallella Bidi-sessioner med unika röster:
      * `Puck` (Att följa)
      * `Aoede` (Att förlikas)
      * `Charon` (Att vända om)
    - Extended Thinking: `thinkingLevel: "HIGH"`.
    - Kompakt arkitektur som strikt håller filen under 250 rader enligt AST-regler i `scripts/drivers/ts.js`.
  - `src/__tests__/transient_TCK-022a.test.ts`:
    - Transient testsvit (< 3s) som verifierar DSP-panorering, nativ VAD med pre-roll & post-roll, omedelbar preemption inom 20 ms och avbrottssignaler.

## 3. FSD- & AST-begränsningar
- Noll externa npm-beroenden för VAD (enbart standard TypeScript-matematik).
- Inga mockar i produktionskoden under `src/`.
- Håll alla berörda filer strikt under 250 rader.
