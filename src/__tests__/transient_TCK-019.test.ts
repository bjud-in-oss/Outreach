import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { checkAstMetrics } from '../../scripts/drivers/ts.js';
import { SwarmEventBus } from '../features/gemini_live_swarm/bus/swarmEventBus.ts';
import { GoogleDriveClient, DriveTokenManager } from '../features/google_drive_sync/index.ts';
import {
  SymbolCrown,
  STATUS_LED_CLASSES,
} from '../features/gemini_live_swarm/ui/SymbolCrown.tsx';
import {
  resolveCrownFromEnvelope,
  CrownState,
  getReauthClass,
} from '../features/gemini_live_swarm/ui/crownStateHelper.ts';

export async function runTransientTCK019Tests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];
  const rootDir = process.cwd();

  function assert(condition: boolean, msg: string) {
    if (!condition) throw new Error(msg);
  }

  // Test 1: Beräkning av token-utgång och tidsmarginaler (5 minuter)
  try {
    const bus = new SwarmEventBus();
    const client = new GoogleDriveClient('init-token-abc', 3600, bus);

    assert(client.hasValidToken(), 'Client borde ha giltig token');
    const expiresAt = client.getExpiresAt();
    assert(Boolean(expiresAt && expiresAt > Date.now() + 3500 * 1000), 'expiresAt ska beräknas ~3600 sekunder framåt');
    assert(!client.isTokenExpired(), 'Token ska inte vara utgången initialt');
    assert(!client.isTokenExpiringSoon(300 * 1000), 'Token med 3600s kvar ska inte flaggas som expiring soon');

    // Sätt token med kort livslängd (< 300s)
    client.setToken('short-lived-token', 180);
    assert(client.isTokenExpiringSoon(300 * 1000), 'Token med 180s ska flaggas som expiring soon vid 5 minuters marginal');

    // Nollställ token
    client.setToken(null);
    assert(!client.hasValidToken(), 'TokenManager med null ska inte vara giltig');
    assert(client.getExpiresAt() === null, 'expiresAt ska vara null efter rensning');
    client.dispose();

    results.push({
      name: 'TCK-019: Exakt beräkning av token-utgång och 5-minuters marginal i GoogleDriveClient',
      passed: true,
    });
  } catch (err) {
    results.push({
      name: 'TCK-019: Exakt beräkning av token-utgång och 5-minuters marginal i GoogleDriveClient',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Test 2: Tyst Token-Förnyelse & DRIVE_AUTH_REFRESHED på SwarmEventBus
  try {
    const bus = new SwarmEventBus();
    const refreshedEvents: any[] = [];
    bus.subscribe('swarm.drive.auth.*', (env) => {
      refreshedEvents.push(env);
    });

    let refreshCalledWithPrompt: string | undefined;
    const mockRefresher = async (prompt?: string) => {
      refreshCalledWithPrompt = prompt;
      return {
        accessToken: 'brand-new-refreshed-token-999',
        expiresInSeconds: 3600,
      };
    };

    const client = new GoogleDriveClient('old-token', 100, bus, mockRefresher);
    const success = await client.requestSilentRefresh();

    assert(success === true, 'requestSilentRefresh ska lyckas med giltig refresher');
    assert(refreshCalledWithPrompt === '', 'requestSilentRefresh ska anropa refresher med prompt=""');
    assert(client.getToken() === 'brand-new-refreshed-token-999', 'Ny access token ska vara sparad');
    assert(client.hasValidToken(), 'Ny token ska vara giltig');

    assert(refreshedEvents.length === 1, 'Ett händelsekuvert ska ha publicerats på SwarmEventBus');
    const evt = refreshedEvents[0];
    assert(evt.type === 'swarm.drive.auth.refreshed', 'Händelsetyp ska vara swarm.drive.auth.refreshed');
    assert(evt.data.event === 'DRIVE_AUTH_REFRESHED', 'Data event ska vara DRIVE_AUTH_REFRESHED');
    assert(evt.data.status === 'ACTIVE', 'Data status ska vara ACTIVE');
    client.dispose();

    results.push({
      name: 'TCK-019: Tyst token-förnyelse med prompt="" och utsändning av DRIVE_AUTH_REFRESHED',
      passed: true,
    });
  } catch (err) {
    results.push({
      name: 'TCK-019: Tyst token-förnyelse med prompt="" och utsändning av DRIVE_AUTH_REFRESHED',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Test 3: Behörighetsförlust & Publicering av DRIVE_AUTH_EXPIRED vid fel
  try {
    const bus = new SwarmEventBus();
    const expiredEvents: any[] = [];
    bus.subscribe('swarm.drive.auth.expired', (env) => {
      expiredEvents.push(env);
    });

    const failingRefresher = async () => {
      throw new Error('Google OAuth token revoked');
    };

    const client = new GoogleDriveClient('token-about-to-die', 60, bus, failingRefresher);
    const success = await client.requestSilentRefresh();

    assert(success === false, 'requestSilentRefresh ska returnera false vid fel');
    assert(!client.hasValidToken(), 'Token ska nollställas vid misslyckad förnyelse');
    assert(client.getToken() === null, 'Token ska vara null');
    assert(expiredEvents.length === 1, 'DRIVE_AUTH_EXPIRED ska ha publicerats på SwarmEventBus');
    assert(expiredEvents[0].data.event === 'DRIVE_AUTH_EXPIRED', 'Händelse ska vara DRIVE_AUTH_EXPIRED');
    assert(expiredEvents[0].data.status === 'ERROR', 'Status ska vara ERROR');
    assert(expiredEvents[0].data.error.includes('revoked'), 'Felmeddelande ska inkluderas i payload');
    client.dispose();

    results.push({
      name: 'TCK-019: Hantering av behörighetsfel och utsändning av DRIVE_AUTH_EXPIRED',
      passed: true,
    });
  } catch (err) {
    results.push({
      name: 'TCK-019: Hantering av behörighetsfel och utsändning av DRIVE_AUTH_EXPIRED',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Test 4: Reaktiv UI-Återhämtning i SymbolCrown & crownStateHelper
  try {
    const initialCrown: CrownState = {
      symbol: '⇑',
      color: 'ACTIVE',
      activityText: 'Redo för samordning',
      isDriveAuthExpired: false,
    };

    // 1. Simulera ankomst av DRIVE_AUTH_EXPIRED
    const expiredEnvelope = {
      id: 'evt-test-exp-1',
      source: 'google_drive_sync',
      type: 'swarm.drive.auth.expired',
      specversion: '1.0' as const,
      datacontenttype: 'application/json',
      time: new Date().toISOString(),
      data: {
        event: 'DRIVE_AUTH_EXPIRED',
        color: 'ERROR',
        status: 'ERROR',
        activityText: 'Drive-behörighet utgången – klicka för återinloggning',
      },
    };

    const updatedAfterError = resolveCrownFromEnvelope(expiredEnvelope, initialCrown);
    assert(updatedAfterError.color === 'ERROR', 'Kronan ska visa ERROR vid DRIVE_AUTH_EXPIRED');
    assert(updatedAfterError.isDriveAuthExpired === true, 'isDriveAuthExpired ska vara true');
    assert(getReauthClass(updatedAfterError.isDriveAuthExpired) === 'inline-flex', 'Återinloggningsknapp ska vara synlig');

    // 2. Simulera ankomst av DRIVE_AUTH_REFRESHED
    const refreshedEnvelope = {
      id: 'evt-test-ref-2',
      source: 'google_drive_sync',
      type: 'swarm.drive.auth.refreshed',
      specversion: '1.0' as const,
      datacontenttype: 'application/json',
      time: new Date().toISOString(),
      data: {
        event: 'DRIVE_AUTH_REFRESHED',
        color: 'ACTIVE',
        status: 'ACTIVE',
        activityText: 'Google Drive-session förnyad tyst',
      },
    };

    const recovered = resolveCrownFromEnvelope(refreshedEnvelope, updatedAfterError);
    assert(recovered.color === 'ACTIVE', 'Kronan ska återgå till ACTIVE vid förnyelse');
    assert(recovered.isDriveAuthExpired === false, 'isDriveAuthExpired ska återställas till false');
    assert(getReauthClass(recovered.isDriveAuthExpired) === 'hidden', 'Återinloggningsknapp ska döljas');

    // 3. Validera rendering av SymbolCrown med onDriveReauth
    let reauthTriggered = false;
    const crownEl = React.createElement(SymbolCrown, {
      initialState: updatedAfterError,
      defaultExpanded: true,
      onDriveReauth: () => {
        reauthTriggered = true;
      },
    });
    assert(React.isValidElement(crownEl), 'SymbolCrown måste rendera giltigt React-element med reauth');

    results.push({
      name: 'TCK-019: Reaktiv flaggning i SymbolCrown, reauth-knapp och återhämtning utan krasch',
      passed: true,
    });
  } catch (err) {
    results.push({
      name: 'TCK-019: Reaktiv flaggning i SymbolCrown, reauth-knapp och återhämtning utan krasch',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Test 5: AST- och Strukturmått för berörda filer
  try {
    const targets = [
      path.join(rootDir, 'src', 'features', 'google_drive_sync', 'api', 'driveAuthLifeline.ts'),
      path.join(rootDir, 'src', 'features', 'google_drive_sync', 'api', 'driveClient.ts'),
      path.join(rootDir, 'src', 'features', 'google_drive_sync', 'model', 'driveStore.ts'),
      path.join(rootDir, 'src', 'features', 'gemini_live_swarm', 'ui', 'crownStateHelper.ts'),
      path.join(rootDir, 'src', 'features', 'gemini_live_swarm', 'ui', 'SymbolCrown.tsx'),
    ];

    for (const target of targets) {
      assert(fs.existsSync(target), `Filen saknas: ${target}`);
      const content = fs.readFileSync(target, 'utf8');
      const rel = path.relative(rootDir, target);
      const metrics = checkAstMetrics(rel, content);
      assert(metrics.valid, `AST-överträdelse i ${rel}: ${metrics.error}`);
    }

    results.push({
      name: 'TCK-019: AST- och strukturmått (max rader, djup <= 4, förgreningar <= 5 i TSX)',
      passed: true,
    });
  } catch (err) {
    results.push({
      name: 'TCK-019: AST- och strukturmått (max rader, djup <= 4, förgreningar <= 5 i TSX)',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return results;
}
