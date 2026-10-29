# Systembeslut & Arkitekturlogg (ADR)

## ADR-001: CloudEvents 1.0 som Enhetligt Händelsekuvert
- **Regel:** Alla händelser ska modelleras som `EventEnvelope` kompatibelt med CloudEvents 1.0 och valideras strikt med
- **Skäl:** Säkrar modulär integritet och FSD-kontrakt.

## ADR-002: Reaktiv SwarmEventBus med Ringbuffert och Loose Coupling (TCK-002)
- **Regel:** Implementera en typsäker in-memory pub/sub-buss (`SwarmEventBus`) med wildcard-prenumeration och automatisk rensning via cleanup-callbacks. Buffra de senaste 150 händelserna i en FIFO-ringbuffert för telemetri- och felsökningshistorik.
- **Skäl:** Säkrar modulär integritet och FSD-kontrakt.

## ADR-003: Reaktivt Styrkort kopplat till TICKETS.md (MasterDevelopmentPlan)
- **Regel:** Skapa komponenten `MasterDevelopmentPlan` som återspeglar tickets och arkitekturkvitton från `doc/TICKETS.md` och `doc/LAST_CYCLE/VERIFY_RECEIPT.json`.
- **Skäl:** Säkrar modulär integritet och FSD-kontrakt.

## ADR-004: Decentraliserad Domänarkitektur och Lokal ADR-struktur (TCK-005)
- **Regel:** Etablera en tvåskiktad beslutshierarki. Övergripande systemarkitektur och principer dokumenteras i `doc/DECISIONS.md`. Domänspecifika arkitekturbeslut placeras lokalt i respektive FSD-moduls `doc/`-katalog: `src/features/[modul]/doc/DECISIONS.md`.
- **Skäl:** Säkrar modulär integritet och FSD-kontrakt.

## ADR-005: Tvåfasig Exekvering och Token Gate Säkerhetsspärr (TCK-005)
- **Regel:** Tillämpa en strikt tvåfasig process (Fas 1: Planering & Syntes till Steg 3c, Fas 2: Verkställande och TDD) med en kryptografisk Token Gate. Redigering under `src/` är spärrad tills `pnpm genomfor [REQUIRED_TOKEN]` körs och godkännande loggas i...
- **Skäl:** Säkrar modulär integritet och FSD-kontrakt.

## ADR-006: Bidi Live WebSockets & Autonom Kodgenerering via save_code (TCK-TEST-001)
- **Regel:** All kod- och testgenerering i Fas 1 och Fas 2 sker uteslutande över Gemini Live WebSockets via verktyget save_code med behavior:...; gemini-3.8-live etableras som operativ standardmotor för deterministisk källkodsgenerering.;
- **Skäl:** Säkrar modulär integritet och FSD-kontrakt.

## ADR-007: Obruten TDD-livscykel med Mekaniska Grindar (Gherkin -> Ticket -> Autonomt Test i 3a)
- **Regel:** Mänsklig nytta förankras alltid i Gherkin-scenarier (doc/features/*.feature).; Biljetter (doc/.TICKETS/TCK-XXX.md) måste innehålla ett formellt typat kodblock med det invarianta ytterkontraktet.;
- **Skäl:** Säkrar modulär integritet och FSD-kontrakt.

## ADR-008: Isomorf intern AST-härdning över externa CLI-binärer
- **Regel:** Implementera kontroll 1–7 i kvalitetsmatrisen direkt via TypeScripts inbyggda Compiler API (ts.createSourceFile) i scripts/drivers/ts.js och scripts/verify-architecture.js utan externa paket.
- **Skäl:** Säkrar modulär integritet och FSD-kontrakt.

## ADR-009: Interaktiv Trepunktsbesiktningsgrind för Systemunderhåll (TCK-MAINT)
- **Regel:** Spärra automatisk push för alla TCK-MAINT-körningar. Etablera en interaktiv besiktningsgrind i Fas 3 med trepunktsrapport (Möjlighet, Faronivå, Ångerrätt), interaktiv Bidi Live-frågedialog i CLI och ett s-val (Spara specifikation till doc/.
- **Skäl:** Säkrar modulär integritet och FSD-kontrakt.

## ADR-010: Deklarativ Testsvit och Isolering av Proceduriella Legacy-tester
- **Regel:** Konfigurera testreglerna deklarativt i vite.config.ts med explicit include (src/**/*.test.ts) och exclude (**/*.legacy.ts, **/transient_*). Döp om äldre procedurfiler till *.legacy.ts och rensa scripts/run-tests.js till ett agnostiskt vitest run-anrop.
- **Skäl:** Säkrar modulär integritet och FSD-kontrakt.

## ADR-011: Autonom Git-synkronisering via .env Miljövariabler
- **Regel:** Läsa in GITHUB_USER och GITHUB_TOKEN direkt ur .env i scripts/run-planera-live.ts och pusha mot en dynamiskt autentiserad HTTPS-fjärradress. Säkra .gitignore mot läckage.
- **Skäl:** Säkrar modulär integritet och FSD-kontrakt.

## ADR-012: AST-baserad Resurskarta och Topografi (doc/FEATURE_INDEX.json)
- **Regel:** Skapa scripts/generate-feature-index.js baserat på TypeScripts AST-motor (ts.isExportDeclaration och modifier-flaggor) och integrera skriptet som ett obligatoriskt steg i pnpm verify.
- **Skäl:** Säkrar modulär integritet och FSD-kontrakt.
