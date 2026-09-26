# Arkitekturbeslut: Write-Ahead Logger (`wal_logger`)

Detta dokument samlar alla domänspecifika arkitekturbeslut för transaktionsloggning och kraschtålighet enligt ADR-004 och AGENTS.md v10.0.

---

## ADR-WAL-001: Append-Only SHA-256 Verifierad Händelselogg
- **Datum**: 2026-09-23
- **Status**: Beslutat & Implementerat
- **Kontext**: I ett distribuerat outreach-system med agenter och asynkrona integrationer måste alla tillståndsändringar kunna spåras och auditeras med garanti för oföränderlighet.
- **Beslut**: Logga samtliga händelser som strikta append-only poster (`WalEntry`) innehållande ett CloudEvents 1.0 `EventEnvelope`, ett sekvensnummer, tidsstämpel och en SHA-256-kontrollsumma baserad på föregående post och det aktuella kuvertet.
- **Konsekvens**: Full spårbarhet och manipulationssäker verifiering av händelsekedjan.

---

## ADR-WAL-002: Tvåfasig Commit-cykel (PENDING -> COMMITTED)
- **Datum**: 2026-09-23
- **Status**: Beslutat & Implementerat
- **Kontext**: Vid krascher, webbläsaromladdning eller nätverksfel under pågående kampanjkörning kan transaktioner lämnas i ett ovisst tillstånd mellan initiering och slutförd I/O.
- **Beslut**: Etablera en tvåfasig livscykel:
  1. Händelsen skrivs till loggen med status `PENDING` innan sidoeffekter (t.ex. Drive-skrivning eller agentanrop) genomförs.
  2. När sidoeffekten bekräftats markeras posten som `COMMITTED`.
  3. Vid omstart scannar `WalReplayer` efter opåbörjade eller icke-committade poster och möjliggör deterministisk återhämtning.
- **Konsekvens**: Noll databortfall och snabb kraschåterhämtning (< 3 sekunder).
