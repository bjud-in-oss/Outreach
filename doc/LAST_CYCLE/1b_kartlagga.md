# 1b Kartlägga: Agentkrafter och Seriell Motor (TCK-006)

## 1. Kartläggning av Källkodsartefakter inom `gemini_live_swarm`

### Berörda Filer och Beroendekedja
1. **`src/features/gemini_live_swarm/agents/roleDefinitions.ts`**:
   - Nuvarande roller: `ORCHESTRATOR`, `RESEARCHER`, `OUTREACH_WRITER`, `CRITIC`.
   - Tillägg:
     - Typ `AgentForce`: `'ATT_FORLIKAS' | 'ATT_FOLJA' | 'ATT_VANDA_OM' | 'SERIELL_MOTOR'`
     - Fältet `force?: AgentForce` i `SwarmAgentConfig`.
     - Ny konfiguration för `SERIELL_MOTOR`:
       - `id`: `'engine-serial-motor'`
       - `name`: `'Seriell Exekveringsmotor (Pipeline Engine)'`
       - `role`: `'SERIELL_MOTOR'` (utökad union för `SwarmAgentRole` eller mapped force)
       - `force`: `'SERIELL_MOTOR'`
       - `systemInstruction`: Deterministisk pipelineexekvering med fasövergångar och noll tillståndskonflikter.
     - Hjälpfunktioner: `mapRoleToForce()`, `mapForceToRole()`.

2. **`src/features/gemini_live_swarm/telemetry/telemetrySchema.ts`**:
   - `AgentForceSchema`: `z.enum(['ATT_FORLIKAS', 'ATT_FOLJA', 'ATT_VANDA_OM', 'SERIELL_MOTOR'])`
   - `SerialStageSchema`: `z.enum(['1a_forsta', '1b_kartlagga', '2a_avgransa', '2b_modellera', '2e_syntetisera', '3c_spec', 'e2e_verify'])`
   - `SerialExecutionMetricSchema`:
     - `stepIndex`: `z.number().int().nonnegative()`
     - `currentStage`: `SerialStageSchema`
     - `stageStatus`: `z.enum(['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'GATED'])`
     - `durationMs`: `z.number().nonnegative()`
     - `isTokenGated`: `z.boolean()`
     - `requiredTokenHash`: `z.string().optional()`
     - `lastTransitionAt`: `z.string()`
   - Utökning av `SwarmTelemetrySnapshotSchema`:
     - Valfritt fält `serialExecution?: SerialExecutionMetricSchema` för telemetriavläsning.

3. **`src/features/gemini_live_swarm/bus/swarmEventBus.ts`**:
   - Stöd för serial-mönster:
     - `swarm.serial.pipeline.started`
     - `swarm.serial.step.transition`
     - `swarm.serial.step.completed`
     - `swarm.serial.gate.evaluated`
     - `swarm.serial.pipeline.completed`
   - Metod i `SwarmEventBus` eller hjälpklass för att publicera strukturerade seriella händelser.

4. **`src/features/gemini_live_swarm/index.ts`**:
   - Exportera alla nya typer och scheman: `AgentForce`, `AgentForceSchema`, `SerialExecutionMetric`, `SerialExecutionMetricSchema`, `SerialStageSchema`, `mapRoleToForce`, `mapForceToRole`.

5. **`src/__tests__/transient_TCK-006.test.ts` (Fas 2)**:
   - Validerar integrationen i minnet (< 3s):
     - Agentkrafter och mappning mot roller.
     - Skapande och exekvering av seriella händelseflöden via `SwarmEventBus`.
     - Zod-validering av `SerialExecutionMetricSchema` och `SwarmTelemetrySnapshotSchema`.

---

## 2. Fas 1 Deklaration

```json
{
  "status": "PLANNING_FAS_1",
  "current_domain": "src/features/gemini_live_swarm/",
  "next_step": "2e_syntetisera",
  "ticket_id": "TCK-006",
  "active_skill": "gemini-live-api-dev",
  "active_vectors": [
    "agent_forces_mapping",
    "serial_motor_engine",
    "telemetry_zod_contracts",
    "event_bus_pipeline_events",
    "backward_compatibility"
  ]
}
```
