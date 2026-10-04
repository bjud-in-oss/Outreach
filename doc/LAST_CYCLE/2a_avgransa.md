# Steg 2a: Avgränsa & Isolera (TCK-022a)

## 1. Strikt Domän- och FSD-avgränsning
- **Modul**: `src/features/gemini_live_swarm/`
- **Fokus**:
  - DSP Ring Buffer Mixer och spatial spatialisering i `liveAudioPlayback.ts`.
  - Floor Control och treparallell röstsamordning i `geminiLiveSession.ts`.
  - 200 ms Pre-roll-buffring i `sessionIntentAudio.ts`.
- **Förbud**:
  - Rör INTE `mcp_bridge` direkt i denna ticket (Bidi WebSocket MCP Tool Call-koppling tillhör TCK-022b).
  - Skapa inga mockar i produktionskod (`src/`).
  - Överskrid inte 250 rader per fil.
  - Rör ingen källkod under `src/` förrän i Fas 2 (efter godkänd Token Gate).
