# Steg 1b: Kartlägga Beroenden & Aktiva Vektorer (TCK-022c)

## 1. Aktiva Vektorer & Skills
- **active_vectors**: `gemini_live_swarm`, `session_intent_audio`, `vad_zcr_softening`, `continuous_mic_sync`, `pcm16_streaming`
- **active_skill**: `gemini-api`

## 2. Beroendekarta
- `src/features/gemini_live_swarm/session/sessionIntentAudio.ts`:
  - Funktion: `detectSpeechPCM(samples: Float32Array, rmsThreshold = 0.015, zcrThreshold = 0.05)`
  - Klass: `SessionIntentManager` (`startPCM16Sampling`, `processIncomingChunk`, `onaudioprocess`)
- `src/features/gemini_live_swarm/index.ts`: Exporterar `detectSpeechPCM`, `SessionIntentManager`, `AudioPreRollBuffer`, `floatTo16BitPCM`.
- `src/__tests__/transient_TCK-022c.test.ts`: Transienta tester för TCK-022c.

## 3. Destruktiva Handlingssteg
- I `src/features/gemini_live_swarm/session/sessionIntentAudio.ts`:
  - Radera den strikta konjunktionen `rms > rmsThreshold && zcr > zcrThreshold` och ersätt med disjunktionen med volym-boost: `rms > (rmsThreshold * 1.5) || (rms > rmsThreshold && zcr > zcrThreshold)`.
  - Radera spärren `if (!this.activeIntent) return;` i `audioProcessor.onaudioprocess`.
  - Säkerställ att `processIncomingChunk` behandlar ljud oberoende av `activeIntent`.
