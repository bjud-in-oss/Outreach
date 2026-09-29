# 3c Fil-operativ Källkodsspecifikation (TCK-014)

## 1. Förändringskedja för Fas 2 (pnpm genomfor)

Följande filer är specificerade för källkodsändring under Fas 2 efter bekräftelse av godkännandekoden (`TCK-014-REACT-STATE-SYNC-TOKEN`):

---

### Fil 1: `src/features/gemini_live_swarm/telemetry/useSwarmTelemetry.ts` (MODIFIERING)
- **Förändring**:
  - Håll en `audioOutputRef` synkroniserad med senaste `audioOutput`.
  - Refaktorera `toggleManualMute`: publicera `bus.publishAudioState` utanför `setSnapshot`.
  - Refaktorera `triggerInvocation`: publicera till `bus` utan att göra manuell synkron `setSnapshot`.

---

### Fil 2: `src/features/gemini_live_swarm/ui/TelemetrySidebar.tsx` (MODIFIERING)
- **Förändring**:
  - Utöka `TelemetrySidebarProps` med valfri `snapshot?: SwarmTelemetrySnapshot`.
  - Om `props.snapshot` skickas in, använd denna direkt. Annars fall tillbaka till intern `useSwarmTelemetry(eventBus)`.

---

### Fil 3: `src/features/gemini_live_swarm/ui/SwarmDashboard.tsx` (MODIFIERING)
- **Förändring**:
  - Skicka med `snapshot={snapshot}` vid rendering av `<TelemetrySidebar eventBus={eventBus} snapshot={snapshot} />`.

---

### Fil 4: `src/__tests__/transient_TCK-014.test.ts` (NY TRANSIENT TESTFIL)
- **Förändring**:
  - Skapa transient test (< 3s i minnet) som verifierar:
    1. Att `toggleManualMute` publicerar ljudhändelse utan att krocka i renderslingan.
    2. Att `TelemetrySidebar` konsumerar nedskickad `snapshot` korrekt.
    3. Att namnanrop och röstspårsaktivering fungerar utan synkrona setState-krockar.

---

### Fil 5: `scripts/run-tests.js` & `src/__tests__/suite/e2e_regression.test.ts` (MODIFIERING)
- **Förändring**:
  - Registrera `transient_TCK-014.test.ts` i testrunner och regressionssvit.

---

### Fil 6: `scripts/verify-architecture.js` (MODIFIERING)
- **Förändring**:
  - Registrera `TCK-014-REACT-STATE-SYNC-TOKEN` bland giltiga tokens.

---

### Fil 7: `src/features/gemini_live_swarm/doc/DECISIONS.md` (MODIFIERING)
- **Förändring**:
  - Dokumentera **ADR-SWARM-012: Enkelriktad Telemetrisynk & Eliminering av setState under Render**.

---

### Fil 8: `src/features/gemini_live_swarm/ui/MasterDevelopmentPlan.tsx` (MODIFIERING)
- **Förändring**:
  - Lägg till styrkort för TCK-014.
