# 3c Fil-operativ Källkodsspecifikation (TCK-001)

Denna specifikation definierar exakt vilka filer, gränssnitt, funktioner och tester som ska skapas under Fas 2 efter godkänd Token Gate.

---

## 1. Modulöversikt och Fildistribution

### 1.1 `src/features/google_drive_sync/`
Hanterar Google Drive API v3-kommunikation, workspace-hierarki, filuppladdning/nedladdning och status.
- **`api/driveClient.ts`**:
  - `initGoogleDriveClient(accessToken: string)`
  - `ensureWorkspaceHierarchy(rootName: string): Promise<DriveWorkspaceFolders>`
  - `uploadFileMultipart(params: UploadFileParams): Promise<DriveFileMetadata>`
  - `downloadFile(fileId: string): Promise<string>`
  - `listWorkspaceFiles(folderId: string): Promise<DriveFileMetadata[]>`
- **`model/driveStore.ts`**:
  - Tillstånd för synkronisering, aktiv token, ansluten användare och fillista.
- **`ui/DriveSyncPanel.tsx`**:
  - Gränssnittskomponent med "Sign in with Google", status för Workspace-mappar och synkroniseringslogg.
- **`index.ts`**:
  - Explicita fasader: `export { GoogleDriveClient, useDriveStore, DriveSyncPanel }`.

---

### 1.2 `src/features/wal_logger/`
Write-Ahead Logg för deterministisk feltolerans och audit-spårbarhet.
- **`contracts/walSchema.ts`**:
  - Zod-schema för `WalEntrySchema` och `WalRecord`.
- **`engine/walEngine.ts`**:
  - `appendWalEntry(envelope: EventEnvelope): Promise<WalEntry>`
  - `commitWalEntry(sequenceNumber: number): Promise<void>`
  - `failWalEntry(sequenceNumber: number, error: string): Promise<void>`
  - `getWalHistory(): WalEntry[]`
- **`replay/walReplay.ts`**:
  - `replayUncommittedEntries(handler: (entry: WalEntry) => Promise<void>): Promise<ReplayResult>`
- **`index.ts`**:
  - Explicita fasader: `export { WalEngine, WalReplayer, WalEntrySchema }`.

---

### 1.3 `src/features/mcp_bridge/`
Model Context Protocol (JSON-RPC 2.0) för standardiserad verktygsexekvering.
- **`contracts/mcpSchema.ts`**:
  - Zod-scheman för JSON-RPC meddelanden och tool definitions.
- **`server/mcpServer.ts`**:
  - `registerTool(definition: McpToolDefinition, handler: ToolHandler): void`
  - `handleJsonRpcRequest(request: McpRequest): Promise<McpResponse>`
- **`tools/driveTools.ts`**:
  - MCP-verktyg: `drive_create_file`, `drive_search_files`, `drive_read_file`.
- **`tools/walTools.ts`**:
  - MCP-verktyg: `wal_query_recent`, `wal_mark_committed`.
- **`index.ts`**:
  - Explicita fasader: `export { McpServer, createStandardMcpServer }`.

---

### 1.4 `src/features/gemini_live_swarm/`
Multi-agent svärm för distribuerad outreach-orkestrering med moderna `@google/genai`.
- **`agents/roleDefinitions.ts`**:
  - Definitioner av agentroller:
    - `ResearcherAgent`: Samlar in företagsdata och kontext.
    - `OutreachWriterAgent`: Genererar personliga brev och sekvenser.
    - `CriticAgent`: Granskar och ger betyg enligt policy och tonläge.
    - `OrchestratorAgent`: Fördelar uppgifter och sammanställer konsensus.
- **`coordinator/swarmOrchestrator.ts`**:
  - `startSwarmCampaign(campaignPlan: CampaignInput): Promise<CampaignResult>`
  - `coordinateStep(taskId: string): Promise<StepOutcome>`
- **`session/geminiLiveSession.ts`**:
  - Hanterar sessioner och anrop till Google GenAI API (Gemini 2.5 Flash).
- **`ui/SwarmDashboard.tsx`**:
  - Visualisering av svärmens agenter, pågående tankekedjor och slutresultat.
- **`index.ts`**:
  - Explicita fasader: `export { SwarmOrchestrator, SwarmDashboard }`.

---

### 1.5 `scripts/init-drive-workspace.js`
Skript för att initiera Google Drive Workspace:
- Kontrollerar tillgänglig token eller uppmanar till inloggning.
- Söker efter befintlig `Outreach_Workspace`-rotmapp i Google Drive via API v3.
- Skapar undermappar: `Campaigns`, `Templates`, `Logs`, `Artifacts`.
- Skapar en initial metadata-fil `workspace-manifest.json` med versionsnummer och datum.
- Returnerar en strukturerad JSON-rapport över skapade mapp-ID:n.

---

### 1.6 `README.md` (inklusive det personliga brevet)
- Teknisk systemdokumentation och arkitekturöversikt.
- Instruktioner för att köra applikationen och konfigurera Google Workspace OAuth.
- **Det personliga brevet**: En pedagogisk och personlig introduktion till varför denna samordningsmotor byggts, dess filosofi om transparens (WAL), samverkan (Swarm) och öppenhet (Drive & MCP).

---

## 2. Testplan (TDD)
I enlighet med Fas 2-direktiven skapas isolerade enhetstester i `src/__tests__/`:
1. `src/__tests__/envelope.test.ts`: Validering av `EventEnvelopeSchema` med giltiga/ogiltiga data.
2. `src/__tests__/wal_logger.test.ts`: Test av append-only sekvensering, commit och återhämtningsreplay.
3. `src/__tests__/drive_sync.test.ts`: Mockade Drive API v3 anrop, multipart build, felhantering.
4. `src/__tests__/mcp_bridge.test.ts`: JSON-RPC 2.0 protokollvalidering, felkoder och verktygsanrop.
5. `src/__tests__/gemini_swarm.test.ts`: Agent-koordinering, rollhantering och sammanställning.

---

## 3. Token Gate Låsning
Denna specifikation är nu låst. Inga ändringar i `src/` (bortom grundkontraktet) kommer att genomföras förrän användaren anger godkännandekoden:
`OUTREACH-COORD-TCK001-TOKEN`
