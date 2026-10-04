# Steg 2a: Avgränsa & Isolera (TCK-021a)

## 1. Strikt Domän- och FSD-avgränsning
- **Modul**: `src/features/google_drive_sync/`
- **Fokus**: Enbart VFS Staging och algoritmen för `applyPatch` i `driveStore.ts`.
- **Förbud**:
  - Inga ändringar i `mcp_bridge` (MCP-verktyget och WAL-kopplingen tillhör TCK-021b).
  - Inga ändringar i `gemini_live_swarm` (DSP-mixer och floor control tillhör TCK-022a).
  - Inga ändringar i UI-komponenter eller mockfiler.

## 2. Arkitektur- och Kodmått
- `driveStore.ts` hålls under 200 rader (strikt under maxgränsen på 250 rader för TypeScript).
- Inga cirkulära beroenden.
- Rent TypeScript utan externa tredjepartsberoenden för strängjämförelsen.
