# Steg 2a: Avgränsa & Försoningsfokus (TCK-020d)

## 1. Strikt Avgränsning
- **Enskild fil**: `src/features/gemini_live_swarm/session/geminiLiveSession.ts`.
- **Inga ändringar under**:
  - `src/features/gemini_live_swarm/coordinator/`
  - `src/features/gemini_live_swarm/ui/`
  - `src/features/mcp_bridge/`
  - `src/features/google_drive_sync/`
  - `src/features/wal_logger/`
  - `src/shared/`

## 2. Arkitekturmått (AST)
- Max 250 rader för `geminiLiveSession.ts`.
- Max 4 indenteringsnivåer (max 8 mellanslag).
- Inga tysta produktionsmockar (`isTestMode`, `generateDeterministicFallback`).
