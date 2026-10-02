# Arkitekturbeslut: Google Drive Synk (`google_drive_sync`)

Detta dokument samlar alla domänspecifika arkitekturbeslut för lagring och synkronisering med Google Workspace enligt ADR-004 och AGENTS.md v10.0.

---

## ADR-DRIVE-001: In-Memory Token & Explicit Workspace Hierarchy
- **Datum**: 2026-09-23
- **Status**: Beslutat & Implementerat
- **Kontext**: Säkerhet och användarintegritet kräver att användarens Google Workspace-behörigheter inte exponeras eller sparas oskyddat på disk eller server. Samtidigt måste strukturen för kampanjmaterial vara enhetlig.
- **Beslut**: Hantera OAuth-access-tokens enbart i minnet (`driveStore`) och upprätta en explicit kataloghierarki (`/Outreach_Workspace/` med undermapparna `Kataloger`, `Kampanjer`, `Utkast`, `Arkiv`). Om ingen aktiv Google-autentisering finns, tillhandahåller modulen en robust in-memory virtuell filsystemsemulering med självläkning.
- **Konsekvens**: Noll risk för token-läckage och fullständig lokal funktion även vid utveckling eller utan molnanslutning.

---

## ADR-DRIVE-002: Zod-validerat Manifest (`WORKSPACE_MANIFEST.json`)
- **Datum**: 2026-09-23
- **Status**: Beslutat & Implementerat
- **Kontext**: För att säkerställa att synkroniserade mappar och filer i Google Drive överensstämmer med systemets förväntade tillstånd behövs ett verifierbart kontrakt.
- **Beslut**: Definiera ett strikt Zod-schema för arbetsytans manifest (`workspaceManifestSchema`), vilket validerar mapp-ID:n, synkstatus, senast uppdaterade tidsstämplar och behörighetsroller.
- **Konsekvens**: Säkerställer hög integritet, omedelbar detektering av externa ändringar och deterministisk synkronisering.

---

## ADR-DRIVE-003: Silent OAuth Refresh & Drive Token Lifeline (GIS)
- **Datum**: 2026-10-02
- **Status**: Beslutat & Implementerat (TCK-019)
- **Kontext**: Drive-sessioner under *Kom ihåg* och längre automatiseringskörningar riskerar avbrott när OAuth access tokens löper ut efter 60 minuter. Manuella popup-dialoger stör användarflödet och kan avbryta röstsessioner i Gemini Live.
- **Beslut**: Implementera `DriveTokenManager` som spårar `expiresAt` och schemalägger en automatisk, tyst förnyelse 5 minuter före utgång via Google Identity Services (`google.accounts.oauth2.requestAccessToken({ prompt: '' })`). Vid lyckad förnyelse publiceras `DRIVE_AUTH_REFRESHED` över `SwarmEventBus`. Vid behörighetsförlust eller nätverksfel publiceras `DRIVE_AUTH_EXPIRED`, vilket flaggas pedagogiskt i `SymbolCrown.tsx` med möjlighet till en enkel ett-klicks återinloggning utan krasch.
- **Konsekvens**: Oavbruten tillgång till Google Drive Workspace under långvariga sessioner och deterministisk återhämtning vid behörighetsfel.

