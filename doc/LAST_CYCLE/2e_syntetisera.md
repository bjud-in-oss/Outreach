# Steg 2e: Syntetisera & Förlika Målkonflikter (TCK-021a)

## 1. Målkonflikter & Förlikning
- **Konflikt**: Ska `applyPatch` modifiera filer tyst eller kasta tydliga, semantiska fel?
  - **Förlikning**: `applyPatch` måste kasta explicita fel (`FILE_NOT_FOUND`, `AMBIGUOUS_SEARCH_BLOCK`, `SEARCH_BLOCK_NOT_FOUND`) för att skydda källkodens integritet (Fail Fast). Verktygslagret (TCK-021b) kan sedan fånga dessa fel och returnera informativa nudges till agenten utan krasch.
- **Konflikt**: Ska `driveStore.ts` vara en ren React-hook eller också tillhandahålla en oberoende in-memory VFS?
  - **Förlikning**: Modulen exporterar både fristående funktioner (`applyPatch`, `setVfsFile`, `getVfsFile`, etc.) och knyter dem till hooken `useDriveStore` samt ett samlat `driveStore`-objekt. Detta gör att både MCP-verktyg och React-komponenter kan interagera med VFS-tillståndet utan onödig koppling.

## 2. Konsistenskontroll
- `driveStore.ts` utökas med deterministiska VFS-metoder.
- Inga brutna referenser till befintliga `GoogleDriveClient` eller `useDriveStore`.
- Filens radantal beräknas till ~170 rader (väl under 250 rader).

MÄTTNAD: JA
