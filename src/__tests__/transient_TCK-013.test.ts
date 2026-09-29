import { checkNoProductionMocks } from '../../scripts/drivers/ts.js';
import { GeminiLiveSession } from '../features/gemini_live_swarm/session/geminiLiveSession.ts';
import { GoogleDriveClient } from '../features/google_drive_sync/api/driveClient.ts';
import { RECONCILIATION_UNITS } from '../features/gemini_live_swarm/agents/roleDefinitions.ts';
import {
  SwarmOrchestrator,
  MAX_CONCURRENT_AGENTS,
} from '../features/gemini_live_swarm/coordinator/swarmOrchestrator.ts';
import { SwarmEventBus } from '../features/gemini_live_swarm/bus/swarmEventBus.ts';

export async function runTransientTCK013Tests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  function assert(condition: boolean, msg: string) {
    if (!condition) throw new Error(msg);
  }

  // Test 1: Fail-Fast & AST-Miljöspärr förkastar produktionsmockar
  try {
    const mockCode1 = 'const isTestMode = true;\nexport const x = 1;';
    const res1 = checkNoProductionMocks('src/features/gemini_live_swarm/test.ts', mockCode1);
    assert(!res1.valid && res1.error?.includes('isTestMode') === true, 'isTestMode fångades inte');

    const mockCode2 = 'function generateDeterministicFallback() { return {}; }';
    const res2 = checkNoProductionMocks('src/features/gemini_live_swarm/test.ts', mockCode2);
    assert(!res2.valid && res2.error?.includes('generateDeterministicFallback') === true, 'generateDeterministicFallback fångades inte');

    const mockCode3 = 'return "mock-folder-temp";';
    const res3 = checkNoProductionMocks('src/features/google_drive_sync/test.ts', mockCode3);
    assert(!res3.valid && res3.error?.includes('mock-folder') === true, 'mock-folder fångades inte');

    const allowedInTest = checkNoProductionMocks('src/__tests__/dummy.test.ts', mockCode1);
    assert(allowedInTest.valid === true, 'Testfiler i src/__tests__/ ska inte blockeras');

    results.push({
      name: 'TCK-013: Fail-Fast & AST-Miljöspärr blockerar mockar under src/features/',
      passed: true,
    });
  } catch (err) {
    results.push({
      name: 'TCK-013: Fail-Fast & AST-Miljöspärr blockerar mockar under src/features/',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Test 2: GeminiLiveSession och GoogleDriveClient Fail-Fast
  try {
    const bus = new SwarmEventBus();
    let haltedEventReceived = false;
    bus.subscribe('swarm.live.session.halted', () => {
      haltedEventReceived = true;
    });

    const session = new GeminiLiveSession('', bus);
    assert(session.getLiveStatus() === 'HALTED', 'Status ska vara HALTED utan nyckel');
    assert(haltedEventReceived, 'swarm.live.session.halted händelse mottogs inte');

    let turnThrew = false;
    try {
      await session.generateAgentTurn({ role: 'ATT_FOLJA', systemInstruction: 'x', prompt: 'y' });
    } catch {
      turnThrew = true;
    }
    assert(turnThrew, 'generateAgentTurn kastade inte fel i HALTED-läge');

    const driveClient = new GoogleDriveClient();
    assert(driveClient.hasValidToken() === false, 'hasValidToken ska vara false utan token');

    let driveThrew = false;
    try {
      await driveClient.ensureFolder('TestFolder');
    } catch {
      driveThrew = true;
    }
    assert(driveThrew, 'ensureFolder kastade inte fel utan token');

    results.push({
      name: 'TCK-013: GeminiLiveSession & GoogleDriveClient Fail-Fast omedelbart vid saknad nyckel/token',
      passed: true,
    });
  } catch (err) {
    results.push({
      name: 'TCK-013: GeminiLiveSession & GoogleDriveClient Fail-Fast omedelbart vid saknad nyckel/token',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Test 3: 100% UI-namnharmonisering
  try {
    assert(RECONCILIATION_UNITS.SERIELL_MOTOR.displayName === 'Att tjäna Gud och andra: Bygga', 'Fel visningsnamn för enhet 4');
    assert(RECONCILIATION_UNITS.ATT_FOLJA.displayName === 'Att följa Guds son', 'Fel visningsnamn för enhet 1');
    assert(RECONCILIATION_UNITS.ATT_VANDA_OM.displayName === 'Att vända om till Gud', 'Fel visningsnamn för enhet 2');
    assert(RECONCILIATION_UNITS.ATT_FORLIKAS.displayName === 'Att förlikas med Gud', 'Fel visningsnamn för enhet 3');

    results.push({
      name: 'TCK-013: 100% UI-namnharmonisering (Att tjäna Gud och andra: Bygga)',
      passed: true,
    });
  } catch (err) {
    results.push({
      name: 'TCK-013: 100% UI-namnharmonisering (Att tjäna Gud och andra: Bygga)',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Test 4: Kapacitetsspärr Max 3 agenter
  try {
    assert(MAX_CONCURRENT_AGENTS === 3, 'MAX_CONCURRENT_AGENTS ska vara 3');
    const orchestrator = new SwarmOrchestrator();
    const activeAgents = orchestrator.getActiveAgents();
    assert(activeAgents.length <= 3, `För många aktiva agenter: ${activeAgents.length}`);

    results.push({
      name: 'TCK-013: Kapacitetsspärr begränsar samtidiga aktiva agenter till max 3',
      passed: true,
    });
  } catch (err) {
    results.push({
      name: 'TCK-013: Kapacitetsspärr begränsar samtidiga aktiva agenter till max 3',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Test 5: Autonom handoff-slinga med konsensus vid Token Gate (3c)
  try {
    const bus = new SwarmEventBus();
    const events: string[] = [];
    bus.subscribe('*', (env) => {
      events.push(env.type);
    });

    const orchestrator = new SwarmOrchestrator(undefined, undefined, bus);
    const stages = await orchestrator.triggerHandoffToBuilder('Bygg arkitekturspärr');

    assert(stages.length === 6, `Förväntade 6 steg fram till 3c, fick ${stages.length}`);
    assert(stages[5] === '3c_spec', 'Slutsteg ska vara 3c_spec');
    assert(events.includes('swarm.handoff.to_builder'), 'Saknar swarm.handoff.to_builder');
    assert(events.includes('swarm.serial.gate.evaluated'), 'Saknar swarm.serial.gate.evaluated');
    assert(events.includes('swarm.consensus.completed'), 'Saknar swarm.consensus.completed');

    results.push({
      name: 'TCK-013: Autonom handoff-slinga stegar fram till Token Gate (3c) och kör konsensus',
      passed: true,
    });
  } catch (err) {
    results.push({
      name: 'TCK-013: Autonom handoff-slinga stegar fram till Token Gate (3c) och kör konsensus',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return results;
}
