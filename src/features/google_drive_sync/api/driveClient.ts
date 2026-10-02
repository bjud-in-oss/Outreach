import { DriveTokenManager, TokenRefresher } from './driveAuthLifeline.ts';
import { SwarmEventBus } from '../../gemini_live_swarm/bus/swarmEventBus.ts';

export type { TokenRefresher };
export { DriveTokenManager };

export interface DriveFileMetadata {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
  webViewLink?: string;
}

export interface DriveWorkspaceFolders {
  rootId: string;
  campaignsId: string;
  templatesId: string;
  logsId: string;
  artifactsId: string;
}

export interface UploadFileParams {
  name: string;
  folderId: string;
  mimeType?: string;
  content: string;
}

export class GoogleDriveClient {
  private tokenManager: DriveTokenManager;
  private workspaceSubfolders = ['Campaigns', 'Templates', 'Logs', 'Artifacts'];

  constructor(
    token?: string,
    expiresInSeconds?: number,
    eventBus?: SwarmEventBus,
    refresher?: TokenRefresher
  ) {
    this.tokenManager = new DriveTokenManager(token, expiresInSeconds, eventBus);
    if (refresher) {
      this.tokenManager.setTokenRefresher(refresher);
    }
  }

  public setToken(token: string | null, expiresInSeconds?: number): void {
    this.tokenManager.setToken(token, expiresInSeconds);
  }

  public getToken(): string | null {
    return this.tokenManager.getAccessToken();
  }

  public hasValidToken(): boolean {
    return this.tokenManager.hasValidToken();
  }

  public getExpiresAt(): number | null {
    return this.tokenManager.getExpiresAt();
  }

  public isTokenExpiringSoon(thresholdMs?: number): boolean {
    return this.tokenManager.isTokenExpiringSoon(thresholdMs);
  }

  public isTokenExpired(): boolean {
    return this.tokenManager.isTokenExpired();
  }

  public async requestSilentRefresh(): Promise<boolean> {
    return this.tokenManager.requestSilentRefresh();
  }

  public setTokenRefresher(refresher: TokenRefresher | null): void {
    this.tokenManager.setTokenRefresher(refresher);
  }

  public setEventBus(bus: SwarmEventBus | null): void {
    this.tokenManager.setEventBus(bus);
  }

  public dispose(): void {
    this.tokenManager.dispose();
  }

  public getWorkspaceSubfolders(): string[] {
    return [...this.workspaceSubfolders];
  }

  public resolveMimeType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const map: Record<string, string> = {
      json: 'application/json', md: 'text/plain', txt: 'text/plain',
      html: 'text/html', csv: 'text/csv', pdf: 'application/pdf',
    };
    return (ext && map[ext]) || 'application/octet-stream';
  }

  private getHeaders(): Record<string, string> {
    const token = this.tokenManager.getAccessToken();
    if (!token) {
      throw new Error('Google Drive autentisering krävs: Ingen aktiv access token i minnet');
    }
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  /**
   * Söker efter eller skapar en mapp under en förälder
   */
  public async ensureFolder(name: string, parentId?: string): Promise<string> {
    if (!this.hasValidToken()) {
      throw new Error('Google Drive autentisering krävs: Ingen aktiv access token i minnet');
    }

    try {
      let query = `mimeType = 'application/vnd.google-apps.folder' and name = '${name}' and trashed = false`;
      if (parentId) {
        query += ` and '${parentId}' in parents`;
      }

      const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`;
      const searchRes = await fetch(searchUrl, { headers: this.getHeaders() });
      if (!searchRes.ok) {
        throw new Error(`Drive sökfel (${searchRes.status}): ${await searchRes.text()}`);
      }
      const data = await searchRes.json();
      if (data.files && data.files.length > 0) {
        return data.files[0].id;
      }

      // Mappen finns inte, skapa den
      const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: { ...this.getHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, mimeType: 'application/vnd.google-apps.folder', parents: parentId ? [parentId] : undefined }),
      });

      if (!createRes.ok) {
        throw new Error(`Kunde inte skapa Drive-mapp (${createRes.status}): ${await createRes.text()}`);
      }
      const created = await createRes.json();
      return created.id;
    } catch (err) {
      throw new Error(`Google Drive Workspace fel: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * Initierar hela workspace-strukturen: Outreach_Workspace + subfolders
   */
  public async ensureWorkspaceHierarchy(rootName = 'Outreach_Workspace'): Promise<DriveWorkspaceFolders> {
    const rootId = await this.ensureFolder(rootName);
    const campaignsId = await this.ensureFolder('Campaigns', rootId);
    const templatesId = await this.ensureFolder('Templates', rootId);
    const logsId = await this.ensureFolder('Logs', rootId);
    const artifactsId = await this.ensureFolder('Artifacts', rootId);

    return {
      rootId,
      campaignsId,
      templatesId,
      logsId,
      artifactsId,
    };
  }

  /**
   * Laddar upp fil via multipart/related till angiven mapp
   */
  public async uploadFileMultipart(params: UploadFileParams): Promise<DriveFileMetadata> {
    const mimeType = params.mimeType || this.resolveMimeType(params.name);

    if (!this.hasValidToken()) {
      throw new Error('Google Drive autentisering krävs: Ingen aktiv access token i minnet');
    }

    const metadata = {
      name: params.name,
      parents: [params.folderId],
      mimeType,
    };

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${mimeType}\r\n\r\n` +
      params.content +
      closeDelimiter;

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        ...this.getHeaders(),
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    });

    if (!res.ok) {
      throw new Error(`Filuppladdningsfel (${res.status}): ${await res.text()}`);
    }

    return await res.json();
  }

  /**
   * Listar filer inom en mapp
   */
  public async listFolderFiles(folderId: string): Promise<DriveFileMetadata[]> {
    if (!this.hasValidToken()) {
      throw new Error('Google Drive autentisering krävs: Ingen aktiv access token i minnet');
    }

    const query = `'${folderId}' in parents and trashed = false`;
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,size,modifiedTime,webViewLink)`,
      { headers: this.getHeaders() }
    );

    if (!res.ok) {
      throw new Error(`Kunde inte lista filer (${res.status}): ${await res.text()}`);
    }

    const data = await res.json();
    return data.files || [];
  }
}
