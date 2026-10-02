# 3c Fil-operativ Källkodsspecifikation (TCK-019)

## 1. Förändringskedja för Fas 2 (pnpm genomfor)

Följande filer är specificerade för källkodsändring under Fas 2 efter bekräftelse av godkännandekoden (`TCK-019-SILENT-REFRESH-TOKEN`):

### 1. `src/features/google_drive_sync/api/driveClient.ts`
- **Tillägg**:
  - `expiresAt: number | null` (ms).
  - `refreshTimer: ReturnType<typeof setTimeout> | null`.
  - `tokenRefresher: TokenRefresher | null`.
  - `eventBus: SwarmEventBus | null`.
  - `setToken(token: string | null, expiresInSeconds = 3599): void`
    * Sätter `expiresAt = Date.now() + expiresInSeconds * 1000`.
    * Rensar aktiv timer.
    * Anropar `scheduleTokenRefresh()`.
  - `scheduleTokenRefresh(): void`
    * Beräknar marginal (5 min / 300 000 ms före `expiresAt`).
    * Sätter timer för `requestSilentRefresh()`.
  - `requestSilentRefresh(): Promise<boolean>`
    * Utför tyst förnyelse via `tokenRefresher` eller `window.google.accounts.oauth2.requestAccessToken({ prompt: '' })`.
    * Publicerar `DRIVE_AUTH_REFRESHED` vid lyckat resultat.
    * Publicerar `DRIVE_AUTH_EXPIRED` vid misslyckat resultat och nollställer token.
  - `isTokenExpiringSoon(thresholdMs = 300000): boolean`
  - `isTokenExpired(): boolean`
  - `dispose(): void` (rensar aktiv timer).

### 2. `src/features/google_drive_sync/model/driveStore.ts`
- **Tillägg**:
  - Exponera `isTokenExpired`, `expiresAt` och `refreshSession` i `useDriveStore()`.

### 3. `src/features/gemini_live_swarm/ui/crownStateHelper.ts`
- **Tillägg**:
  - Hantera händelser `swarm.drive.auth.expired`, `DRIVE_AUTH_EXPIRED`, `swarm.drive.auth.refreshed`, `DRIVE_AUTH_REFRESHED`.
  - Flagga `isDriveAuthExpired: true` och texten *"Drive-behörighet utgången – klicka för återinloggning"*.
  - Återställa `isDriveAuthExpired: false` vid förnyad session.

### 4. `src/features/gemini_live_swarm/ui/SymbolCrown.tsx`
- **Tillägg**:
  - `onDriveReauth?: () => void` i `SymbolCrownProps`.
  - Klickbar knapp `[ ↺ Återanslut Google Drive ]` i utfälld detaljpanel när `state.isDriveAuthExpired` är sann.
  - Säkerställ att AST-begränsningarna (max 125 rader, max djup 4, max 5 förgreningar) hålls intakta.

### 5. `src/features/google_drive_sync/doc/DECISIONS.md`
- **Tillägg**:
  - Dokumentera **ADR-DRIVE-003: Silent OAuth Refresh & Drive Token Lifeline**.

### 6. `src/__tests__/transient_TCK-019.test.ts`
- **Skapande**:
  - Test 1: Exakt beräkning av token-utgång och 5-minuters marginal.
  - Test 2: Tyst förnyelseanrop med `prompt: ''` och publicering av `DRIVE_AUTH_REFRESHED`.
  - Test 3: Publicering av `DRIVE_AUTH_EXPIRED` vid förnyelsefel.
  - Test 4: Visning och ett-klicksåtgärd i `SymbolCrown` utan krasch.
  - Test 5: AST- och strukturmått.

### 7. `scripts/verify-architecture.js`
- **Tillägg**:
  - Registrera `TCK-019-SILENT-REFRESH-TOKEN` i `validTokens`.

### 8. `scripts/run-tests.js` & `src/__tests__/suite/e2e_regression.test.ts`
- **Tillägg**:
  - Registrera transient testsvit för TCK-019.

---

## 2. Token Gate
- Godkännandekod: `TCK-019-SILENT-REFRESH-TOKEN` i `doc/LAST_CYCLE/REQUIRED_TOKEN.txt`.
