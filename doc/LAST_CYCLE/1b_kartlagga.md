# Steg 1b: Kartlägga & Komponentinventering (TCK-019)

## 1. Inventering av Filer att Skapa och Modifiera

### Filer att Modifiera
1. `src/features/google_drive_sync/api/driveClient.ts`:
   - Lägg till hantering av `expiresAt` (tidsstämpel i millisekunder) och `expiresInSeconds` i `setToken`.
   - Implementera `scheduleTokenRefresh()` som beräknar 5 minuter (300 000 ms) innan utgång.
   - Implementera `requestSilentRefresh()` med stöd för GIS (`google.accounts.oauth2.requestAccessToken({ prompt: '' })`) samt injicerbar `tokenRefresher` för deterministisk testning och SSR-säkerhet.
   - Koppla samman med `SwarmEventBus` (injektion eller global singleton) för publicering av `DRIVE_AUTH_EXPIRED` och `DRIVE_AUTH_REFRESHED`.
   - Tillhandahåll `dispose()` för ren rensning av aktiva timeouts.
2. `src/features/google_drive_sync/model/driveStore.ts`:
   - Exponera `isTokenExpired`, `isExpiringSoon` och `refreshSession()`.
   - Synkronisera reaktivt med `GoogleDriveClient`.
3. `src/features/gemini_live_swarm/ui/crownStateHelper.ts`:
   - Utöka händelseuppslagningen för att känna igen Drive-behörighetshändelser (`swarm.drive.auth.expired`, `swarm.drive.auth.refreshed`, `DRIVE_AUTH_EXPIRED`, `DRIVE_AUTH_REFRESHED`).
   - Sätt lämpliga symboler, färger (`ERROR` vid utgång, `ACTIVE` vid förnyelse) och pedagogisk aktivitetstext.
4. `src/features/gemini_live_swarm/ui/SymbolCrown.tsx`:
   - Rendera ett-klicks återinloggningsåtgärd vid `driveAuthExpired` i detaljpanelen utan att överskrida AST-gränser.
5. `src/features/google_drive_sync/doc/DECISIONS.md`:
   - Dokumentera ADR-DRIVE-003: Silent OAuth Refresh & Drive Token Lifeline via GIS.
6. `scripts/verify-architecture.js`:
   - Registrera godkännandekoden `TCK-019-SILENT-REFRESH-TOKEN`.

### Filer att Skapa
1. `src/__tests__/transient_TCK-019.test.ts`:
   - Mikro-E2E-test (< 3s i minnet) med multi-skiktsverifiering:
     * Exakt tidsberäkning av 5 minuters marginal innan utgång.
     * Tyst förnyelse med `prompt: ''` via GIS/refresher.
     * Korrekt utsändning av `DRIVE_AUTH_EXPIRED` och `DRIVE_AUTH_REFRESHED` på `SwarmEventBus`.
     * Visuell och funktionell återhämtning i `SymbolCrown` utan krasch.
     * AST- och strukturmått (max 125 rader, max djup 4, max 5 förgreningar).

---

## 2. Gränssnitts- och Kontraktsberoenden
- **CloudEvents / EventEnvelope**:
  ```ts
  createEnvelope({
    source: 'google_drive_sync',
    type: 'swarm.drive.auth.expired' | 'swarm.drive.auth.refreshed',
    data: {
      activityText: string,
      status: 'ERROR' | 'ACTIVE',
      expiresAt?: number,
    }
  });
  ```
- **GIS Token Lifeline**:
  - `prompt: ''` förhindrar interaktiva popups om sessionen är giltig.
  - Fail-Fast vid fel: Utsändning av `DRIVE_AUTH_EXPIRED` istället för tysta fel.
