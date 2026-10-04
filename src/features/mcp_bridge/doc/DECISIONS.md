# Arkitekturbeslut: Model Context Protocol Bridge (`mcp_bridge`)

Detta dokument samlar alla domänspecifika arkitekturbeslut för MCP-bryggan och verktygsexponering enligt ADR-004 och AGENTS.md v10.0.

---

## ADR-MCP-001: Strikt JSON-RPC 2.0 Protokollvalidering
- **Datum**: 2026-09-23
- **Status**: Beslutat & Implementerat
- **Kontext**: Model Context Protocol förutsätter standardiserad kommunikation via JSON-RPC 2.0. Felaktigt formaterade meddelanden kan krascha anropande agenter eller leda till tysta fel.
- **Beslut**: Validera varje inkommande MCP-anrop (`tools/list`, `tools/call`, `resources/list`) och utgående svar mot strikta Zod-scheman (`mcpRequestSchema`, `mcpResponseSchema`). Alla fel returneras med officiella JSON-RPC felkoder (t.ex. -32600 Invalid Request, -32601 Method not found, -32602 Invalid params).
- **Konsekvens**: 100% protokollkompatibilitet med alla externa MCP-kompatibla verktyg och klienter.

---

## ADR-MCP-002: Modulärt Registreringsmönster för Verktygshandlers
- **Datum**: 2026-09-23
- **Status**: Beslutat & Implementerat
- **Kontext**: När nya funktioner tillkommer i Outreach Samordningsmotor (t.ex. Drive-operationer, WAL-frågor eller Svärmstyrning) måste de kunna exponeras som MCP-verktyg utan att kärnservern sväller.
- **Beslut**: Implementera ett pluggbart registeringsgränssnitt i `McpServer` där verktygsdefinitioner (`McpToolDefinition`) registreras med sitt JSON-schema och en associerad exekverings-handler.
- **Konsekvens**: Hög modularitet, ren separation mellan protokollhantering och domänspecifik affärslogik.

---

## ADR-MCP-003: Djupintegration med Gemini Live Swarm och NON_BLOCKING WebSocket-exekvering
- **Datum**: 2026-09-27
- **Status**: Beslutat & Implementerat (TCK-003)
- **Kontext**: Autonom fleragentorkestrering kräver att agenter kan anropa MCP-verktyg (Google Drive, WAL-logg, Kvalitetsgranskning) utan att blockera Gemini Live WebSocket-kabeln eller kräva manuell användarinteraktion mellan stegen.
- **Beslut**:
  1. Skapa `McpSwarmBridge` som integrerar `createUnifiedMcpServer()` med `SwarmEventBus`.
  2. Implementera asynkron verktygsexekvering som returnerar `BidiGenerateContentToolResponse` med `behavior: 'NON_BLOCKING'`.
  3. Publicera CloudEvents 1.0 händelser (`mcp.tool.execution.started`, `mcp.tool.execution.completed`) för full telemetrisk spårbarhet.
  4. Injicera bryggan i `SwarmOrchestrator` så att enheterna *Att följa Guds son* och *Att vända om till Gud* autonomt kan persistera utkast och granska tonfall.
- **Konsekvens**: Oavbruten autonom verktygsexekvering över WebSocket-kabeln med full händelsespårbarhet och noll UI-blockering.

---

## ADR-MCP-004: MCP Tool Wrapper för Kirurgisk Kodpatchning & Strukturerade System-Nudges
- **Datum**: 2026-10-04
- **Status**: Beslutat & Implementerat (TCK-021b)
- **Kontext**: När svärmens agenter utför kodredigeringar via `apply_code_patch` får oväntade sökblocksavvikelser (t.ex. dubblettförekomster eller indragsfel) inte resultera i protokollfel (-32603) som kraschar anropet eller fryser Live Bidi-sessionen.
- **Beslut**:
  1. **Zod-schema med Prompt-Beskrivning**: `ApplyCodePatchSchema` deklarerar `searchBlock` med explicit prompt-instruktion som vägleder modellen att alltid bifoga 1–2 omgivande rader för unikhet.
  2. **Transaktionell WAL-spårbarhet**: Innan VFS-patchning loggas `code.patch.applied` som `PENDING` i `WalEngine`, och markeras som `COMMITTED` vid framgång respektive `FAILED` vid fel.
  3. **Strukturerad Felhantering (isError: true)**: Vid `AMBIGUOUS_SEARCH_BLOCK` eller saknat block fångas felet och returneras som `{ content: [...], isError: true }` med en handledande system-nudge i stället för ett okontrollerat RPC-fel.
- **Konsekvens**: Robust och självläkande kodpatchning via MCP utan risk för sessionstapp eller kraschade verktygsanrop.

---

## ADR-MCP-005: Bidi WebSocket Live MCP Wiring & Event-Driven Floor Release
- **Datum**: 2026-10-04
- **Status**: Beslutat & Implementerat (TCK-022b)
- **Kontext**: När Svärmens agenter exekverar verktyg under pågående tal i Gemini Live API krävs omedelbara `NON_BLOCKING` röstsvar till Bidi-kabeln så att talströmmen inte tystnar eller klickar. Dessutom krävs en standardiserad CloudEvent-signalering med `agentId` för att signalera att agenten slutfört sitt bakgrundsarbete och kan släppa röstgolvet kontrollerat.
- **Beslut**:
  1. **Dynamisk Bidi Tools Deklaration**: Implementera `getBidiFunctionDeclarations()` i `McpSwarmBridge` som direkt mappar alla registrerade MCP-verktyg till formatet som krävs av `liveConfig.tools` i Gemini 3.8 Live API.
  2. **Icke-blockerande Tool Routing**: Implementera `routeToolCallNonBlocking` som omedelbart returnerar ett ack-svar med `behavior: 'NON_BLOCKING'` till WebSocket-kabeln och asynkront sparkar igång `mcpServer.handleJsonRpcRequest`.
  3. **Event-Driven Floor Release**: Publicera `mcp.tool.execution.completed` med `agentId`, `toolCallId`, `toolName` och `status` ('COMMITTED' | 'ERROR') på `SwarmEventBus` så snart verktygsexekveringen avslutas. Detta bevarar FSD-isoleringen mellan `mcp_bridge` och `gemini_live_swarm`.
- **Konsekvens**: Blixtsnabb respons (< 50 ms) för röstkabeln, noll ljudfrysningar vid filpatchning och deterministisk händelsebaserad röstgolvsfrigörelse.

