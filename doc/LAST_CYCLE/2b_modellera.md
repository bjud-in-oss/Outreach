# 2b Modellera: UI & Dashboard-övervakning av Seriell Motor (TCK-007)

## 1. Komponentmodellering

### 1. Visualisering av de 4 Krafterna i `SwarmDashboard.tsx`
- **Agentkort**:
  Varje agent i svärmen kopplas visuellt till sin specifika kraft med en färgkodad badge:
  - `ORCHESTRATOR` -> Kraft: `ATT_FORLIKAS` (Violett / Indigo)
  - `RESEARCHER` -> Kraft: `ATT_FOLJA` (Blå / Cyan)
  - `OUTREACH_WRITER` -> Kraft: `ATT_FOLJA` (Smaragd / Teal)
  - `CRITIC` -> Kraft: `ATT_VANDA_OM` (Bärnsten / Orange)
  - `SERIELL_MOTOR` -> Kraft: `SERIELL_MOTOR` (Cyan / Blå - Deterministisk motor)

- **Dedikerad Sektion för Seriell Motor & Pipeline**:
  - En panel med live-mätare:
    - Fassteg: `1a_forsta` -> `1b_kartlagga` -> `2a_avgransa` -> `2b_modellera` -> `2e_syntetisera` -> `3c_spec` -> `e2e_verify`.
    - Visuell status per steg (slutfört, pågående, pausat vid Token Gate, väntande).
    - Mätvärden: Aktuell fas, varaktighet (ms), Token Gate aktiv/spärrad.
    - Interaktiv simulering/testkörning av faser via `eventBus.publishSerialMetric()`.

### 2. Telemetrisk Kraftbalans i `TelemetrySidebar.tsx`
- **4-Krafters Matris**:
  - 4 separata minikort/mätare som summerar händelser och aktivitet per kraft (`ATT_FORLIKAS`, `ATT_FOLJA`, `ATT_VANDA_OM`, `SERIELL_MOTOR`).
- **Seriell Motor Live-kort**:
  - Visar aktuell `snapshot.serialExecution` när ett flöde är aktivt.
  - Tydlig badge om Token Gate är aktiv: "TOKEN GATE: SPÄRRAD (Väntar på godkännande)" kontra "TOKEN GATE: VERIFIERAD".

### 3. MasterDevelopmentPlan Styrkort
- Visa fullständig historik:
  - TCK-001 (Initierad & Verifierad)
  - TCK-002 (Swarm Telemetry - Verifierad)
  - TCK-004 (Wayfinder & SI v10.0 - Verifierad)
  - TCK-005 (Decisions Standardisering - Verifierad)
  - TCK-006 (Agentkrafter & 4:e Seriell Motor - Verifierad)
  - TCK-007 (UI & Dashboard-övervakning av Seriell Motor - Aktiv, Fas 1 vid Steg 3c)
  - TCK-003 (MCP Bridge & Swarm Djupintegration - Väntar)
