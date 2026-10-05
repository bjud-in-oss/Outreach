# Steg 2a: Avgränsa & Isolera (TCK-023)

## 1. Strikt Domän- och FSD-avgränsning
- **Modul**: `src/features/gemini_live_swarm/`
- **Exklusiva filer**:
  - `src/features/gemini_live_swarm/ui/SplitPaneCanvas.tsx`
  - `src/features/gemini_live_swarm/ui/splitPaneHelper.ts`
  - `src/features/gemini_live_swarm/ui/SymbolCrown.tsx`
  - `src/features/gemini_live_swarm/ui/ExecutionCard.tsx`
  - `src/__tests__/transient_TCK-023.test.ts`
- **Inga ändringar under andra moduler**: Inga filer under `google_drive_sync/`, `mcp_bridge/`, `wal_logger/` eller `session/` modifieras.
- **AST-gräns**: Samtliga berörda filer ska hålla sig strikt under 250 rader och under 4 indenteringsnivåer.
