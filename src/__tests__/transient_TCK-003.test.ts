import fs from 'node:fs';
import path from 'node:path';
import { SwarmOrchestrator } from '../features/gemini_live_swarm/coordinator/swarmOrchestrator.ts';
import {
  getActiveAgentKrafter,
  getSerialMotorAgent,
} from '../features/gemini_live_swarm/agents/roleDefinitions.ts';
import { SwarmEventBus } from '../features/gemini_live_swarm/bus/swarmEventBus.ts';
import {
  SwarmTelemetrySnapshotSchema,
  DevelopmentTicketSchema,
} from '../features/gemini_live_swarm/telemetry/telemetrySchema.ts';
import { EventEnvelopeSchema } from '../shared/contracts/envelope.ts';

export async function runTransientTCK003Tests(): Promise<
  Array<{ name: string; passed: boolean; error?: string }>
> {
  const results: Array<{ name: string; passed: boolean; error?: string }> = [];
  const start = Date.now();

  // Test 1: Verifiera att de 3 Agentkrafterna och Seriell Motor är definierade
  try {
    const krafter = getActiveAgentKrafter();
    const serial = getSerialMotorAgent();

    const roles = krafter.map((k) => k.role);
    const hasAllKrafter =
      roles.includes('ATT_FORLIKAS') &&
      roles.includes('ATT_FOLJA') &&
      roles.includes('ATT_VANDA_OM');
    const hasSerial = serial.role === 'SERIELL_MOTOR';

    results.push({
      name: 'Agentkrafter (ATT_FORLIKAS, ATT_FOLJA, ATT_VANDA_OM) och SERIELL_MOTOR är definierade',
      passed: hasAllKrafter && hasSerial,
    });
  } catch (err: any) {
    results.push({
      name: 'Agentkrafter (ATT_FORLIKAS, ATT_FOLJA, ATT_VANDA_OM) och SERIELL_MOTOR är definierade',
      passed: false,
      error: err.message,
    });
  }

  // Test 2: Verifiera 4:e Seriella Motorn och dess obrutna fas-kedja (1a -> 1b -> 2e -> 3c -> 4)
  try {
    const orchestrator = new SwarmOrchestrator();
    const emittedEnvelopes: any[] = [];

    const serialResult = await orchestrator.executeSerialMotor(
      'TCK-003',
      'Test körning av obruten SI v10.0-kedja',
      undefined,
      (env) => {
        // Validera CloudEvents 1.0 schema
        EventEnvelopeSchema.parse(env);
        emittedEnvelopes.push(env);
      }
    );

    const phases = serialResult.phases.map((p) => p.phase);
    const hasAllPhases = ['1a', '1b', '2e', '3c', '4'].every((p) => phases.includes(p as any));
    const tokenValid = serialResult.tokenGenerated.includes('SERIELL-TCK003');

    results.push({
      name: 'Seriell Motor kör hela kedjan 1a ➔ 1b ➔ 2e ➔ 3c ➔ 4 linjärt (<3s) och avger giltiga CloudEvents',
      passed: hasAllPhases && tokenValid && emittedEnvelopes.length >= 5,
    });
  } catch (err: any) {
    results.push({
      name: 'Seriell Motor kör hela kedjan 1a ➔ 1b ➔ 2e ➔ 3c ➔ 4 linjärt (<3s) och avger giltiga CloudEvents',
      passed: false,
      error: err.message,
    });
  }

  // Test 3: SwarmEventBus publicerar och dirigerar kraft- och serie-händelser
  try {
    const bus = new SwarmEventBus(20);
    const caught: string[] = [];

    const unsub = bus.subscribe('swarm.kraft.*', (env) => {
      caught.push(env.type);
    });

    bus.publishKraftEvent('ATT_FORLIKAS', 'thinking', { note: '1a Wayfinder dialog' });
    bus.publishKraftEvent('ATT_FOLJA', 'completed', { note: 'Domänsyntes klar' });
    bus.publishSerialMotorEvent('1a', 'started', { note: 'Seriell pipeline' });

    unsub();

    results.push({
      name: 'SwarmEventBus publicerar och filtrerar kraft- och seriehändelser korrekt',
      passed: caught.length === 2 && caught[0] === 'swarm.kraft.att_forlikas.thinking',
    });
  } catch (err: any) {
    results.push({
      name: 'SwarmEventBus publicerar och filtrerar kraft- och seriehändelser korrekt',
      passed: false,
      error: err.message,
    });
  }

  // Test 4: Verifiera att Wayfinder SKILL.md finns under .agents/skills/wayfinder/
  try {
    const wayfinderPath = path.join(process.cwd(), '.agents', 'skills', 'wayfinder', 'SKILL.md');
    const exists = fs.existsSync(wayfinderPath);
    const content = exists ? fs.readFileSync(wayfinderPath, 'utf8') : '';
    const hasFrontmatter = content.includes('name: wayfinder');

    results.push({
      name: 'Wayfinder-skill är installerad under .agents/skills/wayfinder/SKILL.md',
      passed: exists && hasFrontmatter,
    });
  } catch (err: any) {
    results.push({
      name: 'Wayfinder-skill är installerad under .agents/skills/wayfinder/SKILL.md',
      passed: false,
      error: err.message,
    });
  }

  // Test 5: Standardisering av Domänbeslut under src/features/[modul]/doc/DECISIONS.md
  try {
    const modules = ['gemini_live_swarm', 'google_drive_sync', 'mcp_bridge', 'wal_logger'];
    const allHaveDecisions = modules.every((m) => {
      const p = path.join(process.cwd(), 'src', 'features', m, 'doc', 'DECISIONS.md');
      return fs.existsSync(p);
    });

    results.push({
      name: 'Alla FSD-moduler har standardiserat src/features/[modul]/doc/DECISIONS.md',
      passed: allHaveDecisions,
    });
  } catch (err: any) {
    results.push({
      name: 'Alla FSD-moduler har standardiserat src/features/[modul]/doc/DECISIONS.md',
      passed: false,
      error: err.message,
    });
  }

  const duration = Date.now() - start;
  results.push({
    name: `Mikro-E2E testsvit exekverades transient på under 3s (faktisk tid: ${duration}ms)`,
    passed: duration < 3000,
  });

  return results;
}
