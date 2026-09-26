# 3c Fil-operativ Källkodsspecifikation (TCK-007)

## 1. Översikt över Förändringskedjan (Fas 2)

Följande filer är specificerade för källkodsändring i Fas 2 så snart godkännandetoken (`TCK-007-UI-SERIELL-MOTOR-TOKEN`) bekräftats:

---

### Fil 1: `src/features/gemini_live_swarm/ui/SwarmDashboard.tsx` (MODIFIERING)
- **Förändringar**:
  1. Visa kraft-etikett (`force`) på varje agentkort i gridet med passande styling:
     - `ATT_FORLIKAS`: Violett (`bg-purple-500/10 text-purple-300 border-purple-500/20`)
     - `ATT_FOLJA`: Blå/Smaragd (`bg-blue-500/10 text-blue-300 border-blue-500/20`)
     - `ATT_VANDA_OM`: Bärnsten (`bg-amber-500/10 text-amber-300 border-amber-500/20`)
  2. Lägg till en framträdande sektion för **"Seriell Exekveringsmotor (4:e Motorn)"**:
     - Visualisera de linjära stegen: `1a Förstå` -> `1b Kartlägga` -> `2a Avgränsa` -> `2b Modellera` -> `2e Syntetisera` -> `3c Specifikation` -> `E2E Verifiera`.
     - Visa aktiv fas, förfluten tid och Token Gate-spärr.
     - Tillhandahåll en interaktiv test-knapp för att simulera deterministiska pipeline-övergångar på `eventBus` via `eventBus.publishSerialMetric()`.
  3. Uppdatera rubriker och räknare: "5 Enheter (4 Agenter + Seriell Motor)".

---

### Fil 2: `src/features/gemini_live_swarm/ui/TelemetrySidebar.tsx` (MODIFIERING)
- **Förändringar**:
  1. Introducera en 4-krafters sammanfattningspanel under KPI-korten:
     - `ATT_FORLIKAS` (Harmonisering)
     - `ATT_FOLJA` (Framdrift)
     - `ATT_VANDA_OM` (Kritik/Fail-Fast)
     - `SERIELL_MOTOR` (Sekvensering & Gate)
  2. Lägg till reaktiv visualisering av `snapshot.serialExecution`:
     - Visar `currentStage`, `stageStatus`, `durationMs` och om `isTokenGated` är aktivt.
     - Visuell varnings-badge vid aktiv Token Gate.
  3. Uppdatera agentlistan så att även `SERIELL_MOTOR` visas med dess specifika kraft och telemetrimätvärden.

---

### Fil 3: `src/features/gemini_live_swarm/ui/MasterDevelopmentPlan.tsx` (MODIFIERING)
- **Förändringar**:
  1. Lägg till `TCK-006` som `VERIFIERAD` med 100% framsteg, dess leverabler och token `TCK-006-SERIELL-MOTOR-TOKEN`.
  2. Lägg till `TCK-007` som `AKTIV` med 50% framsteg (Fas 1 vid Steg 3c Token Gate), och lista dess acceptanskriterier och artefakter.
  3. Placera `TCK-003` i kön som väntande.
  4. Synkronisera kvittohash med den senast genererade arkitekturhashen.

---

### Fil 4: `src/__tests__/transient_TCK-007.test.ts` (NY TRANSIENT TESTFIL I FAS 2)
- **Testomfång** (< 3s i minnet):
  1. Validera att `DEFAULT_SWARM_ROLES` innehåller de 4 krafterna och `SERIELL_MOTOR`.
  2. Validera att `useSwarmTelemetry` korrekt tar emot och uppdaterar `serialExecution`-metrik från `SwarmEventBus.publishSerialMetric()`.
  3. Validera att `MasterDevelopmentPlan` innehåller de korrekta tickets och status för TCK-006 och TCK-007.
  4. Verifiera att Token Gate-spärren är intakt.

---

### Fil 5: `doc/TICKETS.md` & `doc/TICKETS/TCK-007.md` (UPPDATERING I FAS 2)
- Uppdatera status till `[VERIFIERAD]` när Fas 2 slutförts och testerna passerat.
