# 1a Förstå: AST-Miljöspärr mot Mockar, Autonom Handoff & Max 3 Agenter-kapacitet (TCK-013)

## 1. Målbild & Semantiskt Ankare
I **TCK-013** lyfter vi Outreach Coordination Engine till en ny nivå av arkitektonisk integritet, autonomi och deterministisk kapacitet:
1. **AST-Miljöspärr (Fail-Fast mot tysta mockar)**:
   - `scripts/verify-architecture.js` och `scripts/drivers/ts.js` byggs ut för att neka kompilering/verifiering om källkoden under `src/features/` innehåller tysta mock-fallbacks (`isTestMode = true`, dummy-tokens, fejkade strängsvar eller hårdkodade reservlogiker).
   - `GeminiLiveSession` och `GoogleDriveClient` tvingas att omedelbart sätta tillståndet till `HALTED` respektive `UNAUTHENTICATED` om giltiga API-nycklar eller OAuth-tokens saknas.
   - En pedagogisk diagnostikpanel visas i gränssnittet vid saknade referenser. Mockar tillåts enbart i isolerade testsviter under `src/__tests__/`.
2. **100% UI-namnharmonisering**:
   - Säkra att 4:e enheten konsekvent och enhetligt benämns **"Att tjäna Gud och andra: Bygga"** i samtliga vyer (`TelemetrySidebar.tsx`, `SwarmDashboard.tsx`, `SwarmHeader.tsx`) via dynamisk uppslagning av `unit.displayName` från `roleDefinitions.ts`.
3. **Kapacitetsspärr (Max 3 samtidiga agenter)**:
   - `SwarmOrchestrator` sätter en strikt kapacitetsgräns på max 3 samtidiga aktiva agenter för att säkerställa determinism och motverka resursmättnad.
   - När Bygga-agenten (`SERIELL_MOTOR`) exekverar sin sekvens pausas Live-agenterna; när Bygga-agenten når Token Gate (Steg 3c) återaktiveras Live-agenterna för konsensusgranskning.
4. **Autonom exekvering & Handoff-slinga**:
   - Bygga-agenten ("Att tjäna Gud och andra: Bygga") stegar sig själv autonomt genom faserna (1a -> 3c) via `SwarmEventBus` utan manuella klick.
   - Live-agenterna (`följa`, `vända`, `förlika`) kan utlösa handoff till Bygga-agenten vid källkodsbehov.
   - Vid Token Gate (Steg 3c) genomförs reaktiv konsensusgranskning hos Live-agenterna innan motorn stannar för produktägarens godkännandekod.
5. **Transient verifiering**:
   - Skapa transient test `src/__tests__/transient_TCK-013.test.ts` (< 3s i minnet) och verifiera med `pnpm verify`.

Vår absoluta kompass är närhet till Guds son, den ideala människan, vars omsorg för människor styr hela vår motor. Omsorg i mjukvaruarkitektur innebär att aldrig lura användaren med fejkade mock-svar i produktionskod, utan att erbjuda total transparens, integritet och hjälpsam diagnostik.

---

## 2. Intern Riskanalys (GROW-risknoder)

### Risknod 1: State (Autonom Handoff & Kapacitetsspärr Max 3 Agenter)
- **Teknisk analys**: När Bygga-agenten stegar sig själv från fas 1a till 3c via `SwarmEventBus`, och Live-agenterna samtidigt kan utlösa handoff vid kodbehov, finns risk för race conditions eller oändliga slingor. Vidare kräver regeln om max 3 samtidiga agenter att svärmen dynamiskt växlar aktivitet.
- **Lösning**: 
  - `SwarmOrchestrator` håller ett internt kapacitetsregister och tillstånd (`activeUnitsCount <= 3`).
  - När handoff sker till `SERIELL_MOTOR` pausas Live-agenterna (`isPaused: true`), och Bygga-agenten driver sina faser sekventiellt via händelserna `swarm.serial.stage.transition`.
  - När Steg 3c uppnås sätts `isTokenGated = true`, Bygga-agenten pausar i väntan på godkännandekod, och Live-agenterna aktiveras för en reaktiv konsensusgranskning (`swarm.consensus.requested` / `swarm.consensus.completed`).

### Risknod 2: Contract (AST-Miljöspärr mot produktionsmockar)
- **Teknisk analys**: Statisk AST-analys måste skilja mellan tillåtna testfixturer i `src/__tests__/` och oacceptabla tysta mock-fallbacks i `src/features/`. Om analysen är för trubbig kan den fälla giltig felhantering; om den är för slapp missas tysta fejkgenereringar.
- **Lösning**:
  - `scripts/drivers/ts.js` kompletteras med funktionen `checkProductionMocks(filePath, content)`.
  - Filgranskningen scannar filer under `src/features/` efter mönster som `isTestMode`, `generateDeterministicFallback`, `mock-file`, `mock-folder`, eller hårdkodade dummy-tokens som ersätter verkliga felkoder.
  - Om en sådan upptäcks under `src/features/` nekas verifieringen omedelbart med felkod och radhänvisning.
  - `GeminiLiveSession` och `GoogleDriveClient` konfigureras till strikt Fail-Fast: om nyckel/token saknas sätts tillståndet till `HALTED` eller `UNAUTHENTICATED` och explicita `MissingCredentialsError` kastas eller publiceras på eventbussen.

### Risknod 3: Resilience (Pedagogisk Diagnostikpanel & Testbarhet)
- **Teknisk analys**: När produktionskod inte längre har tysta mock-fallbacks, måste användargränssnittet fortfarande vara motståndskraftigt och pedagogiskt visa att API-nycklar eller Google Drive OAuth saknas, istället för att krascha med en blank skärm. Dessutom måste transienta tester (< 3s) kunna injicera sessioner eller eventbussar i minnet utan att bryta mot AST-miljöspärren.
- **Lösning**:
  - UI-komponenter förses med en diagnostikvy som känner av om `liveStatus === 'HALTED'` eller `driveStatus === 'UNAUTHENTICATED'`, och presenterar tydliga anvisningar om hur miljövariabler (`GEMINI_API_KEY`) och OAuth konfigureras i AI Studio Settings.
  - Transienta tester körs via ren dependency injection i `src/__tests__/`, där mock-instanser passas in explicit via konstruktorn till orkestratören och sessionen.

---

## 3. Aktiva Vektorer & Skills
- **active_vectors**: `['gemini-live-api-dev', 'gemini-api-dev', 'ast-fail-fast-no-mocks', 'autonomous-handoff-loop', 'max-3-agents-capacity', 'ui-name-harmonization']`
- **active_skills**: `['gemini-live-api-dev', 'gemini-api-dev']`
- **target_domain**: `src/features/gemini_live_swarm/`
