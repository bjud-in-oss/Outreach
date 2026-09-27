# 1b Kartlägga: Djup Refaktorering av Försoningskrafterna (Kodstruktur & UI-separation) (TCK-009)

## 1. Kartläggning av Källkodsartefakter inom `gemini_live_swarm`

### Berörda Filer och Beroendekedja

1. **`src/features/gemini_live_swarm/agents/roleDefinitions.ts`**:
   - Ersätt gamla legacy-roller (`ORCHESTRATOR`, `RESEARCHER`, `OUTREACH_WRITER`, `CRITIC`) med de fyra primära försoningsenheterna:
     - `ATT_FOLJA`: Närhetsöverbryggaren (själv vara lösningen för närhet).
     - `ATT_VANDA_OM`: Kvalitetsrefaktoreringen (inåtriktad ödmjukhet & transformation, Fail-Fast).
     - `ATT_FORLIKAS`: Konsensus- och syntesmotorn (hålla 2+ samtida perspektiv varma).
     - `SERIELL_MOTOR`: Det orubbliga ramverket (deterministisk sekvensering och ordningsskydd).
   - Skapa Zod-schema och typ `ReconciliationUnitConfig` med explicit separation mellan intern `systemInstruction` (med det oförvanskade `SEMANTIC_INVARIANT`) och extern presentationstitel/beskrivning.

2. **`src/features/gemini_live_swarm/telemetry/telemetrySchema.ts`**:
   - Refaktorera `AgentTelemetryMetricSchema` så att `force: AgentForceSchema` och `reconciliationState` är primära fält i stället för legacy-roller.
   - Definiera `ReconciliationStateSchema = z.enum(['SOKER_NARHET', 'INATRIKTAD_OMVANDELSE', 'SAMTIDA_FORSONING', 'DETERMINISTISKT_RAMVERK', 'IDLE'])`.

3. **`src/features/gemini_live_swarm/bus/swarmEventBus.ts`**:
   - Uppdatera publiceringsmönster och källor till att följa krafterna (`outreach/swarm/att_folja`, `outreach/swarm/att_vanda_om`, `outreach/swarm/att_forlikas`, `outreach/swarm/seriell_motor`).

4. **`src/features/gemini_live_swarm/coordinator/swarmOrchestrator.ts` & `session/geminiLiveSession.ts`**:
   - Uppdatera kampanjstegen så att de styrs av krafterna `ATT_FOLJA`, `ATT_VANDA_OM` och `ATT_FORLIKAS`.
   - Ta bort legacy-switchar i fallback-syntesen och ersätt med logik driven av försoningskrafternas inriktning.

5. **`src/features/gemini_live_swarm/ui/SwarmDashboard.tsx` & `ui/TelemetrySidebar.tsx`**:
   - Fullständig UI-sanering: Ta bort råa interna prompttexter och systeminstruktioner från gränssnittet.
   - Presentera enheterna med pedagogiska koncept och affärsnytta:
     - *Linjär Framåtöverbryggare* (Behovsanalys och direkt dialog)
     - *Inåtriktad Refaktorering* (Självrannsakande kvalitetskontroll utan brus)
     - *Samtida Försonare* (Syntes som harmoniserar motstridiga perspektiv)
     - *Seriellt Processkydd* (Deterministiskt exekveringsskydd med Token Gate)

6. **`src/features/gemini_live_swarm/ui/MasterDevelopmentPlan.tsx`**:
   - Registrera TCK-009 som aktiv ticket och uppdatera status för tidigare avslutade ärenden.

7. **`src/__tests__/transient_TCK-009.test.ts` (Fas 2 transient mikro-E2E-test)**:
   - Verifiera att inga legacy-roller (`ORCHESTRATOR`, `RESEARCHER`, `OUTREACH_WRITER`, `CRITIC`) förekommer i domänmodellen eller telemetriobjekten.
   - Validera att `SEMANTIC_INVARIANT` bevaras i källkoden men hålls dold i användargränssnittet.
   - Körtid under 3 sekunder i minnet.

---

## 2. Fas 1 Deklaration

```json
{
  "status": "PLANNING_FAS_1",
  "current_domain": "src/features/gemini_live_swarm/",
  "next_step": "2e_syntetisera",
  "ticket_id": "TCK-009",
  "active_skill": "gemini-live-api-dev",
  "active_vectors": [
    "deep_reconciliation_domain_model",
    "telemetry_schema_force_first",
    "ui_internal_prompt_separation",
    "orchestrator_forces_pipeline",
    "transient_e2e_tck009_verification"
  ]
}
```
