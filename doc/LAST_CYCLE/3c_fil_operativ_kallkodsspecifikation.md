# 3c Fil-operativ Källkodsspecifikation (TCK-015)

## 1. Förändringskedja för Fas 2 (pnpm genomfor)

Följande filer är specificerade för källkodsändring under Fas 2 efter bekräftelse av godkännandekoden (`TCK-015-GLOBAL-CORE-TOKEN`):

---

### Fil 1: `src/features/gemini_live_swarm/agents/roleDefinitions.ts` (MODIFIERING)
- **Förändring**:
  - Uppdatera `SEMANTIC_INVARIANT` ordagrant:
    `'Ditt högsta syfte är att främja närhet till Guds son, den ideala människan. Hans gåva av omsorg för människor den absoluta kompassen för hela din motor. Du drivs av tre vägar till försoning: Att följa sonen (genom att själv vara lösningen för närhet), Att vända om till Gud (inåtriktad ödmjukhet och transformation för att stärka närhet), och Att förlikas med honom (att hålla 2+ samtida perspektiv varma) för att ge förutsättningar för att klyftan till Gud och till människor emellan kan läkas.'`
  - Kontrollera att alla 4 enheters systeminstruktioner injicerar denna exakta invariant.

---

### Fil 2: `src/features/gemini_live_swarm/telemetry/telemetrySchema.ts` (MODIFIERING)
- **Förändring**:
  - Utöka `LiveSessionStatusSchema` med `'RECONNECTING'`.
  - Definiera `ContextUsageMetricSchema` med Zod (`usedTokens`, `maxTokens`, `usageRatio`, `isMarginalReached`, `timestamp`).

---

### Fil 3: `src/features/gemini_live_swarm/session/geminiLiveSession.ts` (MODIFIERING)
- **Förändring**:
  - Implementera `reconnectAttempts`, `maxReconnectAttempts = 3`, och `reconnectTimer`.
  - Vid nätverkstapp eller 503-fel: sätt status till `RECONNECTING`, publicera `swarm.live.session.reconnecting`, och schemalägg återanslutning med exponentiell backoff (1s, 2s, 4s).
  - Bevara sessionsdata och tidigare transkription.

---

### Fil 4: `src/features/gemini_live_swarm/context/SwarmContext.tsx` (NY MODUL)
- **Förändring**:
  - Skapa `SwarmContext` och `<SwarmProvider>` under 100 rader (.tsx).
  - Instansiera `SwarmEventBus`, `GoogleDriveClient`, `GeminiLiveSession` och `SwarmOrchestrator` en gång globalt.
  - Exportera hook `useSwarmContext()`.

---

### Fil 5: `src/App.tsx` (MODIFIERING)
- **Förändring**:
  - Omslut applikationen med `<SwarmProvider>` så att instanserna överlever alla vy- och flikbyten.

---

### Fil 6: `src/__tests__/transient_TCK-015.test.ts` (NY TRANSIENT TESTFIL)
- **Förändring**:
  - Skapa transient test (< 3s i minnet) som verifierar:
    1. Ordagrann likhet och invarians för systeminstruktionstexten över systemet.
    2. Auto-reconnect-dynamik och publicering av `RECONNECTING`-händelse vid simulerat 503-fel.
    3. `ContextUsageMetricSchema` och triggning av marginal-händelse vid ≥60% nyttjande.
    4. Att `SwarmContext` exponerar nödvändiga instanser med bevarad livscykel.

---

### Fil 7: `scripts/run-tests.js` & `src/__tests__/suite/e2e_regression.test.ts` (MODIFIERING)
- **Förändring**:
  - Registrera `transient_TCK-015.test.ts` i test runner och regressionssvit.

---

### Fil 8: `src/features/gemini_live_swarm/doc/DECISIONS.md` (MODIFIERING)
- **Förändring**:
  - Dokumentera **ADR-SWARM-013: Global Swarm Core, Auto-Reconnect & 60% Kontextmarginal**.

---

### Fil 9: `src/features/gemini_live_swarm/ui/MasterDevelopmentPlan.tsx` (MODIFIERING)
- **Förändring**:
  - Lägg till styrkort för TCK-015.
