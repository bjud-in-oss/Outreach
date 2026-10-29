# Systembeslut & Arkitekturlogg (ADR)


## ADR-001: CloudEvents 1.0 som Enhetligt Händelsekuvert
- **Regel:** Alla händelser ska modelleras som `EventEnvelope` kompatibelt med CloudEvents 1.0 och valideras strikt med Zod.
- **Skäl:** Säkerställer interoperabilitet, deterministisk serialisering och förhindrar dataläckage.

## ADR-002: Reaktiv SwarmEventBus med Ringbuffert och Loose Coupling (TCK-002)
- **Regel:** Implementera en typsäker in-memory pub/sub-buss (`SwarmEventBus`) med wildcard-prenumeration och automatisk rensning via cleanup-callbacks. Buffra de senaste 150 händelserna i en F
- **Skäl:** Full observation i realtid utan prestandaförsämring eller re-render loops.

## ADR-003: Reaktivt Styrkort kopplat till TICKETS.md (MasterDevelopmentPlan)
- **Regel:** Skapa komponenten `MasterDevelopmentPlan` som återspeglar tickets och arkitekturkvitton från `doc/TICKETS.md` och `doc/LAST_CYCLE/VERIFY_RECEIPT.json`.
- **Skäl:** Ökad transparens mellan källkod, planeringsfas och körtid.

## ADR-004: Decentraliserad Domänarkitektur och Lokal ADR-struktur (TCK-005)
- **Regel:** Etablera en tvåskiktad beslutshierarki. Övergripande systemarkitektur och principer dokumenteras i `doc/DECISIONS.md`. Domänspecifika arkitekturbeslut placeras lokalt i respektive 
- **Skäl:** Tydlig modularitet, snabb lokal kontextinläsning (JIT) och direkt spårbarhet mellan modulär kod och arkitekturbeslut enl

## ADR-005: Tvåfasig Exekvering och Token Gate Säkerhetsspärr (TCK-005)
- **Regel:** Tillämpa en strikt tvåfasig process (Fas 1: Planering & Syntes till Steg 3c, Fas 2: Verkställande och TDD) med en kryptografisk Token Gate. Redigering under `src/` är spärrad tills
- **Skäl:** Förhindrar hallucinationer och oplanerade filändringar, säkerställer 100% spårbarhet och gör utvecklingscykeln determini

## ADR-006: Bidi Live WebSockets & Autonom Kodgenerering via save_code (TCK-TEST-001)
- **Regel:** - **Datum**: 2026-10-28 - **Status**: Beslutat & Implementerat
- **Skäl:** Noll compliance theater, ärlig felrapportering och bevisad autonom källkodsgenerering i körtid.

## ADR-007: Obruten TDD-livscykel med Mekaniska Grindar (Gherkin -> Ticket -> Autonomt Test i 3a)
- **Regel:** - **Datum**: 2026-10-28 - **Status**: Beslutat & Implementerat
- **Skäl:** Eliminerar semantiska glapp mellan planering och exekvering, garanterar äkta Fail-First i Gate 3a och säkrar obruten spå

## ADR-008: Isomorf intern AST-härdning över externa CLI-binärer
- **Regel:** Implementera kontroll 1–7 i kvalitetsmatrisen direkt via TypeScripts inbyggda Compiler API (ts.createSourceFile) i scripts/drivers/ts.js och scripts/verify-architecture.js utan ext
- **Skäl:** 0 nya beroenden i package.json, full isomorf portabilitet (Node.js och framtida webbläsar-VFS) och exekveringstid under 

## ADR-009: Interaktiv Trepunktsbesiktningsgrind för Systemunderhåll (TCK-MAINT)
- **Regel:** Spärra automatisk push för alla TCK-MAINT-körningar. Etablera en interaktiv besiktningsgrind i Fas 3 med trepunktsrapport (Möjlighet, Faronivå, Ångerrätt), interaktiv Bidi Live-frå
- **Skäl:** Mänsklig suveränitet bevaras, tankearbete tillvaratas utan risk för förhastade kodmutationer, och systemets grindar förb

## ADR-010: Deklarativ Testsvit och Isolering av Proceduriella Legacy-tester
- **Regel:** Konfigurera testreglerna deklarativt i vite.config.ts med explicit include (src/**/*.test.ts) och exclude (**/*.legacy.ts, **/transient_*). Döp om äldre procedurfiler till *.legacy
- **Skäl:** Sökvägsoberoende regressionssvit, eliminering av deprecation-varningar och fullständig stabilitet inför nya domänmoduler

## ADR-011: Autonom Git-synkronisering via .env Miljövariabler
- **Regel:** Läsa in GITHUB_USER och GITHUB_TOKEN direkt ur .env i scripts/run-planera-live.ts och pusha mot en dynamiskt autentiserad HTTPS-fjärradress. Säkra .gitignore mot läckage.
- **Skäl:** 100 % obrutna autonoma byggcykler i Crostini/Linux utan manuella lösenordsinmatningar.

## ADR-012: AST-baserad Resurskarta och Topografi (doc/FEATURE_INDEX.json)
- **Regel:** Skapa scripts/generate-feature-index.js baserat på TypeScripts AST-motor (ts.isExportDeclaration och modifier-flaggor) och integrera skriptet som ett obligatoriskt steg i pnpm veri
- **Skäl:** Deterministisk topografisk karta som möjliggör felfri JIT-orientering för agenter oavsett kodstil eller extern kodbasimp
