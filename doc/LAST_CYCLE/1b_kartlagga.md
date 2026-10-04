# Steg 1b: Kartlägga Beroenden & Aktiva Vektorer (TCK-021a)

## 1. Aktiva Vektorer & Skills
- **active_vectors**: `google_drive_sync`, `vfs_staging`, `code_patching`
- **active_skill**: `none` (lokal domänlogik i `src/features/google_drive_sync/`)

## 2. Beroendekarta
```
src/features/google_drive_sync/
└── model/
    └── driveStore.ts (AKTIV FÖR FAS 2: VFS file staging & applyPatch engine)
src/__tests__/
└── transient_TCK-021a.test.ts (SKAPAS I FAS 2)
```
- Övriga domäner (`gemini_live_swarm`, `mcp_bridge`, `wal_logger`) lämnas helt orörda under TCK-021a.

## 3. Destruktiva Handlingssteg
- **Källkod att utöka/modifiera**:
  - `src/features/google_drive_sync/model/driveStore.ts`:
    - Inför VFS Staging i minnet (`vfsFiles = new Map<string, string>()`).
    - Exportera funktionerna `applyPatch`, `setVfsFile`, `getVfsFile`, `hasVfsFile`, `listVfsFiles`, `clearVfs`.
    - Exportera objektet `driveStore` samt uppdatera returvärdet från `useDriveStore` med `applyPatch` och `vfs`.
