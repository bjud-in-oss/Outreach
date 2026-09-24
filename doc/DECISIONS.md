# Systembeslut & Arkitekturlogg (ADR)

## ADR-001: CloudEvents 1.0 som Enhetligt Händelsekuvert
- **Datum**: 2026-09-23
- **Status**: Beslutat & Implementerat
- **Kontext**: Systemet består av distribuerade och händelsestyrda komponenter (Gemini Swarm, Google Drive Sync, WAL Logger, MCP Bridge).
- **Beslut**: Alla händelser ska modelleras som `EventEnvelope` kompatibelt med CloudEvents 1.0 och valideras strikt med Zod.
- **Konsekvens**: Säkerställer interoperabilitet, deterministisk serialisering och förhindrar dataläckage.

## ADR-002: Reaktiv SwarmEventBus med Ringbuffert och Loose Coupling (TCK-002)
- **Datum**: 2026-09-23
- **Status**: Beslutat & Implementerat
- **Kontext**: Svärmens telemetri och tillståndsändringar behöver visualiseras i realtid utan att skapa hårdkoppling till UI-komponenter eller riskera minnesläckor.
- **Beslut**: Implementera en typsäker in-memory pub/sub-buss (`SwarmEventBus`) med wildcard-prenumeration och automatisk rensning via cleanup-callbacks. Buffra de senaste 150 händelserna i en FIFO-ringbuffert för telemetri- och felsökningshistorik.
- **Konsekvens**: Full observation i realtid utan prestandaförsämring eller re-render loops.

## ADR-003: Reaktivt Styrkort kopplat till TICKETS.md (MasterDevelopmentPlan)
- **Datum**: 2026-09-23
- **Status**: Beslutat & Implementerat
- **Kontext**: Operatören behöver se systemets aktuella och planerade mognadsgrad direkt i gränssnittet.
- **Beslut**: Skapa komponenten `MasterDevelopmentPlan` som återspeglar tickets och arkitekturkvitton från `doc/TICKETS.md` och `doc/LAST_CYCLE/VERIFY_RECEIPT.json`.
- **Konsekvens**: Ökad transparens mellan källkod, planeringsfas och körtid.
