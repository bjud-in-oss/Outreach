# Systembeslut & Arkitekturlogg (ADR)

## ADR-001: CloudEvents 1.0 som Enhetligt Händelsekuvert
- **Regel:** Alla händelser ska modelleras som `EventEnvelope` kompatibelt med CloudEvents 1.0 och valideras strikt med Zod.
- **Skäl:** Säkerställer interoperabilitet, deterministisk serialisering och förhindrar dataläckage.

## ADR-002: Reaktiv SwarmEventBus med Ringbuffert och Loose Coupling (TCK-002)
- **Regel:** Implementera en typsäker in-memory pub/sub-buss (`SwarmEventBus`) med wildcard-prenumeration och automatisk rensning via cleanup-callbacks. Buffra de senaste 150 händelserna i en FIFO-ringbuffert för telemetri- och felsökningshistorik.
- **Skäl:** Full observation i realtid utan prestandaförsämring eller re-render loops.

## ADR-003: Reaktivt Styrkort kopplat till TICKETS.md (MasterDevelopmentPlan)
- **Regel:** Skapa komponenten `MasterDevelopmentPlan` som återspeglar tickets och arkitekturkvitton från `doc/TICKETS.md` och `doc/LAST_CYCLE/VERIFY_RECEIPT.json`.
- **Skäl:** Ökad transparens mellan källkod, planeringsfas och körtid.

## ADR-004: Decentraliserad Domänarkitektur och Lokal ADR-struktur (TCK-005)
- **Regel:** Etablera en tvåskiktad beslutshierarki. Övergripande systemarkitektur och principer dokumenteras i `doc/DECISIONS.md`. Domänspecifika arkitekturbeslut placeras lokalt i respektive FSD-moduls `doc/`-katalog: `src/features/[modul]/doc/DECISIONS.md`.
- **Skäl:** Tydlig modularitet, snabb lokal kontextinläsning (JIT) och direkt spårbarhet mellan modulär kod och arkitekturbeslut enligt AGENTS.md v10.0.

## ADR-005: Tvåfasig Exekvering och Token Gate Säkerhetsspärr (TCK-005)
- **Regel:** Tillämpa en strikt tvåfasig process (Fas 1: Planering & Syntes till Steg 3c, Fas 2: Verkställande och TDD) med en kryptografisk Token Gate. Redigering under `src/` är spärrad tills `pnpm genomfor [REQUIRED_TOKEN]` körs och godkännande loggas i...
- **Skäl:** Förhindrar hallucinationer och oplanerade filändringar, säkerställer 100% spårbarhet och gör utvecklingscykeln deterministisk och säker.

## ADR-006: Bidi Live WebSockets & Autonom Kodgenerering via save_code (TCK-TEST-001)
- **Regel:** 1. All kod- och testgenerering i Fas 1 och Fas 2 sker uteslutande över Gemini Live WebSockets via verktyget save_code med behavior:...; gemini-3.8-live etableras som operativ standardmotor för deterministisk källkodsgenerering.;
- **Skäl:** Noll compliance theater, ärlig felrapportering och bevisad autonom källkodsgenerering i körtid.

## ADR-007: Obruten TDD-livscykel med Mekaniska Grindar (Gherkin -> Ticket -> Autonomt Test i 3a)
- **Regel:** 1. Mänsklig nytta förankras alltid i Gherkin-scenarier (doc/features/*.feature).; Biljetter (doc/.TICKETS/TCK-XXX.md) måste innehålla ett formellt typat kodblock med det invarianta ytterkontraktet.;
- **Skäl:** Eliminerar semantiska glapp mellan planering och exekvering, garanterar äkta Fail-First i Gate 3a och säkrar obruten spårbarhet från mänsklig intention till...

## ADR-008: Isomorf intern AST-härdning över externa CLI-binärer
- **Regel:** Implementera kontroll 1–7 i kvalitetsmatrisen direkt via TypeScripts inbyggda Compiler API (ts.createSourceFile) i scripts/drivers/ts.js och scripts/verify-architecture.js utan externa paket.
- **Skäl:** Noll nya beroenden i package.json, full isomorf portabilitet (Node.js och framtida webbläsar-VFS) och exekveringstid under 600 ms.

## ADR-009: Interaktiv Trepunktsbesiktningsgrind för Systemunderhåll (TCK-MAINT)
- **Regel:** Spärra automatisk push för alla TCK-MAINT-körningar. Etablera en interaktiv besiktningsgrind i Fas 3 med trepunktsrapport (Möjlighet, Faronivå, Ångerrätt), interaktiv Bidi Live-frågedialog i CLI och ett s-val (Spara specifikation till doc/.TICKETS/ och återställ källkod via git).
- **Skäl:** Mänsklig suveränitet bevaras, tankearbete tillvaratas utan risk för förhastade kodmutationer, och systemets grindar förblir intakta.

## ADR-010: Deklarativ Testsvit och Isolering av Proceduriella Legacy-tester
- **Regel:** Konfigurera testreglerna deklarativt i vite.config.ts med explicit include (src/**/*.test.ts) och exclude (**/*.legacy.ts, **/transient_*). Döp om äldre procedurfiler till *.legacy.ts och rensa scripts/run-tests.js till ett agnostiskt vitest run-anrop.
- **Skäl:** Sökvägsoberoende regressionssvit, eliminering av deprecation-varningar och fullständig stabilitet inför nya domänmoduler.

## ADR-011: Autonom Git-synkronisering via .env Miljövariabler
- **Regel:** Läsa in GITHUB_USER och GITHUB_TOKEN direkt ur .env i scripts/run-planera-live.ts och pusha mot en dynamiskt autentiserad HTTPS-fjärradress. Säkra .gitignore mot läckage.
- **Skäl:** 100 % obrutna autonoma byggcykler i Crostini/Linux utan manuella lösenordsinmatningar.

## ADR-012: AST-baserad Resurskarta och Topografi (doc/FEATURE_INDEX.json)
- **Regel:** Skapa scripts/generate-feature-index.js baserat på TypeScripts AST-motor (ts.isExportDeclaration och modifier-flaggor) och integrera skriptet som ett obligatoriskt steg i pnpm verify.
- **Skäl:** Deterministisk topografisk karta som möjliggör felfri JIT-orientering för agenter oavsett kodstil eller extern kodbasimport.

- ## ADR-013: Omvändelseslingan (Process-Fail-Fast & Autonom Re-planering)
- **Status:** Beslutad
- **Datum:** 2026-10-30

### Kontext
När en autonom agent under Fas 2 (Källkodsexekvering) möter ett test som inte kan passeras på grund av felaktiga antaganden i Fas 1 (t.ex. förutsatta metoder som saknas i infrastrukturen), riskerar modellen att ta destruktiva genvägar (Agentic Test Tampering) genom att manipulera testfilen eller krascha processen.

### Beslut
Vi inför en **Omvändelseslinga** i systemets körtidsmotor:

1. **Skrivskyddad testlag:** Testfilen under `src/__tests__/` är förseglad under Fas 2. Verktyget `save_code` avvisar alla skrivförsök utanför `src/features/${targetDomain}/`.
2. **Agentens 3 handlingsvägar:** Under Fas 2 har agenten tre likvärdiga strategier:
   - *Alternativ 1 (Lokal reparation):* Rätta logik, typer eller metodanrop i den befintliga källkodsfilen.
   - *Alternativ 2 (Modulär expansion):* Skapa nya hjälpfiler/adaptrar inom domänen och exportera via `index.ts`.
   - *Alternativ 3 (Process-Fail-Fast):* Om testet kräver omöjliga saker som motsäger infrastrukturen, deklarerar agenten `STATUS: HAVERERAT_KONTRAKT [orsak]`.
3. **Mekanisk Omvändelse:** När `HAVERERAT_KONTRAKT` deklareras, eller om Fas 2 förbrukar sina 3 försök utan godkänt test:
   - Källkodsutkast saneras (`git checkout -- src/features/${targetDomain}`).
   - Felloggen sparas i `doc/LAST_CYCLE/CRASH_DUMP.json`.
   - Motorn loopar tillbaka till Fas 1 (Steg 1b/3a) med felloggen inkluderad i startankaret för omplanering.
4. **Cykelspärr:** Max en (1) automatisk omvändelse tillåts per körning för att förhindra token-rusning.

### Konsekvenser
- Agenten slipper panik-fuska vid arkitektoniska hinder.
- Systemet blir självläkande på plannivå.
- Falska gröna byggen elimineras.

## ADR-014: Mötesbryggan och Tvådelad Avsiktsseparation (Funktion vs Underhåll)
- **Regel:** Mötesbryggan (`scripts/samrad.ts`) separerar domänexpertens intention i två distinkta spår:
  1. *Användarfunktion:* Skapar `TCK-XXX` med krav på svenskt Gherkin-scenario under `doc/features/` och `export function` under `src/features/`.
  2. *Systemunderhåll:* Skapar `TCK-MAINT-XXX` under `doc/.TICKETS/` utan Gherkin- eller källkodskrav, med mandat att operera i `scripts/` och `doc/`.
- **Skäl:** Skyddar domänexperten från tekniska detaljer samtidigt som systemet kan ta emot underhållsorder på ren svenska utan att blockeras av FSD-dörrvakten.

## ADR-015: Atomära Underhållsbiljetter och Isolerad Utforskningsbudget
- **Regel:** En underhållsbiljett (`TCK-MAINT`) måste begränsas till max en isolerad fil eller ett avgränsat delmoment per körning. Den sekventiella budgeten på 3 tool-turns dedikeras odelat till denna enda uppgift.
- **Skäl:** Förhindrar att modellen förbrukar sin vändbudget på att inspektera perifera filer och eliminerar felande sökblock (`SEARCH_BLOCK_NOT_FOUND`) vid diff-patchning.

## ADR-016: Defensiv WebSocket-Livscykel i BidiLiveSession
- **Regel:** Samtliga Bidi Live WebSocket-sessioner i `bidiLiveRunner.ts` ska omedelbart avbryta meddelandehanteringen om sessionen är stängd (`if (this.isClosed) return;`).
- **Skäl:** Blockerar eftersläpande asynkrona serverpaket från Google Live API och förhindrar att stängda sockets kraschar efterföljande CLI-steg under fasövergångar.
