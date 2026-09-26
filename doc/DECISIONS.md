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

## ADR-004: Decentraliserad Domänarkitektur och Lokal ADR-struktur (TCK-005)
- **Datum**: 2026-09-26
- **Status**: Beslutat & Implementerat
- **Kontext**: I takt med att systemet växer blir en monolitisk beslutskatalog oöverskådlig för agenter och utvecklare. Domänspecifika designbeslut hör hemma nära domänens källkod.
- **Beslut**: Etablera en tvåskiktad beslutshierarki. Övergripande systemarkitektur och principer dokumenteras i `doc/DECISIONS.md`. Domänspecifika arkitekturbeslut placeras lokalt i respektive FSD-moduls `doc/`-katalog: `src/features/[modul]/doc/DECISIONS.md`.
- **Konsekvens**: Tydlig modularitet, snabb lokal kontextinläsning (JIT) och direkt spårbarhet mellan modulär kod och arkitekturbeslut enligt AGENTS.md v10.0.

## ADR-005: Tvåfasig Exekvering och Token Gate Säkerhetsspärr (TCK-005)
- **Datum**: 2026-09-26
- **Status**: Beslutat & Implementerat
- **Kontext**: Autonoma agenter får inte göra okontrollerade mutationer av källkod under `src/features/` innan planering och syntes nått full mättnad och godkänts.
- **Beslut**: Tillämpa en strikt tvåfasig process (Fas 1: Planering & Syntes till Steg 3c, Fas 2: Verkställande och TDD) med en kryptografisk Token Gate. Redigering under `src/` är spärrad tills `pnpm genomfor [REQUIRED_TOKEN]` körs och godkännande loggas i `doc/LAST_CYCLE/APPROVAL.md`.
- **Konsekvens**: Förhindrar hallucinationer och oplanerade filändringar, säkerställer 100% spårbarhet och gör utvecklingscykeln deterministisk och säker.

