# 2b Modellera: Datamodeller och Kontraktsarkitektur (TCK-006)

## 1. Typmodeller & Kontrakt

### 1.1 Agentkrafter och Roller (`roleDefinitions.ts`)
```typescript
// SI v10.0 Krafter
export type AgentForce = 'ATT_FORLIKAS' | 'ATT_FOLJA' | 'ATT_VANDA_OM' | 'SERIELL_MOTOR';

// Bakåtkompatibel union för roller
export type SwarmAgentRole =
  | 'ORCHESTRATOR'
  | 'RESEARCHER'
  | 'OUTREACH_WRITER'
  | 'CRITIC'
  | 'SERIELL_MOTOR'
  | 'ATT_FORLIKAS'
  | 'ATT_FOLJA'
  | 'ATT_VANDA_OM';

export interface SwarmAgentConfig {
  id: string;
  name: string;
  role: SwarmAgentRole;
  force?: AgentForce;
  systemInstruction: string;
  avatarColor: string;
  status: 'IDLE' | 'THINKING' | 'EXECUTING_TOOL' | 'DONE' | 'ERROR';
  currentThought?: string;
}
```

#### Mappningsfunktioner
- `mapRoleToForce(role: SwarmAgentRole): AgentForce`:
  - `'ORCHESTRATOR' | 'ATT_FORLIKAS'` -> `'ATT_FORLIKAS'`
  - `'RESEARCHER' | 'OUTREACH_WRITER' | 'ATT_FOLJA'` -> `'ATT_FOLJA'`
  - `'CRITIC' | 'ATT_VANDA_OM'` -> `'ATT_VANDA_OM'`
  - `'SERIELL_MOTOR'` -> `'SERIELL_MOTOR'`
- `mapForceToRole(force: AgentForce): SwarmAgentRole`:
  - `'ATT_FORLIKAS'` -> `'ORCHESTRATOR'`
  - `'ATT_FOLJA'` -> `'RESEARCHER'`
  - `'ATT_VANDA_OM'` -> `'CRITIC'`
  - `'SERIELL_MOTOR'` -> `'SERIELL_MOTOR'`

### 1.2 Seriell Motor Standardkonfiguration i `DEFAULT_SWARM_ROLES`
```typescript
SERIELL_MOTOR: {
  id: 'engine-serial-motor',
  name: 'Seriell Exekveringsmotor (Pipeline Engine)',
  role: 'SERIELL_MOTOR',
  force: 'SERIELL_MOTOR',
  systemInstruction:
    'Du är systemets 4:e motor. Du garanterar deterministisk sekvensering, fasövergångar (1a -> 1b -> 2e -> 3c), beräknar körtidsmetrik och upprätthåller Token Gate-skydd.',
  avatarColor: 'from-cyan-500 to-blue-600',
  status: 'IDLE',
}
```

---

## 2. Telemetrischemamodellering (`telemetrySchema.ts`)

### 2.1 Zod-scheman för Krafter & Seriell Metrik
```typescript
export const AgentForceSchema = z.enum([
  'ATT_FORLIKAS',
  'ATT_FOLJA',
  'ATT_VANDA_OM',
  'SERIELL_MOTOR',
]);

export const SerialStageSchema = z.enum([
  '1a_forsta',
  '1b_kartlagga',
  '2a_avgransa',
  '2b_modellera',
  '2e_syntetisera',
  '3c_spec',
  'e2e_verify',
]);

export const SerialExecutionMetricSchema = z.object({
  pipelineId: z.string(),
  ticketId: z.string(),
  stepIndex: z.number().int().nonnegative(),
  totalSteps: z.number().int().positive(),
  currentStage: SerialStageSchema,
  stageStatus: z.enum(['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'GATED']),
  durationMs: z.number().nonnegative(),
  isTokenGated: z.boolean(),
  requiredTokenHash: z.string().optional(),
  lastTransitionAt: z.string(),
  activeForce: AgentForceSchema,
});
```

---

## 3. Händelsestruktur på SwarmEventBus (`swarm.serial.*`)

Händelser publiceras som CloudEvents-kuvert:
- `swarm.serial.pipeline.started`: Start av seriell pipelinekörning.
- `swarm.serial.stage.transition`: Övergång mellan stadier (t.ex. 1b -> 2e).
- `swarm.serial.gate.evaluated`: Evaluering av Token Gate (Paus vid Steg 3c).
- `swarm.serial.step.completed`: Slutförande av enskilt steg.
- `swarm.serial.pipeline.completed`: Hela pipelinen framgångsrikt verifierad.
