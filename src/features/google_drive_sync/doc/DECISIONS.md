# Arkitekturbeslut: Google Drive Synk (`google_drive_sync`)

Detta dokument samlar alla domänspecifika arkitekturbeslut för lagring och synkronisering med Google Workspace enligt ADR-004 och AGENTS.md v10.0.

---

## ADR-DRIVE-001: In-Memory Token & Explicit Workspace Hierarchy
- **Regel:** Hantera OAuth-access-tokens enbart i minnet (`driveStore`) och upprätta en explicit kataloghierarki (`/Outreach_Workspace/` med undermapparna `Kataloger`, `Kampanjer`, `Utkast`, `Arkiv`). Om ingen aktiv Google-autentisering finns,
- **Skäl:** Noll risk för token-läckage och fullständig lokal funktion även vid utveckling eller utan molnanslutning.

## ADR-DRIVE-002: Zod-validerat Manifest (`WORKSPACE_MANIFEST.json`)
- **Regel:** Definiera ett strikt Zod-schema för arbetsytans manifest (`workspaceManifestSchema`), vilket validerar mapp-ID:n, synkstatus, senast uppdaterade tidsstämplar och behörighetsroller.
- **Skäl:** Säkerställer hög integritet, omedelbar detektering av externa ändringar och deterministisk synkronisering.

## ADR-DRIVE-003: Silent OAuth Refresh & Drive Token Lifeline (GIS)
- **Regel:** Implementera `DriveTokenManager` som spårar `expiresAt` och schemalägger en automatisk, tyst förnyelse 5 minuter före utgång via Google Identity Services (`google.accounts.oauth2.requestAccessToken({ prompt: '' })`).
- **Skäl:** Oavbruten tillgång till Google Drive Workspace under långvariga sessioner och deterministisk återhämtning vid behörighetsfel.

## ADR-DRIVE-004: Kirurgisk O(N) VFS Code Patch Engine & Unikhetsskydd
- **Regel:** 1. **Kirurgisk O(N) Search/Replace**: Implementera `applyPatch` i `driveStore.ts` via `indexOf`-sökning och strängsegmentering.; **LF-normalisering som Fallback**: Om exakt sökning inte ger träff utförs normalisering av radbrytningar (`\r\n` -> `\n`) samt...
- **Skäl:** Deterministiska, kirurgiska kodändringar i VFS Staging med fullständigt skydd mot dubblettförvanskning.
