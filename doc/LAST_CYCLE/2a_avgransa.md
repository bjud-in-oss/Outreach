# Steg 2a: Avgränsa & Isolera (TCK-022a)

## 1. Strikt Domän- och FSD-avgränsning
- **Modul**: `src/features/gemini_live_swarm/`
- **Fokus**:
  - `DSPRingBufferMixer` med spatial stereopanering och Node.js-säker körning i `liveAudioPlayback.ts`.
  - Nativ PCM VAD med 200 ms pre-roll och 500 ms post-roll i `sessionIntentAudio.ts`.
  - Floor Controller med prioritetsmatris, arbitration window (15 ms) och tre Bidi-sessioner i `geminiLiveSession.ts`.
- **Förbud**:
  - Rör INTE `mcp_bridge` direkt i denna ticket (Bidi WebSocket MCP Tool Call-koppling tillhör TCK-022b).
  - Skapa inga mockar i produktionskod (`src/`).
  - Importera inga externa VAD-paket som inte finns i `package.json`.
  - Överskrid inte 250 rader per fil.
  - Rör ingen källkod under `src/` förrän i Fas 2 (efter godkänd Token Gate).
