# Domänbeslut: Google Drive Sync

Detta dokument beskriver arkitekturbeslut specifika för domänen `google_drive_sync`.

---

## DRIVE-ADR-001: Självläkande Mapphierarki & In-Memory Token
- **Datum**: 2026-09-23
- **Status**: Beslutat & Implementerat
- **Kontext**: Automatiserade outreach-filer och revisionsloggar måste organiseras säkert i användarens Google Drive utan att riskera obehörig åtkomst eller spara token i osäkra webbläsarlager.
- **Beslut**:
  - Etablera roten `/Outreach_Workspace/` med undermapparna `Campaigns/`, `Templates/`, `Logs/` och `Artifacts/`.
  - Hantera åtkomsttoken strikt in-memory i `useDriveStore` utan persistens i `localStorage` eller cookies.
  - Verifiera och återskapa saknade kataloger automatiskt vid initiering.
- **Konsekvens**: Hög säkerhet, motståndskraft mot borttagna mappar och fullt ägarskap i användarens eget Drive-konto.
