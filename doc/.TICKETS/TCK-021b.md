# Building Ticket TCK-021b: MCP Tool Wrapper for Code Patching

## Mål & Kontext
Implementera MCP-verktyget `apply_code_patch` i mcp_bridge, registrera det i mcpServer.ts och koppla det till WAL-loggningen (PENDING -> COMMITTED).

## Domän & Avgränsning
- Domän: src/features/mcp_bridge/
- Exklusiva filer:
  - src/features/mcp_bridge/tools/codePatchTools.ts (ny)
  - src/features/mcp_bridge/server/mcpServer.ts
  - src/__tests__/transient_TCK-021b.test.ts (ny)

## Detaljerade Funktionella Krav
1. Skapa codePatchTools.ts med Zod-schema för apply_code_patch (filePath, searchBlock, replaceBlock).
2. Anropa driveStore.applyPatch och logga händelsen code.patch.applied i wal_logger.
3. Vid AMBIGUOUS_SEARCH_BLOCK: Fånga felet och returnera ett strukturerat systemmeddelande (nudge) till agenten utan att krrascha sessionen.
4. Registrera verktyget i mcpServer.ts.

## Destruktiva Handlingssteg
- Registrera codePatchTools i mcpServer.ts.

## Testkriterier
- pnpm verify passerar utan fel.
- Transient test src/__tests__/transient_TCK-021b.test.ts verifierar verktygsanrop via MCP JSON-RPC 2.0 samt WAL-loggning.