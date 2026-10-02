# Steg 2b: Modellera & Arkitekturdesign (TCK-019)

## 1. Token Lifeline & Tyst Förnyelse i `GoogleDriveClient`

```ts
export type TokenRefresher = (prompt?: string) => Promise<{ accessToken: string; expiresInSeconds?: number }>;

export class GoogleDriveClient {
  private accessToken: string | null = null;
  private expiresAt: number | null = null;
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private tokenRefresher: TokenRefresher | null = null;
  private eventBus: SwarmEventBus | null = null;

  public setToken(token: string | null, expiresInSeconds = 3599): void {
    this.accessToken = token;
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    if (token) {
      this.expiresAt = Date.now() + expiresInSeconds * 1000;
      this.scheduleTokenRefresh();
    } else {
      this.expiresAt = null;
    }
  }

  public scheduleTokenRefresh(): void {
    if (!this.expiresAt) return;
    const FIVE_MINUTES_MS = 5 * 60 * 1000;
    const delay = Math.max(0, this.expiresAt - Date.now() - FIVE_MINUTES_MS);
    this.refreshTimer = setTimeout(() => {
      this.requestSilentRefresh().catch(() => {});
    }, delay);
  }

  public async requestSilentRefresh(): Promise<boolean> {
    try {
      if (this.tokenRefresher) {
        const res = await this.tokenRefresher('');
        this.setToken(res.accessToken, res.expiresInSeconds || 3599);
        this.emitAuthRefreshed();
        return true;
      }
      if (typeof window !== 'undefined' && (window as any).google?.accounts?.oauth2) {
        // Kör GIS silent token request
        // Vid lyckat svar -> emitAuthRefreshed()
        return true;
      }
      throw new Error('GIS miljö ej tillgänglig');
    } catch (err) {
      this.accessToken = null;
      this.expiresAt = null;
      this.emitAuthExpired(err instanceof Error ? err.message : String(err));
      return false;
    }
  }

  public dispose(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
}
```

## 2. Reaktiv Händelsedistribution på `SwarmEventBus`

```ts
// DRIVE_AUTH_EXPIRED
createEnvelope({
  source: 'google_drive_sync',
  type: 'swarm.drive.auth.expired',
  data: {
    event: 'DRIVE_AUTH_EXPIRED',
    color: 'ERROR',
    activityText: 'Drive-behörighet utgången – klicka för återinloggning',
    force: 'ATT_FORLIKAS',
    timestamp: new Date().toISOString(),
  },
});

// DRIVE_AUTH_REFRESHED
createEnvelope({
  source: 'google_drive_sync',
  type: 'swarm.drive.auth.refreshed',
  data: {
    event: 'DRIVE_AUTH_REFRESHED',
    color: 'ACTIVE',
    activityText: 'Google Drive-session förnyad tyst',
    force: 'ATT_FORLIKAS',
    timestamp: new Date().toISOString(),
  },
});
```

## 3. UI-Integration i `SymbolCrown.tsx` och `crownStateHelper.ts`

- `CrownState` utökas med `isDriveAuthExpired?: boolean`.
- `resolveCrownFromEnvelope` läser av `rawEvent === 'DRIVE_AUTH_EXPIRED'` eller `envelope.type === 'swarm.drive.auth.expired'`.
- `SymbolCrown.tsx` visar en distinkt knapp vid utfällt läge: `[ ↺ Återanslut Google Drive ]` med ett enkelt klick som anropar `onDriveReauth`.
