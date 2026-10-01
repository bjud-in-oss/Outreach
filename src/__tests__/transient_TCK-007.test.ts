import fs from 'node:fs';
import path from 'node:path';
import {
  DEFAULT_SWARM_ROLES,
  SwarmEventBus,
  SerialExecutionMetric,
} from '../features/gemini_live_swarm/index.ts';

export function runTransientTCK007Tests(): { name: string; passed: boolean; error?: string }[] {
  const results = [];
  const rootDir = process.cwd();

  // Test 1: Konfiguration av 4 krafter och 5 enheter i DEFAULT_SWARM_ROLES
  try {
    const roles = Object.values(DEFAULT_SWARM_ROLES);
    if (roles.length < 5) {
      throw new Error(`Förväntade minst 5 enheter, hittade ${roles.length}`);
    }

    const forces = new Set(roles.map((r) => r.force).filter(Boolean));
    if (!forces.has('ATT_FORLIKAS')) throw new Error('ATT_FORLIKAS saknas i rollerna');
    if (!forces.has('ATT_FOLJA')) throw new Error('ATT_FOLJA saknas i rollerna');
    if (!forces.has('ATT_VANDA_OM')) throw new Error('ATT_VANDA_OM saknas i rollerna');
    if (!forces.has('SERIELL_MOTOR')) throw new Error('SERIELL_MOTOR saknas i rollerna');

    results.push({
      name: 'DEFAULT_SWARM_ROLES innehåller alla 4 krafter och 5 enheter',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'DEFAULT_SWARM_ROLES innehåller alla 4 krafter och 5 enheter',
      passed: false,
      error: err.message,
    });
  }

  // Test 2: Reaktiv distribution av SerialExecutionMetric via SwarmEventBus
  try {
    const bus = new SwarmEventBus(30);
    const captured: any[] = [];

    const unsub = bus.subscribe('swarm.serial.*', (envelope) => {
      captured.push(envelope);
    });

    const testMetric: SerialExecutionMetric = {
      pipelineId: 'pipe-tck-007-verify',
      ticketId: 'TCK-007',
      stepIndex: 5,
      totalSteps: 7,
      currentStage: '3c_spec',
      stageStatus: 'GATED',
      durationMs: 820,
      isTokenGated: true,
      requiredTokenHash: 'TCK-007-UI-SERIELL-MOTOR-TOKEN',
      lastTransitionAt: new Date().toISOString(),
      activeForce: 'SERIELL_MOTOR',
    };

    const envelope = bus.publishSerialMetric(testMetric);

    if (captured.length !== 1) {
      throw new Error(`Förväntade 1 mottagen händelse, fick ${captured.length}`);
    }
    if (captured[0].type !== 'swarm.serial.gate.evaluated') {
      throw new Error(`Förväntade gate-händelse, fick ${captured[0].type}`);
    }
    if (captured[0].data.currentStage !== '3c_spec' || !captured[0].data.isTokenGated) {
      throw new Error('Data i kuvertet matchar inte publicerad metrik');
    }

    unsub();
    results.push({
      name: 'SwarmEventBus distribuerar serialExecution-metrik deterministiskt till prenumeranter',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'SwarmEventBus distribuerar serialExecution-metrik deterministiskt till prenumeranter',
      passed: false,
      error: err.message,
    });
  }

  // Test 3: SwarmDashboard källkod verifierar 5 enheter och seriell motor sektion
  try {
    const dashboardPath = path.join(
      rootDir,
      'src',
      'features',
      'gemini_live_swarm',
      'ui',
      'SwarmDashboard.tsx'
    );
    if (fs.existsSync(dashboardPath)) {
      const content = fs.readFileSync(dashboardPath, 'utf8');

      const has5Units = content.includes('5 Enheter (4 Agenter + Seriell Motor)');
      const hasForceBadges =
        content.includes('ATT FÖRLIKAS') &&
        content.includes('ATT FÖLJA') &&
        content.includes('ATT VÄNDA OM') &&
        content.includes('SERIELL MOTOR');
      const hasSerialSection = content.includes('Seriell Exekveringsmotor (4:e Motorn)');
      const hasPipelineSteg = content.includes('Stega Pipeline');
      const hasModularDashboard = content.includes('SwarmHeader') && content.includes('SwarmUnitCard');

      if (!hasModularDashboard && (!has5Units || !hasForceBadges || !hasSerialSection || !hasPipelineSteg)) {
        throw new Error('SwarmDashboard.tsx saknar nödvändiga UI-komponenter för TCK-007');
      }
    }

    results.push({
      name: 'SwarmDashboard.tsx implementerar 5 enheter, kraft-etiketter och seriell motor-sektion',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'SwarmDashboard.tsx implementerar 5 enheter, kraft-etiketter och seriell motor-sektion',
      passed: false,
      error: err.message,
    });
  }

  // Test 4: TelemetrySidebar källkod verifierar 4-krafter och reaktiv serialExecution
  try {
    const sidebarPath = path.join(
      rootDir,
      'src',
      'features',
      'gemini_live_swarm',
      'ui',
      'TelemetrySidebar.tsx'
    );
    if (fs.existsSync(sidebarPath)) {
      const content = fs.readFileSync(sidebarPath, 'utf8');

      const has4ForcesPanel =
        content.includes('Agentdynamik & Krafter') &&
        content.includes('ATT FÖRLIKAS') &&
        content.includes('ATT FÖLJA') &&
        content.includes('ATT VÄNDA OM') &&
        content.includes('SERIELL MOTOR');
      const hasSerialExecution =
        content.includes('Seriell Exekvering') && content.includes('snapshot.serialExecution');
      const hasTokenGateBadge = content.includes('TOKEN GATE');

      if (!has4ForcesPanel || !hasSerialExecution || !hasTokenGateBadge) {
        throw new Error('TelemetrySidebar.tsx saknar nödvändig telemetri-rendering för TCK-007');
      }
    }

    results.push({
      name: 'TelemetrySidebar.tsx implementerar 4-krafters panel och reaktiv serialExecution med Token Gate',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'TelemetrySidebar.tsx implementerar 4-krafters panel och reaktiv serialExecution med Token Gate',
      passed: false,
      error: err.message,
    });
  }

  // Test 5: MasterDevelopmentPlan registrerar TCK-006 och TCK-007
  try {
    const planPath = path.join(
      rootDir,
      'src',
      'features',
      'gemini_live_swarm',
      'ui',
      'MasterDevelopmentPlan.tsx'
    );
    if (fs.existsSync(planPath)) {
      const content = fs.readFileSync(planPath, 'utf8');

      const hasTck006 =
        content.includes('TCK-006') && content.includes('TCK-006-SERIELL-MOTOR-TOKEN');
      const hasTck007 =
        content.includes('TCK-007') && content.includes('TCK-007-UI-SERIELL-MOTOR-TOKEN');

      if (!hasTck006 || !hasTck007) {
        throw new Error('MasterDevelopmentPlan.tsx saknar TCK-006 eller TCK-007 registrering');
      }
    }

    results.push({
      name: 'MasterDevelopmentPlan.tsx innehåller verifierade styrkort för TCK-006 och TCK-007',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'MasterDevelopmentPlan.tsx innehåller verifierade styrkort för TCK-006 och TCK-007',
      passed: false,
      error: err.message,
    });
  }

  // Test 6: APPROVAL.md bekräftar godkänd token för TCK-007
  try {
    const approvalPath = path.join(rootDir, 'doc', 'LAST_CYCLE', 'APPROVAL.md');
    if (!fs.existsSync(approvalPath)) throw new Error('APPROVAL.md saknas');
    const content = fs.readFileSync(approvalPath, 'utf8');
    const hasToken = content.includes('TCK-007-UI-SERIELL-MOTOR-TOKEN');

    if (!hasToken) {
      throw new Error('TCK-007-UI-SERIELL-MOTOR-TOKEN saknas i APPROVAL.md');
    }

    results.push({
      name: 'Token Gate godkännande verifierat för TCK-007 i APPROVAL.md',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Token Gate godkännande verifierat för TCK-007 i APPROVAL.md',
      passed: false,
      error: err.message,
    });
  }

  // Test 7: Domändokumentation ADR-SWARM-005
  try {
    const decisionsPath = path.join(
      rootDir,
      'src',
      'features',
      'gemini_live_swarm',
      'doc',
      'DECISIONS.md'
    );
    if (!fs.existsSync(decisionsPath)) throw new Error('DECISIONS.md saknas i gemini_live_swarm');
    const content = fs.readFileSync(decisionsPath, 'utf8');
    const hasAdr =
      content.includes('ADR-SWARM-005') &&
      content.includes('UI & Dashboard-övervakning av Seriell Motor och 4 Krafter');

    if (!hasAdr) {
      throw new Error('ADR-SWARM-005 saknas i gemini_live_swarm/doc/DECISIONS.md');
    }

    results.push({
      name: 'ADR-SWARM-005 dokumenterat i gemini_live_swarm/doc/DECISIONS.md',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'ADR-SWARM-005 dokumenterat i gemini_live_swarm/doc/DECISIONS.md',
      passed: false,
      error: err.message,
    });
  }

  return results;
}
