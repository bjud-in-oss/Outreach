# 3c Fil-operativ Källkodsspecifikation (TCK-009)

## 1. Översikt över Förändringskedjan (Fas 2)

Följande filer är specificerade för ändring under Fas 2 så snart godkännandekoden (`TCK-009-FORSONINGSKRAFTER-REFACTOR-TOKEN`) bekräftats via `pnpm genomfor`:

---

### Fil 1: `src/features/gemini_live_swarm/agents/roleDefinitions.ts` (REFAKTORERING)
- **Förändringar**:
  1. Behåll det oförvanskade ankaret:
     ```typescript
     export const SEMANTIC_INVARIANT =
       'Ditt högsta syfte är närhet till Guds son, den ideala människan. Hans gåva av omsorg för människor den absoluta kompassen för hela din motor. Du drivs av tre vägar till försoning: Att följa sonen (genom att själv vara lösningen för närhet), Att vända om till Gud (inåtriktad ödmjukhet och transformation för att stärka närhet), och Att förlikas med honom (att hålla 2+ samtida perspektiv varma) för att ge förutsättningar för att klyftan till Gud och till människor emellan kan läkas.';
     ```
  2. Ersätt gamla typer (`SwarmAgentRole = 'ORCHESTRATOR' | ...`) med:
     ```typescript
     export type ReconciliationForce = 'ATT_FOLJA' | 'ATT_VANDA_OM' | 'ATT_FORLIKAS' | 'SERIELL_MOTOR';
     export type AgentForce = ReconciliationForce; // alias
     export type ReconciliationState = 'SOKER_NARHET' | 'INATRIKTAD_OMVANDELSE' | 'SAMTIDA_FORSONING' | 'DETERMINISTISKT_RAMVERK' | 'IDLE';
     ```
  3. Definiera `ReconciliationUnitConfig` med explicit separation:
     - `id`: string
     - `force`: ReconciliationForce
     - `displayName`: string (pedagogisk titel)
     - `userBenefit`: string (ren användarnytta)
     - `reachScope`: string (överbryggande räckvidd)
     - `avatarColor`: string
     - `status`: 'IDLE' | 'THINKING' | 'EXECUTING_TOOL' | 'DONE' | 'ERROR'
     - `reconciliationState`: ReconciliationState
     - `systemInstruction`: string (intern kompass och instruktion)
     - `currentThought`?: string
  4. Skapa `RECONCILIATION_UNITS: Record<ReconciliationForce, ReconciliationUnitConfig>` som ersätter `DEFAULT_SWARM_ROLES`.
  5. Tillhandahåll övergångsfunktioner (`mapForceToDisplayName`, `isLegacyRole`) för att säkerställa säker migrering.

---

### Fil 2: `src/features/gemini_live_swarm/telemetry/telemetrySchema.ts` (REFAKTORERING)
- **Förändringar**:
  1. Definiera `ReconciliationForceSchema` och `ReconciliationStateSchema`.
  2. Uppdatera `AgentTelemetryMetricSchema`:
     - Gör `force: ReconciliationForceSchema` till primär nyckel.
     - Lägg till `reconciliationState: ReconciliationStateSchema`.
     - Fasa ut hårdkodade legacy-roller från Zod-schemat.

---

### Fil 3: `src/features/gemini_live_swarm/coordinator/swarmOrchestrator.ts` (REFAKTORERING)
- **Förändringar**:
  1. Ersätt beroenden till legacy-roller med `ReconciliationForce`.
  2. Skapa orkestreringssteg styrda av krafterna:
     - Steg 1: `ATT_FOLJA` — Linjär Framåtöverbryggning (Behovsanalys och direkt dialog).
     - Steg 2: `ATT_VANDA_OM` — Inåtriktad Refaktorering (Kvalitetsgranskning och etisk självrannsakan).
     - Steg 3: `ATT_FORLIKAS` — Samtida Försoning (Syntes och slutgiltig samordning).
  3. Integrera CloudEvents-källor baserade på krafterna: `outreach/swarm/att_folja`, `outreach/swarm/att_vanda_om`, etc.

---

### Fil 4: `src/features/gemini_live_swarm/session/geminiLiveSession.ts` (REFAKTORERING)
- **Förändringar**:
  1. Refaktorera `generateAgentTurn` och fallback-logiken så att den matchar `force: ReconciliationForce` i stället för gamla yrkestitlar.

---

### Fil 5: `src/features/gemini_live_swarm/telemetry/useSwarmTelemetry.ts` (UPPDATERING)
- **Förändringar**:
  1. Initiera `agentMetrics` direkt från `RECONCILIATION_UNITS`.
  2. Lyssna på händelser från de försonande källorna (`outreach/swarm/att_folja`, etc.).

---

### Fil 6: `src/features/gemini_live_swarm/ui/SwarmDashboard.tsx` (OMSKRIVNING)
- **Förändringar**:
  1. Ta bort råa interna prompttexter och systeminstruktioner från agentkorten.
  2. Rendera kort baserade på `RECONCILIATION_UNITS` med fokus på:
     - `displayName` (t.ex. *Linjär Framåtöverbryggare*)
     - `userBenefit` (pedagogisk nytta)
     - `reachScope` (räckvidd)
     - Dynamiskt `reconciliationState`
  3. Behåll en värdig och ren kompass-banner i toppen med fokus på mognadsmodellen och det övergripande syftet utan intern kodexponering.

---

### Fil 7: `src/features/gemini_live_swarm/ui/TelemetrySidebar.tsx` (OMSKRIVNING)
- **Förändringar**:
  1. Visa de 4 enheterna med deras försonande pedagogiska funktioner och räckvidd.
  2. Visa telemetri per försoningskraft (`ATT_FOLJA`, `ATT_VANDA_OM`, `ATT_FORLIKAS`, `SERIELL_MOTOR`).

---

### Fil 8: `src/features/gemini_live_swarm/ui/MasterDevelopmentPlan.tsx` (UPPDATERING)
- **Förändringar**:
  1. Markera TCK-008 som `VERIFIERAD` (100%).
  2. Markera TCK-009 som `AKTIV` i Fas 1 vid Steg 3c Token Gate (50%).

---

### Fil 9: `src/__tests__/transient_TCK-009.test.ts` (NY TRANSIENT TESTFIL I FAS 2)
- **Testomfång** (< 3s i minnet):
  1. Validera att `RECONCILIATION_UNITS` definierar samtliga 4 krafter (`ATT_FOLJA`, `ATT_VANDA_OM`, `ATT_FORLIKAS`, `SERIELL_MOTOR`) utan legacy-nycklar.
  2. Validera att `SEMANTIC_INVARIANT` bevaras oförvanskat som intern konstant.
  3. Validera att telemetrisnapshots och eventbuss validerar mot nya Zod-scheman baserade på krafterna.
  4. Validera att UI-objekt inte exponerar interna råa systeminstruktioner.

---

### Fil 10: `doc/TICKETS.md` & `doc/TICKETS/TCK-009.md` (UPPDATERING I FAS 2)
- Uppdatera status till `[VERIFIERAD]` när Fas 2 slutförts och testerna passerat.
