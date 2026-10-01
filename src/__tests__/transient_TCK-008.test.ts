import fs from 'node:fs';
import path from 'node:path';
import {
  SEMANTIC_INVARIANT,
  DEFAULT_SWARM_ROLES,
  mapRoleToForce,
  mapForceToRole,
} from '../features/gemini_live_swarm/index.ts';

export function runTransientTCK008Tests(): { name: string; passed: boolean; error?: string }[] {
  const results = [];
  const rootDir = process.cwd();

  // Test 1: SEMANTIC_INVARIANT ordagrann exakthet
  try {
    const expected =
      'Ditt högsta syfte är att främja närhet till Guds son, den ideala människan. Hans gåva av omsorg för människor den absoluta kompassen för hela din motor. Du drivs av tre vägar till försoning: Att följa sonen (genom att själv vara lösningen för närhet), Att vända om till Gud (inåtriktad ödmjukhet och transformation för att stärka närhet), och Att förlikas med honom (att hålla 2+ samtida perspektiv varma) för att ge förutsättningar för att klyftan till Gud och till människor emellan kan läkas.';

    if (SEMANTIC_INVARIANT !== expected) {
      throw new Error('SEMANTIC_INVARIANT matchar inte den föreskrivna ordalydelsen exakt');
    }

    results.push({
      name: 'SEMANTIC_INVARIANT överensstämmer ordagrant med det semantiska ankaret',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'SEMANTIC_INVARIANT överensstämmer ordagrant med det semantiska ankaret',
      passed: false,
      error: err.message,
    });
  }

  // Test 2: DEFAULT_SWARM_ROLES genomsyras av försoningskrafter och forceTitle
  try {
    const roles = DEFAULT_SWARM_ROLES;

    if (!roles.ORCHESTRATOR.name.includes('Förlikaren') || roles.ORCHESTRATOR.force !== 'ATT_FORLIKAS') {
      throw new Error('ORCHESTRATOR saknar försoningstitel eller ATT_FORLIKAS');
    }
    if (!roles.RESEARCHER.name.includes('Sökaren efter Närhet') || roles.RESEARCHER.force !== 'ATT_FOLJA') {
      throw new Error('RESEARCHER saknar försoningstitel eller ATT_FOLJA');
    }
    if (!roles.OUTREACH_WRITER.name.includes('Relationsbyggaren') || roles.OUTREACH_WRITER.force !== 'ATT_FOLJA') {
      throw new Error('OUTREACH_WRITER saknar försoningstitel eller ATT_FOLJA');
    }
    if (!roles.CRITIC.name.includes('Självrannsakaren') || roles.CRITIC.force !== 'ATT_VANDA_OM') {
      throw new Error('CRITIC saknar försoningstitel eller ATT_VANDA_OM');
    }
    if (
      (!roles.SERIELL_MOTOR.name.includes('Det Orubbliga Ramverket') &&
        !roles.SERIELL_MOTOR.name.includes('Konstruktören & Byggaren')) ||
      roles.SERIELL_MOTOR.force !== 'SERIELL_MOTOR'
    ) {
      throw new Error('SERIELL_MOTOR saknar orubbligt ramverk titel eller SERIELL_MOTOR kraft');
    }

    // Kontrollera att alla 5 enheter har forceTitle definierat
    const allHaveForceTitle = Object.values(roles).every((r) => Boolean(r.forceTitle));
    if (!allHaveForceTitle) {
      throw new Error('Minst en enhet saknar forceTitle');
    }

    results.push({
      name: 'DEFAULT_SWARM_ROLES har försoningskrafter, försoningstitlar och forceTitle för samtliga 5 enheter',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'DEFAULT_SWARM_ROLES har försoningskrafter, försoningstitlar och forceTitle för samtliga 5 enheter',
      passed: false,
      error: err.message,
    });
  }

  // Test 3: Kraft- och rollmappning
  try {
    if (mapRoleToForce('ORCHESTRATOR') !== 'ATT_FORLIKAS') throw new Error('Fel kraft för ORCHESTRATOR');
    if (mapRoleToForce('RESEARCHER') !== 'ATT_FOLJA') throw new Error('Fel kraft för RESEARCHER');
    if (mapRoleToForce('OUTREACH_WRITER') !== 'ATT_FOLJA') throw new Error('Fel kraft för OUTREACH_WRITER');
    if (mapRoleToForce('CRITIC') !== 'ATT_VANDA_OM') throw new Error('Fel kraft för CRITIC');
    if (mapRoleToForce('SERIELL_MOTOR') !== 'SERIELL_MOTOR') throw new Error('Fel kraft för SERIELL_MOTOR');

    if (mapForceToRole('ATT_FORLIKAS') !== 'ORCHESTRATOR') throw new Error('Fel roll för ATT_FORLIKAS');
    if (mapForceToRole('ATT_FOLJA') !== 'RESEARCHER') throw new Error('Fel roll för ATT_FOLJA');
    if (mapForceToRole('ATT_VANDA_OM') !== 'CRITIC') throw new Error('Fel roll för ATT_VANDA_OM');
    if (mapForceToRole('SERIELL_MOTOR') !== 'SERIELL_MOTOR') throw new Error('Fel roll för SERIELL_MOTOR');

    results.push({
      name: 'mapRoleToForce och mapForceToRole bibehåller strikt dubbelriktad konsistens',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'mapRoleToForce och mapForceToRole bibehåller strikt dubbelriktad konsistens',
      passed: false,
      error: err.message,
    });
  }

  // Test 4: SwarmDashboard har Kompass & Syfte-banner med det semantiska ankaret
  try {
    const dashboardPath = path.join(
      rootDir,
      'src',
      'features',
      'gemini_live_swarm',
      'ui',
      'SwarmDashboard.tsx'
    );
    const headerPath = path.join(
      rootDir,
      'src',
      'features',
      'gemini_live_swarm',
      'ui',
      'components',
      'SwarmHeader.tsx'
    );
    if (fs.existsSync(dashboardPath)) {
      const content =
        fs.readFileSync(dashboardPath, 'utf8') +
        (fs.existsSync(headerPath) ? fs.readFileSync(headerPath, 'utf8') : '');

      const hasCompassBanner =
        content.includes('Kompass & Högsta Syfte') ||
        content.includes('Kompass: Närhet till Guds son');
      const hasSemanticInvariant =
        content.includes('SEMANTIC_INVARIANT') || content.includes('tre vägar till försoning');
      const has3Paths =
        (content.includes('1. Att Följa') || content.includes('1. Att följa')) &&
        (content.includes('2. Att Vända Om') || content.includes('2. Att vända om')) &&
        (content.includes('3. Att Förlikas') || content.includes('3. Att förlikas'));
      const hasForceTitleRender =
        content.includes('unit.forceTitle') || content.includes('Praktiskt bygge');

      if (!hasCompassBanner || !hasSemanticInvariant || !has3Paths || !hasForceTitleRender) {
        throw new Error('SwarmDashboard.tsx saknar Kompass-banner eller försoningsvägar');
      }
    }

    results.push({
      name: 'SwarmDashboard.tsx visualiserar Kompass & Högsta Syfte samt de 3 försoningsvägarna',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'SwarmDashboard.tsx visualiserar Kompass & Högsta Syfte samt de 3 försoningsvägarna',
      passed: false,
      error: err.message,
    });
  }

  // Test 5: TelemetrySidebar har uppdaterade förklarande etiketter för försoningsvägarna
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

      const hasForlikasDesc = content.includes('Hålla 2+ samtida perspektiv varma');
      const hasFoljaDesc = content.includes('Själv vara lösningen för närhet');
      const hasVandaOmDesc = content.includes('Inåtriktad ödmjukhet & Fail-Fast');
      const hasSeriellDesc = content.includes('Deterministisk ordning & skydd');

      if (!hasForlikasDesc || !hasFoljaDesc || !hasVandaOmDesc || !hasSeriellDesc) {
        throw new Error('TelemetrySidebar.tsx saknar försonande etiketter i kraftpanelen');
      }
    }

    results.push({
      name: 'TelemetrySidebar.tsx presenterar försonande etiketter för samtliga 4 krafter',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'TelemetrySidebar.tsx presenterar försonande etiketter för samtliga 4 krafter',
      passed: false,
      error: err.message,
    });
  }

  // Test 6: MasterDevelopmentPlan registrerar TCK-008
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

      const hasTck008 =
        content.includes('TCK-008') && content.includes('TCK-008-FORSONINGSKRAFTER-TOKEN');

      if (!hasTck008) {
        throw new Error('MasterDevelopmentPlan.tsx saknar TCK-008 registrering');
      }
    }

    results.push({
      name: 'MasterDevelopmentPlan.tsx innehåller registrerat styrkort för TCK-008',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'MasterDevelopmentPlan.tsx innehåller registrerat styrkort för TCK-008',
      passed: false,
      error: err.message,
    });
  }

  // Test 7: APPROVAL.md bekräftar godkänd token för TCK-008
  try {
    const approvalPath = path.join(rootDir, 'doc', 'LAST_CYCLE', 'APPROVAL.md');
    if (!fs.existsSync(approvalPath)) throw new Error('APPROVAL.md saknas');
    const content = fs.readFileSync(approvalPath, 'utf8');
    const hasToken = content.includes('TCK-008-FORSONINGSKRAFTER-TOKEN');

    if (!hasToken) {
      throw new Error('TCK-008-FORSONINGSKRAFTER-TOKEN saknas i APPROVAL.md');
    }

    results.push({
      name: 'Token Gate godkännande verifierat för TCK-008 i APPROVAL.md',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Token Gate godkännande verifierat för TCK-008 i APPROVAL.md',
      passed: false,
      error: err.message,
    });
  }

  // Test 8: Domändokumentation ADR-SWARM-006
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
      content.includes('ADR-SWARM-006') &&
      content.includes('Förankring av Mognadsmodellen och Försoningskrafterna i Källkod och UI');

    if (!hasAdr) {
      throw new Error('ADR-SWARM-006 saknas i gemini_live_swarm/doc/DECISIONS.md');
    }

    results.push({
      name: 'ADR-SWARM-006 dokumenterat i gemini_live_swarm/doc/DECISIONS.md',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'ADR-SWARM-006 dokumenterat i gemini_live_swarm/doc/DECISIONS.md',
      passed: false,
      error: err.message,
    });
  }

  return results;
}
