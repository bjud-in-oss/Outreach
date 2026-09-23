# 2b Modellera: Datastrukturer, Kontrakt och Tillståndsmaskiner

## 1. Händelse- och Kontraktsmodellering

### 1.1 Event Envelope (CloudEvents 1.0)
Alla händelser paketeras i det exekverbara Zod-schemat i `src/shared/contracts/envelope.ts`:
```typescript
interface EventEnvelope<T = unknown> {
  id: string;             // UUIDv4
  source: string;         // e.g., 'outreach/drive-sync' | 'outreach/swarm'
  type: string;           // e.g., 'drive.file.created' | 'agent.thought.generated'
  specversion: '1.0';
  datacontenttype: string;// 'application/json'
  time: string;           // ISO 8601 UTC
  data: T;
  traceparent?: string;   // W3C Trace Context
  correlationId?: string;
  metadata?: Record<string, unknown>;
}
```

### 1.2 Write-Ahead Log (WAL) Kontrakt
```typescript
interface WalEntry {
  sequenceNumber: number;
  entryHash: string;
  previousHash: string;
  timestamp: string;
  status: 'PENDING' | 'COMMITTED' | 'FAILED' | 'ROLLED_BACK';
  envelope: EventEnvelope;
}
```

### 1.3 Google Drive Workspace Kontrakt
```typescript
interface DriveWorkspaceStructure {
  rootFolderName: string; // 'Outreach_Workspace'
  subFolders: {
    campaigns: string;    // 'Campaigns'
    templates: string;    // 'Templates'
    logs: string;         // 'Logs'
    artifacts: string;    // 'Artifacts'
  };
}

interface DriveFileOperation {
  folderId: string;
  name: string;
  mimeType: string;
  content: string | Blob;
  description?: string;
}
```

### 1.4 MCP Bridge Kontrakt (JSON-RPC 2.0)
```typescript
interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>; // JSON Schema
}

interface McpToolCallRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: 'tools/call';
  params: {
    name: string;
    arguments: Record<string, unknown>;
  };
}

interface McpToolCallResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: {
    content: Array<{ type: 'text' | 'resource'; text?: string }>;
    isError?: boolean;
  };
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}
```

### 1.5 Gemini Live Swarm Kontrakt
```typescript
type AgentRole = 'ORCHESTRATOR' | 'RESEARCHER' | 'OUTREACH_WRITER' | 'CRITIC';

interface SwarmAgent {
  id: string;
  role: AgentRole;
  name: string;
  systemInstruction: string;
  status: 'IDLE' | 'PROCESSING' | 'WAITING_FOR_TOOL' | 'ERROR';
}

interface SwarmTask {
  id: string;
  campaignTarget: string;
  objective: string;
  currentStep: number;
  totalSteps: number;
  consensusScore?: number;
  status: 'PLANNING' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED' | 'FAILED';
}
```

## 2. Tillståndsövergångar (State Transitions)
- **Initiering**: `IDLE` -> `DRIVE_AUTHENTICATING` -> `WORKSPACE_READY`
- **Uppdragsexekvering**: `TASK_SUBMITTED` -> `WAL_ENTRY_LOGGED` -> `SWARM_PROCESSING` -> `TOOL_EXECUTION_MCP` -> `DRIVE_SYNCED` -> `TASK_COMMITTED`
- **Felhantering**: `FAILURE_DETECTED` -> `WAL_FAIL_FAST_LOGGED` -> `DIAGNOSTIC_ALERT` -> `RECOVERY_REPLAY`
