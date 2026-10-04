# Steg 3c: Filoperativ Källkodsspecifikation (TCK-021a)

## 1. GROW Specifikation
- **Goal (Mål)**: Implementera O(N) `applyPatch` i `driveStore.ts` för VFS Staging med tvåstegsmatchning, LF-normalisering och strikt `AMBIGUOUS_SEARCH_BLOCK`-skydd.
- **Reality (Nuläge)**: `driveStore.ts` tillhandahåller `useDriveStore` och `GoogleDriveClient`, men saknar en lokal in-memory VFS Staging-motor för kirurgisk search/replace.
- **Options (Alternativ)**:
  - Alternativ 1: Använda ett tungt diff/patch-bibliotek med fuzzy regex. Risk för icke-deterministisk matchning och extra npm-beroenden.
  - Alternativ 2: Skriva en strikt O(N) strängalgoritm baserad på `indexOf`, explicit count-validering och LF-normaliserad fallback. Garanterar determinism och noll externa beroenden.
- **Will (Beslut)**: Genomför Alternativ 2 i `driveStore.ts`.

## 2. Operativt Delta: Bevara vs Sanera
- **Bevara**:
  - `DriveState`, `GoogleDriveClient`, `globalDriveClient`, `getGlobalDriveClient`, `useDriveStore`.
  - Befintliga metoder: `setAccessToken`, `refreshSession`, `initWorkspace`, `refreshFiles`.
- **Sanera / Utöka (Destruktiva Handlingssteg för Fas 2)**:
  - Utöka `driveStore.ts` med:
    - `vfsFiles: Map<string, string>`
    - `setVfsFile(filePath: string, content: string): void`
    - `getVfsFile(filePath: string): string | undefined`
    - `hasVfsFile(filePath: string): boolean`
    - `listVfsFiles(): string[]`
    - `clearVfs(): void`
    - `applyPatch(filePath: string, searchBlock: string, replaceBlock: string): string`
    - Exportera samlat objekt `driveStore` för enkel åtkomst i verktygslager.
  - Skapa transient test `src/__tests__/transient_TCK-021a.test.ts`.

## 3. Zod-kontrakt & Typdefinitioner
```typescript
export interface PatchResult {
  filePath: string;
  updatedContent: string;
}

export type VfsErrorCode = 'FILE_NOT_FOUND' | 'AMBIGUOUS_SEARCH_BLOCK' | 'SEARCH_BLOCK_NOT_FOUND';
```

## 4. Godkännandekod (Token Gate)
- **Token**: `TCK-021A-VFS-PATCH-TOKEN`
- **Säkerhetsspärr**: Ingen källkod under `src/` ändras förrän användaren anger godkännandekoden i chatten via `pnpm genomfor TCK-021A-VFS-PATCH-TOKEN`.
