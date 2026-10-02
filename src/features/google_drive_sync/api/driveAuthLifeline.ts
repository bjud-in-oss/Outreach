import { SwarmEventBus, getGlobalSwarmEventBus } from '../../gemini_live_swarm/bus/swarmEventBus.ts';

export type TokenRefresher = (prompt?: string) => Promise<{
  accessToken: string;
  expiresInSeconds?: number;
}>;

function handleGisCallback(
  manager: DriveTokenManager,
  resp: { access_token?: string; expires_in?: number; error?: string },
  resolve: (ok: boolean) => void
): void {
  if (resp && resp.access_token) {
    manager.setToken(resp.access_token, Number(resp.expires_in) || 3599);
    manager.emitAuthRefreshed();
    resolve(true);
    return;
  }
  manager.handleExpired(new Error(resp?.error || 'Silent refresh denied'));
  resolve(false);
}

function handleGisError(
  manager: DriveTokenManager,
  err: { message?: string },
  resolve: (ok: boolean) => void
): void {
  manager.handleExpired(new Error(err?.message || 'GIS error'));
  resolve(false);
}

export class DriveTokenManager {
  private accessToken: string | null = null;
  private expiresAt: number | null = null;
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private refresher: TokenRefresher | null = null;
  private eventBus: SwarmEventBus | null = null;

  constructor(token?: string | null, expiresInSeconds?: number, eventBus?: SwarmEventBus) {
    if (eventBus) {
      this.eventBus = eventBus;
    }
    if (token) {
      this.setToken(token, expiresInSeconds);
    }
  }

  public setToken(token: string | null, expiresInSeconds = 3599): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    this.accessToken = token;
    if (!token) {
      this.expiresAt = null;
      return;
    }
    const safeSeconds = expiresInSeconds > 0 ? expiresInSeconds : 3599;
    this.expiresAt = Date.now() + safeSeconds * 1000;
    this.scheduleRefresh();
  }

  public getAccessToken(): string | null {
    return this.accessToken;
  }

  public getExpiresAt(): number | null {
    return this.expiresAt;
  }

  public hasValidToken(): boolean {
    const hasToken = Boolean(this.accessToken && this.accessToken.trim().length > 0);
    if (!hasToken) return false;
    if (!this.expiresAt) return true;
    return Date.now() < this.expiresAt;
  }

  public isTokenExpiringSoon(thresholdMs = 5 * 60 * 1000): boolean {
    if (!this.accessToken) return true;
    if (!this.expiresAt) return false;
    return (this.expiresAt - Date.now()) <= thresholdMs;
  }

  public isTokenExpired(): boolean {
    if (!this.accessToken) return true;
    if (!this.expiresAt) return false;
    return Date.now() >= this.expiresAt;
  }

  public setTokenRefresher(refresher: TokenRefresher | null): void {
    this.refresher = refresher;
  }

  public setEventBus(bus: SwarmEventBus | null): void {
    this.eventBus = bus;
  }

  public scheduleRefresh(): void {
    if (!this.expiresAt || !this.accessToken) return;
    const FIVE_MINUTES_MS = 5 * 60 * 1000;
    const msUntilRefresh = this.expiresAt - Date.now() - FIVE_MINUTES_MS;
    const delay = Math.max(0, msUntilRefresh);
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
    this.refreshTimer = setTimeout(() => {
      this.requestSilentRefresh().catch(() => {});
    }, delay);
    if (typeof (this.refreshTimer as any)?.unref === 'function') {
      (this.refreshTimer as any).unref();
    }
  }

  private requestGisSilentToken(): Promise<boolean> {
    const win = window as unknown as {
      google: { accounts: { oauth2: { initTokenClient: Function } } };
      __GOOGLE_CLIENT_ID__?: string;
    };
    return new Promise<boolean>((resolve) => {
      const client = win.google.accounts.oauth2.initTokenClient({
        client_id: win.__GOOGLE_CLIENT_ID__ || '',
        scope: 'https://www.googleapis.com/auth/drive.file',
        prompt: '',
        callback: (resp: any) => handleGisCallback(this, resp, resolve),
        error_callback: (err: any) => handleGisError(this, err, resolve),
      });
      client.requestAccessToken({ prompt: '' });
    });
  }

  public async requestSilentRefresh(): Promise<boolean> {
    try {
      if (this.refresher) {
        const res = await this.refresher('');
        this.setToken(res.accessToken, res.expiresInSeconds || 3599);
        this.emitAuthRefreshed();
        return true;
      }
      const hasGis = typeof window !== 'undefined' &&
        Boolean((window as unknown as { google?: { accounts?: { oauth2?: unknown } } }).google?.accounts?.oauth2);
      if (hasGis) {
        return await this.requestGisSilentToken();
      }
      throw new Error('Ingen TokenRefresher eller GIS aktiv i miljön');
    } catch (err) {
      this.handleExpired(err);
      return false;
    }
  }

  public handleExpired(err: unknown): void {
    this.accessToken = null;
    this.expiresAt = null;
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    const msg = err instanceof Error ? err.message : String(err);
    this.emitAuthExpired(msg);
  }

  public emitAuthRefreshed(): void {
    const bus = this.eventBus || (typeof getGlobalSwarmEventBus === 'function' ? getGlobalSwarmEventBus() : null);
    if (!bus) return;
    const now = new Date().toISOString();
    bus.publish({
      id: `drive-refreshed-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      source: 'outreach/drive-sync',
      type: 'swarm.drive.auth.refreshed',
      specversion: '1.0',
      datacontenttype: 'application/json',
      time: now,
      data: {
        event: 'DRIVE_AUTH_REFRESHED',
        status: 'ACTIVE',
        color: 'ACTIVE',
        activityText: 'Google Drive-session förnyad tyst',
        expiresAt: this.expiresAt,
        timestamp: now,
      },
    });
  }

  private emitAuthExpired(reason: string): void {
    const bus = this.eventBus || (typeof getGlobalSwarmEventBus === 'function' ? getGlobalSwarmEventBus() : null);
    if (!bus) return;
    const now = new Date().toISOString();
    bus.publish({
      id: `drive-expired-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      source: 'outreach/drive-sync',
      type: 'swarm.drive.auth.expired',
      specversion: '1.0',
      datacontenttype: 'application/json',
      time: now,
      data: {
        event: 'DRIVE_AUTH_EXPIRED',
        status: 'ERROR',
        color: 'ERROR',
        activityText: 'Drive-behörighet utgången – klicka för återinloggning',
        error: reason,
        timestamp: now,
      },
    });
  }

  public dispose(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
}
