import fs from 'node:fs';
import path from 'node:path';
import {
  DEFAULT_SWARM_ROLES,
  mapRoleToForce,
  mapForceToRole,
  SwarmEventBus,
  AgentForceSchema,
  SerialStageSchema,
  SerialExecutionMetricSchema,
  SerialExecutionMetric,
} from '../features/gemini_live_swarm/index.ts';

export function runTransientTCK006Tests(): { name: string; passed: boolean; error?: string }[] {
  const results = [];
  const rootDir = process.cwd();

  // Test 1: Roll- och kraftdefinitioner inklusive SERIELL_MOTOR
  try {
    const serialMotor = DEFAULT_SWARM_ROLES.SERIELL_MOTOR;
    if (!serialMotor) throw new Error('SERIELL_MOTOR saknas i DEFAULT_SWARM_ROLES');
    if (serialMotor.role !== 'SERIELL_MOTOR') throw new Error(`Fel roll: ${serialMotor.role}`);
    if (serialMotor.force !== 'SERIELL_MOTOR') throw new Error(`Fel force: ${serialMotor.force}`);
    if (serialMotor.id !== 'engine-serial-motor') throw new Error(`Fel id: ${serialMotor.id}`);

    // Kontrollera att legacy-rollerna har rätt SI v10.0-krafter kopplade
    if (DEFAULT_SWARM_ROLES.ORCHESTRATOR.force !== 'ATT_FORLIKAS') {
      throw new Error(`ORCHESTRATOR har fel force: ${DEFAULT_SWARM_ROLES.ORCHESTRATOR.force}`);
    }
    if (DEFAULT_SWARM_ROLES.RESEARCHER.force !== 'ATT_FOLJA') {
      throw new Error(`RESEARCHER har fel force: ${DEFAULT_SWARM_ROLES.RESEARCHER.force}`);
    }
    if (DEFAULT_SWARM_ROLES.OUTREACH_WRITER.force !== 'ATT_FOLJA') {
      throw new Error(`OUTREACH_WRITER har fel force: ${DEFAULT_SWARM_ROLES.OUTREACH_WRITER.force}`);
    }
    if (DEFAULT_SWARM_ROLES.CRITIC.force !== 'ATT_VANDA_OM') {
      throw new Error(`CRITIC har fel force: ${DEFAULT_SWARM_ROLES.CRITIC.force}`);
    }

    results.push({
      name: 'SERIELL_MOTOR och SI v10.0-krafter korrekt konfigurerade i DEFAULT_SWARM_ROLES',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'SERIELL_MOTOR och SI v10.0-krafter korrekt konfigurerade i DEFAULT_SWARM_ROLES',
      passed: false,
      error: err.message,
    });
  }

  // Test 2: Tvåvägsmappning mapRoleToForce & mapForceToRole
  try {
    if (mapRoleToForce('ORCHESTRATOR') !== 'ATT_FORLIKAS') throw new Error('ORCHESTRATOR -> ATT_FORLIKAS misslyckades');
    if (mapRoleToForce('RESEARCHER') !== 'ATT_FOLJA') throw new Error('RESEARCHER -> ATT_FOLJA misslyckades');
    if (mapRoleToForce('OUTREACH_WRITER') !== 'ATT_FOLJA') throw new Error('OUTREACH_WRITER -> ATT_FOLJA misslyckades');
    if (mapRoleToForce('CRITIC') !== 'ATT_VANDA_OM') throw new Error('CRITIC -> ATT_VANDA_OM misslyckades');
    if (mapRoleToForce('SERIELL_MOTOR') !== 'SERIELL_MOTOR') throw new Error('SERIELL_MOTOR -> SERIELL_MOTOR misslyckades');

    if (mapForceToRole('ATT_FORLIKAS') !== 'ORCHESTRATOR') throw new Error('ATT_FORLIKAS -> ORCHESTRATOR misslyckades');
    if (mapForceToRole('ATT_FOLJA') !== 'RESEARCHER') throw new Error('ATT_FOLJA -> RESEARCHER misslyckades');
    if (mapForceToRole('ATT_VANDA_OM') !== 'CRITIC') throw new Error('ATT_VANDA_OM -> CRITIC misslyckades');
    if (mapForceToRole('SERIELL_MOTOR') !== 'SERIELL_MOTOR') throw new Error('SERIELL_MOTOR -> SERIELL_MOTOR misslyckades');

    results.push({
      name: 'Tvåvägsmappning mellan krafter och roller fungerar deterministiskt',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Tvåvägsmappning mellan krafter och roller fungerar deterministiskt',
      passed: false,
      error: err.message,
    });
  }

  // Test 3: Zod-schemavalidering av krafter, faser och seriell metrik
  try {
    AgentForceSchema.parse('SERIELL_MOTOR');
    AgentForceSchema.parse('ATT_FORLIKAS');
    SerialStageSchema.parse('1a_forsta');
    SerialStageSchema.parse('3c_spec');

    const validMetric: SerialExecutionMetric = {
      pipelineId: 'pipe-tck-006-001',
      ticketId: 'TCK-006',
      stepIndex: 3,
      totalSteps: 5,
      currentStage: '3c_spec',
      stageStatus: 'GATED',
      durationMs: 1450,
      isTokenGated: true,
      requiredTokenHash: 'TCK-006-SERIELL-MOTOR-TOKEN',
      lastTransitionAt: new Date().toISOString(),
      activeForce: 'SERIELL_MOTOR',
    };

    const parsed = SerialExecutionMetricSchema.parse(validMetric);
    if (!parsed.isTokenGated || parsed.currentStage !== '3c_spec') {
      throw new Error('Felaktigt parsad metrik');
    }

    // Fail-fast test för ogiltig stadie
    let failedFast = false;
    try {
      SerialExecutionMetricSchema.parse({
        ...validMetric,
        currentStage: 'ogiltigt_steg_xyz' as any,
      });
    } catch {
      failedFast = true;
    }

    if (!failedFast) {
      throw new Error('Fail-Fast uteblev för ogiltigt stadium i SerialExecutionMetricSchema');
    }

    results.push({
      name: 'Zod-scheman för SerialExecutionMetric och AgentForce validerar strikt (Fail-Fast)',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Zod-scheman för SerialExecutionMetric och AgentForce validerar strikt (Fail-Fast)',
      passed: false,
      error: err.message,
    });
  }

  // Test 4: SwarmEventBus publicerar och tar emot swarm.serial.* med CloudEvents-kuvert
  try {
    const bus = new SwarmEventBus(20);
    const capturedEvents: any[] = [];

    const unsub = bus.subscribe('swarm.serial.*', (env) => {
      capturedEvents.push(env);
    });

    const metric: SerialExecutionMetric = {
      pipelineId: 'pipe-test-99',
      ticketId: 'TCK-006',
      stepIndex: 4,
      totalSteps: 5,
      currentStage: 'e2e_verify',
      stageStatus: 'COMPLETED',
      durationMs: 420,
      isTokenGated: false,
      lastTransitionAt: new Date().toISOString(),
      activeForce: 'SERIELL_MOTOR',
    };

    const envelope = bus.publishSerialMetric(metric);

    if (capturedEvents.length !== 1) {
      throw new Error(`Förväntade 1 händelse, fick ${capturedEvents.length}`);
    }
    if (capturedEvents[0].type !== 'swarm.serial.pipeline.completed') {
      throw new Error(`Fel händelsetyp: ${capturedEvents[0].type}`);
    }
    if (capturedEvents[0].source !== 'outreach/swarm/serial_motor') {
      throw new Error(`Fel källa: ${capturedEvents[0].source}`);
    }
    if (capturedEvents[0].data.pipelineId !== 'pipe-test-99') {
      throw new Error(`Fel data: ${JSON.stringify(capturedEvents[0].data)}`);
    }

    unsub();
    results.push({
      name: 'SwarmEventBus.publishSerialMetric kapslar in och sänder CloudEvents 1.0 korrekt',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'SwarmEventBus.publishSerialMetric kapslar in och sänder CloudEvents 1.0 korrekt',
      passed: false,
      error: err.message,
    });
  }

  // Test 5: APPROVAL.md bekräftar token för TCK-006
  try {
    const approvalPath = path.join(rootDir, 'doc', 'LAST_CYCLE', 'APPROVAL.md');
    const exists = fs.existsSync(approvalPath);
    if (!exists) throw new Error('APPROVAL.md saknas');
    const content = fs.readFileSync(approvalPath, 'utf8');
    const hasToken = content.includes('TCK-006-SERIELL-MOTOR-TOKEN');
    results.push({
      name: 'Token Gate godkännande verifierat för TCK-006 i APPROVAL.md',
      passed: exists && hasToken,
    });
  } catch (err: any) {
    results.push({
      name: 'Token Gate godkännande verifierat för TCK-006 i APPROVAL.md',
      passed: false,
      error: err.message,
    });
  }

  return results;
}
