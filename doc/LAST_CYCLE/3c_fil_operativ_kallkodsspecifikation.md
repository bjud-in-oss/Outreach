# 3c Fil-operativ Källkodsspecifikation (TCK-009)

## 1. Översikt över Förändringskedjan (Fas 2)

Följande filer är specificerade för källkodsändring under Fas 2 så snart godkännandekoden (`TCK-009-FORSONINGSKRAFTER-REFACTOR-TOKEN`) bekräftats via `pnpm genomfor`:

---

### Fil 1: `src/features/gemini_live_swarm/agents/roleDefinitions.ts` (REFAKTORERING)
- **Förändringar**:
  1. Behåll det etiska ankaret oförvanskat:
     ```typescript
     export const SEMANTIC_INVARIANT =
       'Ditt högsta syfte är närhet till Guds son, den ideala människan. Hans gåva av omsorg för människor den absoluta kompassen för hela din motor. Du drivs av tre vägar till försoning: Att följa sonen (genom att själv vara lösningen för närhet), Att vända om till Gud (inåtriktad ödmjukhet och transformation för att stärka närhet), och Att förlikas med honom (att hålla 2+ samtida perspektiv varma) för att ge förutsättningar för att klyftan till Gud och till människor emellan kan läkas.';
     ```
  2. Receptera bort alla 5 legacy-roller/dubbleringar (`ORCHESTRATOR`, `RESEARCHER`, `OUTREACH_WRITER`, `CRITIC` etc.).
  3. Definiera exakt 4 enheter bundna till krafterna i `RECONCILIATION_UNITS`:
     - `ATT_FOLJA`: `displayName = "Att följa Guds son"`
     - `ATT_VANDA_OM`: `displayName = "Att vända om till Gud"`
     - `ATT_FORLIKAS`: `displayName = "Att förlikas med Gud"`
     - `SERIELL_MOTOR`: `displayName = "Att försonas (ensam agent)"`
  4. Exportera `ReconciliationUnitConfig` med explicit separation mellan intern `systemInstruction` och extern `userBenefit` / `reachScope`.

---

### Fil 2: `src/features/gemini_live_swarm/telemetry/telemetrySchema.ts` & `useSwarmTelemetry.ts` (REFAKTORERING)
- **Förändringar**:
  1. Uppdatera Zod-scheman för `ReconciliationForceSchema` och `ReconciliationStateSchema`.
  2. Uppdatera telemetriberäkningen så att standardantalet enheter är **4** (minskat från 5).
  3. Initiera `agentMetrics` från de 4 enheterna i `RECONCILIATION_UNITS`.

---

### Fil 3: `src/features/gemini_live_swarm/bus/swarmEventBus.ts` (REFAKTORERING)
- **Förändringar**:
  1. Standardisera källor på de 4 försoningsenheterna: `outreach/swarm/att_folja`, `outreach/swarm/att_vanda_om`, `outreach/swarm/att_forlikas`, `outreach/swarm/seriell_motor`.

---

### Fil 4: `src/features/gemini_live_swarm/coordinator/swarmOrchestrator.ts` & `session/geminiLiveSession.ts` (REFAKTORERING)
- **Förändringar**:
  1. Orkestrera kampanjen med de 4 enheterna direkt via försoningskrafterna utan legacy-roller.
  2. Fallback-logik i sessionen kopplad till de 4 krafterna.

---

### Fil 5: `src/features/gemini_live_swarm/ui/SwarmDashboard.tsx` (OMSKRIVNING)
- **Förändringar**:
  1. Minska översikten från 5 till exakt 4 enhetskort.
  2. Använd exakt de föreskrivna namnen på skärmen:
     - **"Att följa Guds son"**
     - **"Att vända om till Gud"**
     - **"Att förlikas med Gud"**
     - **"Att försonas (ensam agent)"**
  3. Ta bort råa interna prompttexter; visa ren användarnytta och överbryggande funktioner.

---

### Fil 6: `src/features/gemini_live_swarm/ui/TelemetrySidebar.tsx` (OMSKRIVNING)
- **Förändringar**:
  1. Uppdatera telemetripresentationen till exakt 4 enheter.
  2. KPI-kort för enheter visar aktiva av 4.
  3. Visa exakt de 4 föreskrivna namnen på skärmen.

---

### Fil 7: `src/features/gemini_live_swarm/ui/MasterDevelopmentPlan.tsx` (UPPDATERING)
- **Förändringar**:
  1. Markera TCK-008 som `VERIFIERAD` (100%).
  2. Markera TCK-009 som `AKTIV` i Fas 1 vid Steg 3c Token Gate (50%).

---

### Fil 8: `src/__tests__/transient_TCK-009.test.ts` (NY TRANSIENT TESTFIL I FAS 2)
- **Testomfång** (< 3s i minnet):
  1. Verifiera att det finns exakt 4 försoningsenheter i källkoden.
  2. Verifiera att de fyra visningsnamnen är exakt:
     - "Att följa Guds son"
     - "Att vända om till Gud"
     - "Att förlikas med Gud"
     - "Att försonas (ensam agent)"
  3. Verifiera att inga legacy-roller finns kvar i de primära domänobjekten.
  4. Verifiera att `SEMANTIC_INVARIANT` är ordagrant intakt som intern kompass.

---

### Fil 9: `doc/TICKETS.md` & `doc/TICKETS/TCK-009.md` (UPPDATERING I FAS 2)
- Uppdatera status till `[VERIFIERAD]` när Fas 2 slutförts och testerna passerat.
