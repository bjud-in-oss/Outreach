import { useState, useCallback, useEffect } from 'react';
import { GoogleDriveClient, DriveFileMetadata, DriveWorkspaceFolders } from '../api/driveClient.ts';

export interface DriveState {
  isAuthenticated: boolean;
  accessToken: string | null;
  expiresAt: number | null;
  isTokenExpired: boolean;
  isTokenExpiringSoon: boolean;
  userEmail: string | null;
  workspaceFolders: DriveWorkspaceFolders | null;
  recentFiles: DriveFileMetadata[];
  isLoading: boolean;
  error: string | null;
}

// In-memory singleton för klient och token för att undvika localStorage-läckage
let globalDriveClient: GoogleDriveClient = new GoogleDriveClient();

// In-memory VFS Staging för kirurgisk kodpatchning och filstaging
const vfsFiles: Map<string, string> = new Map();

export function countSubstrOccurrences(str: string, substr: string): number {
  if (!substr) return 0;
  let count = 0;
  let pos = 0;
  while ((pos = str.indexOf(substr, pos)) !== -1) {
    count++;
    pos += substr.length;
  }
  return count;
}

export function setVfsFile(filePath: string, content: string): void {
  vfsFiles.set(filePath, content);
}

export function getVfsFile(filePath: string): string | undefined {
  return vfsFiles.get(filePath);
}

export function hasVfsFile(filePath: string): boolean {
  return vfsFiles.has(filePath);
}

export function listVfsFiles(): string[] {
  return Array.from(vfsFiles.keys());
}

export function deleteVfsFile(filePath: string): boolean {
  return vfsFiles.delete(filePath);
}

export function clearVfs(): void {
  vfsFiles.clear();
}

/**
 * Utför kirurgisk O(N) search/replace på en fil i VFS Staging.
 * Stödjer LF-normalisering som fallback och skyddar mot tvetydighet via AMBIGUOUS_SEARCH_BLOCK.
 */
export function applyPatch(filePath: string, searchBlock: string, replaceBlock: string): string {
  const currentContent = vfsFiles.get(filePath);
  if (currentContent === undefined) {
    throw new Error(`FILE_NOT_FOUND: Filen '${filePath}' hittades inte i VFS Staging.`);
  }

  // Steg 1: Exakt matchning
  const exactCount = countSubstrOccurrences(currentContent, searchBlock);
  if (exactCount > 1) {
    throw new Error(
      `AMBIGUOUS_SEARCH_BLOCK: Sökblocket förekommer ${exactCount} gånger i '${filePath}'. Ange 2–3 omgivande kontextrader för unik matchning.`
    );
  }
  if (exactCount === 1) {
    const idx = currentContent.indexOf(searchBlock);
    const updated = currentContent.slice(0, idx) + replaceBlock + currentContent.slice(idx + searchBlock.length);
    vfsFiles.set(filePath, updated);
    return updated;
  }

  // Steg 2: Fuzzy fallback via LF-normalisering & trimning
  const normContent = currentContent.replace(/\r\n/g, '\n');
  const normSearch = searchBlock.replace(/\r\n/g, '\n');
  const normReplace = replaceBlock.replace(/\r\n/g, '\n');

  let normCount = countSubstrOccurrences(normContent, normSearch);
  let effectiveSearch = normSearch;

  if (normCount === 0) {
    const trimmedSearch = normSearch.trim();
    if (trimmedSearch) {
      const trimmedCount = countSubstrOccurrences(normContent, trimmedSearch);
      if (trimmedCount > 0) {
        normCount = trimmedCount;
        effectiveSearch = trimmedSearch;
      }
    }
  }

  if (normCount > 1) {
    throw new Error(
      `AMBIGUOUS_SEARCH_BLOCK: Sökblocket förekommer ${normCount} gånger i '${filePath}'. Ange 2–3 omgivande kontextrader för unik matchning.`
    );
  }
  if (normCount === 1) {
    const idx = normContent.indexOf(effectiveSearch);
    const updated = normContent.slice(0, idx) + normReplace + normContent.slice(idx + effectiveSearch.length);
    vfsFiles.set(filePath, updated);
    return updated;
  }

  throw new Error(`SEARCH_BLOCK_NOT_FOUND: Sökblocket hittades inte i '${filePath}'. Kontrollera indrag och kontextrader.`);
}

export const driveStore = {
  applyPatch,
  setVfsFile,
  getVfsFile,
  hasVfsFile,
  listVfsFiles,
  deleteVfsFile,
  clearVfs,
  getClient: () => globalDriveClient,
};

export function getGlobalDriveClient(): GoogleDriveClient {
  return globalDriveClient;
}

export function useDriveStore() {
  const [state, setState] = useState<DriveState>({
    isAuthenticated: false,
    accessToken: null,
    expiresAt: null,
    isTokenExpired: false,
    isTokenExpiringSoon: false,
    userEmail: null,
    workspaceFolders: null,
    recentFiles: [],
    isLoading: false,
    error: null,
  });

  const setAccessToken = useCallback((token: string | null, email?: string, expiresInSeconds?: number) => {
    globalDriveClient.setToken(token, expiresInSeconds);
    setState((prev) => ({
      ...prev,
      isAuthenticated: Boolean(token),
      accessToken: token,
      expiresAt: globalDriveClient.getExpiresAt(),
      isTokenExpired: globalDriveClient.isTokenExpired(),
      isTokenExpiringSoon: globalDriveClient.isTokenExpiringSoon(),
      userEmail: email || (token ? 'användare@workspace.com' : null),
      error: null,
    }));
  }, []);

  const refreshSession = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const ok = await globalDriveClient.requestSilentRefresh();
      setState((prev) => ({
        ...prev,
        isAuthenticated: ok,
        accessToken: globalDriveClient.getToken(),
        expiresAt: globalDriveClient.getExpiresAt(),
        isTokenExpired: globalDriveClient.isTokenExpired(),
        isTokenExpiringSoon: globalDriveClient.isTokenExpiringSoon(),
        isLoading: false,
        error: ok ? null : 'Kunde inte förnya Google Drive-sessionen tyst',
      }));
      return ok;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setState((prev) => ({ ...prev, error: msg, isLoading: false }));
      return false;
    }
  }, []);

  const initWorkspace = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const folders = await globalDriveClient.ensureWorkspaceHierarchy('Outreach_Workspace');
      setState((prev) => ({
        ...prev,
        workspaceFolders: folders,
        isLoading: false,
      }));
      return folders;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setState((prev) => ({ ...prev, error: msg, isLoading: false }));
      throw err;
    }
  }, []);

  const refreshFiles = useCallback(async (folderId: string) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const files = await globalDriveClient.listFolderFiles(folderId);
      setState((prev) => ({ ...prev, recentFiles: files, isLoading: false }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setState((prev) => ({ ...prev, error: msg, isLoading: false }));
    }
  }, []);

  return {
    state,
    setAccessToken,
    refreshSession,
    initWorkspace,
    refreshFiles,
    client: globalDriveClient,
    applyPatch,
    vfs: driveStore,
  };
}
