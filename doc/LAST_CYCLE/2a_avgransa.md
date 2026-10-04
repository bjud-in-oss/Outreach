# Steg 2a: Avgränsa & Isolera (TCK-021b)

## 1. Strikt Domän- och FSD-avgränsning
- **Modul**: `src/features/mcp_bridge/`
- **Fokus**: Verktygsdefinition och serverregistrering för `apply_code_patch`.
- **Förbud**:
  - Inga ändringar i `driveStore.ts` eller `driveClient.ts` (tillhörde TCK-021a och är redan verifierad).
  - Inga ändringar i `gemini_live_swarm` (ljudmixer och floor control tillhör TCK-022a, Bidi wiring tillhör TCK-022b).
  - Inga ändringar i befintliga verktyg `drive_create_file`, `wal_query_recent` eller `outreach_evaluate_tone`.

## 2. Arkitektur- och Kodmått
- `codePatchTools.ts` hålls under 100 rader.
- `mcpServer.ts` hålls strikt under 240 rader (maximalt tillåtet för TypeScript är 250 rader).
- Inga cirkulära beroenden och inga produktionsmockar.
