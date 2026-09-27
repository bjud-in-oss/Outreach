# 1b Kartlägga: Konsolidering till 4 Försoningsenheter & UI-renodling (TCK-009)

## 1. Kartläggning av Källkodsartefakter inom `gemini_live_swarm`

### Berörda Filer och Beroendekedja

1. **`src/features/gemini_live_swarm/agents/roleDefinitions.ts`**:
   - Ta bort alla 5 legacy-roller/dubbleringar (`ORCHESTRATOR`, `RESEARCHER`, `OUTREACH_WRITER`, `CRITIC`, samt gamla alias).
   - Definiera exakt 4 enheter bundna till krafterna:
     - `ATT_FOLJA`: Visningsnamn **"Att följa Guds son"**
     - `ATT_VANDA_OM`: Visningsnamn **"Att vända om till Gud"**
     - `ATT_FORLIKAS`: Visningsnamn **"Att förlikas med Gud"**
     - `SERIELL_MOTOR`: Visningsnamn **"Att försonas (ensam agent)"** (ersätter "Seriell Motor" i UI)
   - Bevara `SEMANTIC_INVARIANT` ordagrant internt som agenternas etiska kompass i `systemInstruction`.

2. **`src/features/gemini_live_swarm/telemetry/telemetrySchema.ts` & `useSwarmTelemetry.ts`**:
   - Uppdatera telemetrin från 5 till 4 enheter.
   - Primära fält: `force: ReconciliationForceSchema` och `reconciliationState: ReconciliationStateSchema`.
   - Ta bort legacy-roller från Zod-scheman.

3. **`src/features/gemini_live_swarm/bus/swarmEventBus.ts`**:
   - Standardisera händelsekällor och mönster till de 4 krafterna: `outreach/swarm/att_folja`, `outreach/swarm/att_vanda_om`, `outreach/swarm/att_forlikas`, `outreach/swarm/seriell_motor`.

4. **`src/features/gemini_live_swarm/coordinator/swarmOrchestrator.ts` & `session/geminiLiveSession.ts`**:
   - Anpassa orkestreringen så att den hanterar de 4 enheterna direkt via försoningskrafterna utan legacy-roller.
   - Fallback-generering i `GeminiLiveSession` anpassas till krafterna.

5. **`src/features/gemini_live_swarm/ui/SwarmDashboard.tsx` & `ui/TelemetrySidebar.tsx`**:
   - Minska översikten från 5 till exakt 4 enheter.
   - Använd exakt dessa fyra visningsnamn på skärmen:
     - "Att följa Guds son"
     - "Att vända om till Gud"
     - "Att förlikas med Gud"
     - "Att försonas (ensam agent)"
   - Dölj råa interna systeminstruktioner/prompttexter från UI och visa pedagogisk användarnytta och räckvidd.

6. **`src/__tests__/transient_TCK-009.test.ts` (Fas 2 transient mikro-E2E-test)**:
   - Verifiera att exakt 4 enheter finns definierade.
   - Validera att de 4 exakta visningsnamnen återfinns i konfigurationen.
   - Validera att inga legacy-roller finns kvar i domänobjekten.
   - Validera att `SEMANTIC_INVARIANT` finns ordagrant i koden.
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
    "consolidate_to_4_reconciliation_units",
    "exact_4_ui_display_names",
    "remove_5_legacy_roles",
    "preserve_semantic_invariant_verbatim",
    "transient_e2e_tck009_verification"
  ]
}
```
