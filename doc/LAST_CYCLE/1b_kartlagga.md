# Steg 1b: Kartlägga & Arkitekturkartering (TCK-020c)

## 1. Berörda FSD-komponenter och Moduler
- **Domän**: `src/features/gemini_live_swarm/`
- **Primära filer**:
  1. `src/features/gemini_live_swarm/session/geminiLiveSession.ts`:
     - Sanera WebSocket Bidi-handskakning och setup-payload.
     - Inför stöd för `extended_thinking` och `['TEXT', 'AUDIO']` responseModalities.
     - Konfigurera `realtimeInput.mediaChunks` för PCM16 16kHz mono base64 streaming.
     - Rensa alla REST/HTTP-fallbacks, döda reconnect-loops och dubbla API-nyckelvägar.
  2. `src/features/gemini_live_swarm/coordinator/swarmOrchestrator.ts`:
     - Koppla händelsebussen till automatiserad verktygsexekvering som returnerar `BidiGenerateContentToolResponse` med `behavior: 'NON_BLOCKING'`.
  3. `src/features/gemini_live_swarm/session/sessionIntentAudio.ts`:
     - Bevara alla PCM16- och User Gesture-hooks orörda.
  4. `src/__tests__/transient_TCK-020c.test.ts`:
     - Isolerat test som verifierar Bidi setup, mediaChunks-struktur och NON_BLOCKING verktygssvar i minnet (< 3s).

## 2. Destruktiva Handlingssteg
1. Radera all REST/HTTP-anropskod, REST-fallbacks och dubbla API-nyckelvägar under `src/features/gemini_live_swarm/session/geminiLiveSession.ts`.
2. Radera platta/föråldrade audio-payloadbyggare i `geminiLiveSession.ts` och ersätt med strikt Zod-validerad `realtimeInput.mediaChunks`-struktur.
3. Radera manuella reconnect-loops i WebSocket-klienten som skapar dolda zombiekablar.

## 3. Arkitekturvektorer och Maskinläsbar Deklaration

```json
{
  "status": "IN_PROGRESS",
  "current_domain": "src/features/gemini_live_swarm/",
  "next_step": "2e_syntetisera",
  "ticket_id": "TCK-020c",
  "active_skill": "gemini-live-api-dev",
  "active_vectors": [
    "bidi_websocket_extended_thinking",
    "pcm16_mediachunks_packaging",
    "non_blocking_tool_response",
    "fail_fast_resilience"
  ]
}
```
