# 3c Fil-operativ Källkodsspecifikation (TCK-006)

## 1. Översikt över Förändringskedjan (Fas 2)

Följande filer är specificerade för källkodsändring i Fas 2 så snart godkännandetoken bekräftats:

---

### Fil 1: `src/features/gemini_live_swarm/agents/roleDefinitions.ts` (MODIFIERING)
- **Tillägg**:
  - Exportera typen `AgentForce = 'ATT_FORLIKAS' | 'ATT_FOLJA' | 'ATT_VANDA_OM' | 'SERIELL_MOTOR'`
  - Utöka `SwarmAgentRole` med krafter och `SERIELL_MOTOR` (eller union)
  - Lägg till fältet `force?: AgentForce` i `SwarmAgentConfig`
  - Lägg till `SERIELL_MOTOR` i `DEFAULT_SWARM_ROLES` med id `engine-serial-motor`, avatarColor `from-cyan-500 to-blue-600`
  - Lägg till `force` i existerande roller:
    - `ORCHESTRATOR` -> `force: 'ATT_FORLIKAS'`
    - `RESEARCHER` -> `force: 'ATT_FOLJA'`
    - `OUTREACH_WRITER` -> `force: 'ATT_FOLJA'`
    - `CRITIC` -> `force: 'ATT_VANDA_OM'`
  - Lägg till funktionerna `mapRoleToForce` och `mapForceToRole`

---

### Fil 2: `src/features/gemini_live_swarm/telemetry/telemetrySchema.ts` (MODIFIERING)
- **Tillägg**:
  - Exportera `AgentForceSchema`
  - Exportera `SerialStageSchema`
  - Exportera `SerialExecutionMetricSchema`
  - Utöka `AgentTelemetryMetricSchema` med valfritt `force: AgentForceSchema.optional()`
  - Utöka `SwarmTelemetrySnapshotSchema` med valfritt fält `serialExecution: SerialExecutionMetricSchema.optional()`

---

### Fil 3: `src/features/gemini_live_swarm/bus/swarmEventBus.ts` (MODIFIERING)
- **Tillägg**:
  - Hjälpmetod `publishSerialMetric(metric: SerialExecutionMetric): void` som paketerar mätvärdet i ett CloudEvents-kuvert (`type: swarm.serial.step.transition` / `swarm.serial.gate.evaluated`) med Zod-validering.

---

### Fil 4: `src/features/gemini_live_swarm/index.ts` (MODIFIERING)
- **Tillägg**:
  - Exportera de nya typerna och schemana:
    - `AgentForce`, `mapRoleToForce`, `mapForceToRole`
    - `AgentForceSchema`, `SerialStageSchema`, `SerialExecutionMetricSchema`
    - `SerialExecutionMetric`

---

### Fil 5: `src/__tests__/transient_TCK-006.test.ts` (NY TRANSIENT TESTFIL I FAS 2)
- **Tillägg**:
  - Testsvit (< 3s i minnet) som verifierar:
    1. Roll- och kraftdefinitioner inklusive `SERIELL_MOTOR`.
    2. Tvåvägsmappning mellan krafter och legacy roller.
    3. Zod-validering av `SerialExecutionMetricSchema`.
    4. Publicering och mottagning av `swarm.serial.*`-händelser via `SwarmEventBus`.

---

### Fil 6: `doc/TICKETS/TCK-006.md` & `doc/TICKETS.md` (UPPDATERING I FAS 2)
- Markera TCK-006 som `[VERIFIERAD]` efter godkända mikro-E2E-tester och flytt till regressionssviten.
