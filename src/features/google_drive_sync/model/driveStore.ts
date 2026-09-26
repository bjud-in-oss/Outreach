import { useState, useCallback, useEffect } from 'react';
import { GoogleDriveClient, DriveFileMetadata, DriveWorkspaceFolders } from '../api/driveClient.ts';

export interface DriveState {
  isAuthenticated: boolean;
  accessToken: string | null;
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
    userEmail: null,
    workspaceFolders: null,
    recentFiles: [],
    isLoading: false,
    error: null,
  });

  const setAccessToken = useCallback((token: string | null, email?: string) => {
    globalDriveClient.setToken(token);
    setState((prev) => ({
      ...prev,
      isAuthenticated: Boolean(token),
      accessToken: token,
      userEmail: email || (token ? 'användare@workspace.com' : null),
      error: null,
    }));
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
    initWorkspace,
    refreshFiles,
    client: globalDriveClient,
  };
}
