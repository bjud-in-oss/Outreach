# Arkitekturbeslut: Write-Ahead Logger (`wal_logger`)

Detta dokument samlar alla domänspecifika arkitekturbeslut för transaktionsloggning och kraschtålighet enligt ADR-004 och AGENTS.md v10.0.

---

## ADR-WAL-001: Append-Only SHA-256 Verifierad Händelselogg
- **Regel:** Logga samtliga händelser som strikta append-only poster (`WalEntry`) innehållande ett CloudEvents 1.0 `EventEnvelope`, ett sekvensnummer, tidsstämpel och en SHA-256-kontrollsumma baserad på föregående post och det aktuella kuvertet.
- **Skäl:** Säkrar modulär integritet och FSD-kontrakt.

## ADR-WAL-002: Tvåfasig Commit-cykel (PENDING -> COMMITTED)
- **Regel:** Etablera en tvåfasig livscykel:; Händelsen skrivs till loggen med status `PENDING` innan sidoeffekter (t.ex. Drive-skrivning eller agentanrop) genomförs.; När sidoeffekten bekräftats markeras posten som `COMMITTED`.;
- **Skäl:** Säkrar modulär integritet och FSD-kontrakt.
