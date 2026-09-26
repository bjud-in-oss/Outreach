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
