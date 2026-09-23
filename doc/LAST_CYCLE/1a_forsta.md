# 1a Förstå: Systemvision och Migrationsunderlag (TCK-001)

## 1. Målbild & Bakgrund
Målet med **Outreach Samordningsmotor** är att tillhandahålla en samordnings- och orkestreringsplattform för automatiserad, tillförlitlig och distribuerad outreach. Plattformen förenar realtids multi-agent svärmintelligens (Gemini Live API), oföränderlig händelseloggning (Write-Ahead Logging / WAL), standardiserad verktygsinteroperabilitet (Model Context Protocol / MCP) samt robust tvåvägssynkning och workspace-etablering i Google Drive.

## 2. Analys av Migrationskällor
Systemet hämtar beprövade mönster från fyra referensarkitekturer:
1. **Master-frö (`outreach-template`)**:
   - Skal och modulär Feature-Sliced Design (FSD).
   - Enhetliga kontrakt och CloudEvents-kompatibla wrappers.
   - UI-layout och samordningspanel.
2. **Skarp Drive-skrivning (`sandras-historia-2`)**:
   - Verifierad Google Drive API v3-kommunikation med multipart/resumable upload.
   - Mappstrukturhantering (`ensureDirectoryExists`, MIME-typsdetektering, ID-caching).
   - In-memory token management enligt säkerhetsriktlinjer utan extern token-läcka.
3. **DriveSync, WAL & Swarm (`Ouroboros-Agent`)**:
   - Write-Ahead Logging (WAL) med sekvensnummer, checksummor och deterministisk replay vid återstart.
   - Swarm-orkestrering där specialiserade agenter (Researcher, Outreach Drafter, Critic, Orchestrator) delar ett kontextfönster och event-buss.
   - Tvåvägs tillståndskonflikthantering mellan lokalt tillstånd och Google Drive.
4. **MCP Bridge (`agent-test`)**:
   - Model Context Protocol över JSON-RPC 2.0.
   - Dynamisk verktygsregistrering (`tools/list`, `tools/call`).
   - Standardiserade felkoder och strömmande svarsstöd.

## 3. Modulöversikt för Planering
- `google_drive_sync`: Drive Workspace setup, filsynkronisering, kvot- och tokenspårning.
- `wal_logger`: Append-only transaktionslogg, återhämtningsmekanism (crash recovery), audit trail.
- `mcp_bridge`: MCP klient/server-brygga som exponerar interna verktyg till AI-agenter och externa klienter.
- `gemini_live_swarm`: Multi-agent samarbete via moderna Gemini 2.5/Gemini SDK-anrop (`@google/genai`), rollstyrning och konsensus.
- `scripts/init-drive-workspace.js`: Automatisk bootstrap av kataloghierarki på Google Drive.
- `README.md`: Arkitekturöversikt, startguide och det personliga brevet.
