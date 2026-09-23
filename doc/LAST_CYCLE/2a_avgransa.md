# 2a Avgränsa: Skop, Begränsningar och Säkerhetsbarriärer

## 1. Fasavgränsning (Fas 1 vs Fas 2)
- **Fas 1 (Pågående - TCK-001)**:
  - Skapa master-skal, verifieringsskript (`scripts/verify-architecture.js`, `scripts/drivers/ts.js`), `doc/TICKETS.md`, `doc/FEATURE_INDEX.json` och grundkontrakt `src/shared/contracts/envelope.ts`.
  - Upprätta komplett planeringsunderlag (1a -> 3c) under `doc/LAST_CYCLE/`.
  - **Strikt regel**: Inga källkodsmoduler får genereras under `src/features/` i Fas 1.
  - Stanna vid Steg 3c och invänta Token Gate godkännande (`REQUIRED_TOKEN.txt`).
- **Fas 2 (TCK-002 & TCK-003)**:
  - Implementera `google_drive_sync`, `wal_logger`, `mcp_bridge`, `gemini_live_swarm`, `scripts/init-drive-workspace.js` och `README.md`.
  - Skriva isolerade TDD-enhetstester i `src/__tests__/` innan produktionskod driftsätts.

## 2. Säkerhets- och Arkitekturbarriärer
1. **Google Workspace Autentisering**:
   - Endast klientbaserad Firebase Auth / GoogleAuthProvider med access token sparad i minnet (`cachedAccessToken`).
   - Inga tokens i `localStorage` eller `sessionStorage`.
   - Inga serverbaserade OAuth redirect-flöden (på grund av efemära Cloud Run dev-miljöer).
2. **Fail Fast och Diagnostik**:
   - Alla anslutnings-, hårdvaru- och API-fel (t.ex. 401 Token expired, 403 Insufficient Scope, 429 Rate Limit) ska exponeras i klartext i diagnostikgränssnittet direkt utan dolda fallback-lägen.
3. **Dataintegritet och Destruktiva Operationer**:
   - Destruktiva operationer i Google Drive (radering eller överskrivning av befintliga filer) kräver explicit användarbekräftelse innan verkställande.
4. **Resiliens & WAL**:
   - Inga externa sidoeffekter får initieras utan ett föregående WAL-tillstånd (Write-Ahead). Vid krasch återskapas systemtillståndet genom sekventiell replay.
