# Domänbeslut: Write-Ahead Logging (WAL) & Återhämtning

Detta dokument beskriver arkitekturbeslut specifika för domänen `wal_logger`.

---

## WAL-ADR-001: Append-Only Transaktionslogg med Hash-Kedjning
- **Datum**: 2026-09-23
- **Status**: Beslutat & Implementerat
- **Kontext**: Alla agentbeslut, verktygsanrop och dokumentändringar kräver oföränderlig spårbarhet och kraschåterhämtning vid nätverksavbrott eller omstart.
- **Beslut**:
  - Alla händelser skrivs i en append-only sekvens med SHA-256 hash-länkning till föregående post (`previousHash`).
  - Tvåfas-transaktionsmodell: `PENDING` -> `COMMITTED`.
  - `WalReplayer` identifierar icke-slutförda poster och återspelar dem deterministiskt.
- **Konsekvens**: Garanterad dataintegritet och noll risk för dolda datatapp vid applikationsavbrott.
