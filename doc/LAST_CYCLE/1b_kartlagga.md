# 1b Kartlägga: UI & Dashboard-övervakning av Seriell Motor (TCK-007)

## 1. Kartläggning av Källkodsartefakter inom `gemini_live_swarm`

### Berörda Filer och Beroendekedja
1. **`src/features/gemini_live_swarm/ui/SwarmDashboard.tsx`**:
   - Lägg till visning av agentkraft på varje agentkort (`ATT_FORLIKAS`, `ATT_FOLJA`, `ATT_VANDA_OM`).
   - Introducera ett särskilt framhävt kontrollkort för den 4:e motorn (`SERIELL_MOTOR`).
   - Bygg en deterministisk pipelinestatus-vy som visar aktuell fas (`1a_forsta`, `1b_kartlagga`, `2a_avgransa`, `2b_modellera`, `2e_syntetisera`, `3c_spec`, `e2e_verify`), stegstatus (`PENDING`, `RUNNING`, `COMPLETED`, `GATED`) och Token Gate-indikator.
   - Lägg till kraftmatris och jämförelsevy som visar hur de fyra krafterna samverkar.

2. **`src/features/gemini_live_swarm/ui/TelemetrySidebar.tsx`**:
   - Skapa sektionen "SI v10.0 Krafter & Balans":
     - `ATT_FORLIKAS` (Violett)
     - `ATT_FOLJA` (Blå)
     - `ATT_VANDA_OM` (Bärnsten)
     - `SERIELL_MOTOR` (Cyan)
   - Rendera reaktiv `SerialExecution`-kort när telemetrihändelser (`swarm.serial.*`) registreras.
   - Visning av exekveringstid (durationMs), aktiv fas, och om pipelinen är spärrad av Token Gate.

3. **`src/features/gemini_live_swarm/ui/MasterDevelopmentPlan.tsx`**:
   - Uppdatera ticket-listan:
     - Lägg till `TCK-006` (Agentkrafter & 4:e Seriell Motor) med status `VERIFIERAD`, 100% framsteg och token `TCK-006-SERIELL-MOTOR-TOKEN`.
     - Lägg till `TCK-007` (UI & Dashboard-övervakning av Seriell Motor) med status `AKTIV`, 50% framsteg (Fas 1 planerad vid Token Gate).
     - Justera `TCK-003` till köstatus (`VÄNTAR`).

4. **`src/__tests__/transient_TCK-007.test.ts` (Fas 2 transient mikro-E2E-test)**:
   - Skapa ett snabbt minnes-test (< 3s) som verifierar:
     - Rendering och tillstånd för UI-komponenter (`SwarmDashboard`, `TelemetrySidebar`, `MasterDevelopmentPlan`).
     - Reaktiv presentation av de 4 krafterna.
     - Visning av serialExecution-metrik och Token Gate i styrkort och sidopanel.

---

## 2. Fas 1 Deklaration

```json
{
  "status": "PLANNING_FAS_1",
  "current_domain": "src/features/gemini_live_swarm/",
  "next_step": "2e_syntetisera",
  "ticket_id": "TCK-007",
  "active_skill": "gemini-live-api-dev",
  "active_vectors": [
    "ui_serial_motor_visualization",
    "four_agent_forces_telemetry_sidebar",
    "pipeline_stage_progress_tracker",
    "token_gate_visual_indicator",
    "master_development_plan_tck007_sync"
  ]
}
```
