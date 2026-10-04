# Steg 1b: Kartlägga Beroenden & Aktiva Vektorer (TCK-021b)

## 1. Aktiva Vektorer & Skills
- **active_vectors**: `mcp_bridge`, `code_patching`, `wal_logger`, `google_drive_sync`
- **active_skill**: `none` (lokal integrering mellan moduler)

## 2. Beroendekarta
```
src/features/mcp_bridge/
├── server/
│   └── mcpServer.ts (AKTIV FÖR FAS 2: Registrera apply_code_patch)
├── tools/
│   ├── driveTools.ts (BEVARAS ORÖRD)
│   ├── walTools.ts (BEVARAS ORÖRD)
│   └── codePatchTools.ts (NY FIL: Zod-schema, WAL-koppling & VFS-anrop)
src/features/wal_logger/
└── engine/
    └── walEngine.ts (ANVÄNDS FÖR PENDING -> COMMITTED TRANSITIONS)
src/features/google_drive_sync/
└── model/
    └── driveStore.ts (ANVÄNDS FÖR applyPatch & VFS STAGING)
src/__tests__/
└── transient_TCK-021b.test.ts (SKAPAS I FAS 2)
```

## 3. Destruktiva Handlingssteg
- **Källkod att skapa/utöka**:
  - Skapa `src/features/mcp_bridge/tools/codePatchTools.ts`.
  - Exportera verktyget i `src/features/mcp_bridge/index.ts`.
  - Uppdatera `src/features/mcp_bridge/server/mcpServer.ts` att inkludera `apply_code_patch` i `createStandardMcpServer` och `createUnifiedMcpServer`.
