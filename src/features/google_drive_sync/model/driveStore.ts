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
  };
}
