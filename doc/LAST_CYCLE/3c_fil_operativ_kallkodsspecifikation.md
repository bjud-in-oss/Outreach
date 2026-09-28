# 3c Fil-operativ Källkodsspecifikation (TCK-013)

## 1. Förändringskedja för Fas 2 (pnpm genomfor)

Följande filer är specificerade för källkodsändring under Fas 2 efter bekräftelse av godkännandekoden (`TCK-013-AUTONOM-HANDOFF-TOKEN`):

---

### Fil 1: `scripts/drivers/ts.js` (MODIFIERING)
- **Förändring**:
  - Implementera funktionen `checkNoProductionMocks(filePath, content)` som validerar filer under `src/features/`.
  - Blockera mönster som `isTestMode`, `generateDeterministicFallback`, `mock-folder` och `mock-file`.
  - Returnera `{ valid: false, error: ... }` med radnummer vid träff.

---

### Fil 2: `scripts/verify-architecture.js` (MODIFIERING)
- **Förändring**:
  - Integrera `checkNoProductionMocks` i verifieringsloopen för samtliga TypeScript-filer under `src/features/`.
  - Uppdatera godkända tokens i `validTokens` med `TCK-013-AUTONOM-HANDOFF-TOKEN`.

---

### Fil 3: `src/features/gemini_live_swarm/telemetry/telemetrySchema.ts` (MODIFIERING)
- **Förändring**:
  - Lägg till `'HALTED'` i `LiveSessionStatusSchema`.
  - Skapa schema och typ för konsensushändelser: `SwarmConsensusSchema`.

---

### Fil 4: `src/features/gemini_live_swarm/session/geminiLiveSession.ts` (MODIFIERING)
- **Förändring**:
  - Avlägsna `isTestMode` och `generateDeterministicFallback`.
  - Sätt initial status till `HALTED` om `GEMINI_API_KEY` saknas och sänd CloudEvents-händelsen `swarm.live.session.halted`.
  - Kasta strukturerat `MissingApiKeyError` vid anrop mot saknad klient.

---

### Fil 5: `src/features/google_drive_sync/api/driveClient.ts` (MODIFIERING)
- **Förändring**:
  - Ta bort fejkade mapp- och fil-ID (`mock-folder-...`, `mock-file-...`).
  - Sätt status till `UNAUTHENTICATED` och kasta `Error` om access-token saknas.

---

### Fil 6: `src/features/gemini_live_swarm/ui/TelemetrySidebar.tsx` (MODIFIERING)
- **Förändring**:
  - Ersätt hårdkodade "Att försonas (ensam agent)" med dynamisk läsning från `RECONCILIATION_UNITS.SERIELL_MOTOR.displayName` ("Att tjäna Gud och andra: Bygga").
  - Dynamisera visningen av de 4 försoningsenheterna.

---

### Fil 7: `src/features/gemini_live_swarm/ui/components/SwarmHeader.tsx` (MODIFIERING)
- **Förändring**:
  - Synkronisera 4:e enhetens namn och beskrivning mot `RECONCILIATION_UNITS.SERIELL_MOTOR.displayName`.

---

### Fil 8: `src/features/gemini_live_swarm/ui/components/SwarmControlPanel.tsx` (MODIFIERING)
- **Förändring**:
  - Inför pedagogisk diagnostikbanner vid `liveStatus === 'HALTED'`, med hänvisning till AI Studio Settings > Secrets.

---

### Fil 9: `src/features/gemini_live_swarm/coordinator/swarmOrchestrator.ts` (MODIFIERING)
- **Förändring**:
  - Inför `MAX_CONCURRENT_AGENTS = 3`.
  - Pausa Live-agenterna när `SERIELL_MOTOR` exekverar sin sekvens.
  - Implementera autonom handoff-slinga där Bygga-agenten stegar sig själv från fas 1a till 3c via `SwarmEventBus`.
  - Vid Token Gate (Steg 3c) pausas Bygga-agenten och Live-agenterna återaktiveras för reaktiv konsensusgranskning (`swarm.consensus.requested` / `swarm.consensus.completed`).

---

### Fil 10: `src/__tests__/transient_TCK-013.test.ts` (NY TRANSIENT TESTFIL)
- **Förändring**:
  - Transient in-memory-test (< 3s) som verifierar:
    1. Fail-Fast när nycklar saknas (`HALTED` och `UNAUTHENTICATED`).
    2. AST-spärr mot mockar i `src/features/`.
    3. 100% UI-namnharmonisering för 4:e enheten.
    4. Kapacitetsspärr (max 3 samtidiga agenter).
    5. Autonom handoff-slinga och konsensusgranskning vid Token Gate (3c).

---

### Fil 11: `scripts/run-tests.js` & `src/__tests__/suite/e2e_regression.test.ts` (MODIFIERING)
- **Förändring**:
  - Registrera `transient_TCK-013.test.ts` i testkörare och regressionssvit.

---

### Fil 12: `src/features/gemini_live_swarm/doc/DECISIONS.md` (MODIFIERING)
- **Förändring**:
  - Dokumentera **ADR-SWARM-011: AST-Miljöspärr mot Mockar, Autonom Handoff & Max 3 Agenter-kapacitet**.

---

### Fil 13: `src/features/gemini_live_swarm/ui/MasterDevelopmentPlan.tsx` (MODIFIERING)
- **Förändring**:
  - Lägg till TCK-013 i utvecklingsplanen och uppdatera status.
