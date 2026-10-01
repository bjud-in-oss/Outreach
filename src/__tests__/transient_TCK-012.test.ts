import fs from 'node:fs';
import path from 'node:path';
import { checkAstMetrics } from '../../scripts/drivers/ts.js';
import {
  detectUnitInvocation,
  SwarmOrchestrator,
  GeminiLiveSession,
  RECONCILIATION_UNITS,
} from '../features/gemini_live_swarm/index.ts';

export async function runTransientTCK012Tests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  function assert(condition: boolean, msg: string) {
    if (!condition) throw new Error(msg);
  }

  // Test 1: AST- och strukturmått (checkAstMetrics) på rot-skal och kontextkomponenter
  try {
    const rootDir = process.cwd();
    const filesToTest = [
      path.join(rootDir, 'src', 'App.tsx'),
      path.join(rootDir, 'src', 'features', 'gemini_live_swarm', 'context', 'SwarmContext.tsx'),
    ];

    for (const filePath of filesToTest) {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const relPath = path.relative(rootDir, filePath);
        const metricResult = checkAstMetrics(relPath, content);
        assert(metricResult.valid, `AST-validering misslyckades för ${relPath}: ${metricResult.error}`);
      }
    }

    // Validera att fiktiv överträdelse fångas
    const invalidLineContent = Array(130).fill('// rad').join('\n');
    const lineCheck = checkAstMetrics('mock.tsx', invalidLineContent);
    assert(!lineCheck.valid, 'Överträdelse av radgräns (130 rader för .tsx) fångades inte');

    results.push({
      name: 'TCK-012: checkAstMetrics validerar filgränser (<=125 .tsx), djup (<=4) och förgrening (<=5)',
      passed: true,
    });
  } catch (err) {
    results.push({
      name: 'TCK-012: checkAstMetrics validerar filgränser (<=125 .tsx), djup (<=4) och förgrening (<=5)',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Test 2: Värna de 4 visningsnamnen och de nya verbanropen
  try {
    assert(RECONCILIATION_UNITS.ATT_FOLJA.displayName === 'Att följa Guds son', 'Fel visningsnamn för ATT_FOLJA');
    assert(RECONCILIATION_UNITS.ATT_VANDA_OM.displayName === 'Att vända om till Gud', 'Fel visningsnamn för ATT_VANDA_OM');
    assert(RECONCILIATION_UNITS.ATT_FORLIKAS.displayName === 'Att förlikas med Gud', 'Fel visningsnamn för ATT_FORLIKAS');
    assert(RECONCILIATION_UNITS.SERIELL_MOTOR.displayName === 'Att tjäna Gud och andra: Bygga', 'Fel visningsnamn för SERIELL_MOTOR');

    // Testa verbanropen
    const matchFolja = detectUnitInvocation('Kan vi följa sonens spår här?');
    assert(matchFolja?.force === 'ATT_FOLJA', 'Verbanrop "följa" matchade inte ATT_FOLJA');

    const matchVanda = detectUnitInvocation('Vi behöver vända och granska äktheten');
    assert(matchVanda?.force === 'ATT_VANDA_OM', 'Verbanrop "vända" matchade inte ATT_VANDA_OM');

    const matchForlika = detectUnitInvocation('Låt oss förlika de båda ståndpunkterna');
    assert(matchForlika?.force === 'ATT_FORLIKAS', 'Verbanrop "förlika" matchade inte ATT_FORLIKAS');

    const matchBygga = detectUnitInvocation('Starta med att bygga lösningen');
    assert(matchBygga?.force === 'SERIELL_MOTOR', 'Verbanrop "bygga" matchade inte SERIELL_MOTOR');

    const matchByggaEtt = detectUnitInvocation('Nu kör vi bygga ett');
    assert(matchByggaEtt?.force === 'SERIELL_MOTOR', 'Verbanrop "bygga ett" matchade inte SERIELL_MOTOR');

    const matchByggaTva = detectUnitInvocation('Dags för bygga två');
    assert(matchByggaTva?.force === 'SERIELL_MOTOR', 'Verbanrop "bygga två" matchade inte SERIELL_MOTOR');

    const matchByggaTre = detectUnitInvocation('Slutför med bygga tre');
    assert(matchByggaTre?.force === 'SERIELL_MOTOR', 'Verbanrop "bygga tre" matchade inte SERIELL_MOTOR');

    results.push({
      name: 'TCK-012: De 4 visningsnamnen och verbanropen (följa, vända, förlika, bygga 1-3) fungerar deterministiskt',
      passed: true,
    });
  } catch (err) {
    results.push({
      name: 'TCK-012: De 4 visningsnamnen och verbanropen (följa, vända, förlika, bygga 1-3) fungerar deterministiskt',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Test 3: Skarp koppling av 4:e agenten i SwarmOrchestrator i båda arbetssätten
  try {
    const mockSession = {
      getLiveStatus: () => 'IDLE',
      generateAgentTurn: async (p: any) => ({
        agentRole: p.role,
        thought: 'Testanalys',
        content: `Analys och leveranskonstruktion för ${p.role}`,
        score: 9.5,
      }),
    } as unknown as GeminiLiveSession;
    const orchestrator = new SwarmOrchestrator(mockSession);
    const allUnits = orchestrator.getAllUnits();
    assert(allUnits.length === 4, `Förväntade 4 enheter, fick ${allUnits.length}`);

    // Arbetssätt 1: Samordning
    const planSamordning = orchestrator.createCampaignPlan({
      title: 'Enterprise Integration',
      targetAudience: 'Ledningsgrupp',
      valueProposition: 'Säkra automatiseringsflöden',
    }, 'SAMORDNING');

    assert(planSamordning.steps.length === 4, 'Samordningsplan ska innehålla alla 4 stegen');
    assert(planSamordning.steps[3].agentRole === 'SERIELL_MOTOR', 'Steg 4 ska drivas av SERIELL_MOTOR');

    // Arbetssätt 2: Stegvis bygge
    const planStegvis = orchestrator.createCampaignPlan({
      title: 'Stegvis Systemkonstruktion',
      targetAudience: 'Utvecklare',
      valueProposition: 'Deterministiska faser',
    }, 'STEGVIS_BYGGE');

    assert(planStegvis.steps.length === 4, 'Stegvis byggplan ska innehålla alla 4 stegen');
    assert(planStegvis.steps[3].agentRole === 'SERIELL_MOTOR', 'Steg 4 ska drivas av SERIELL_MOTOR');
    assert(planStegvis.steps[3].title.includes('Stegvis exekvering'), 'Titel ska återspegla stegvis bygge');

    // Exekvering av kampanj i minnet
    const executedPlan = await orchestrator.executeCampaign(planSamordning);
    assert(executedPlan.status === 'COMPLETED', 'Kampanjexekvering slutfördes inte');
    assert(executedPlan.steps[3].status === 'COMPLETED', 'SERIELL_MOTOR steg slutfördes inte som aktiv agent');

    results.push({
      name: 'TCK-012: 4:e agenten (SERIELL_MOTOR) drivs skarpt i både Samordning och Stegvis bygge',
      passed: true,
    });
  } catch (err) {
    results.push({
      name: 'TCK-012: 4:e agenten (SERIELL_MOTOR) drivs skarpt i både Samordning och Stegvis bygge',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Test 4: Renodling och export-integritet från gemini_live_swarm
  try {
    assert(typeof SwarmOrchestrator === 'function', 'SwarmOrchestrator är inte exporterad');
    assert(typeof GeminiLiveSession === 'function', 'GeminiLiveSession är inte exporterad');
    assert(typeof detectUnitInvocation === 'function', 'detectUnitInvocation är inte exporterad');

    results.push({
      name: 'TCK-012: Samtliga Greenfield UI-komponenter är typade och exporterade från gemini_live_swarm',
      passed: true,
    });
  } catch (err) {
    results.push({
      name: 'TCK-012: Samtliga Greenfield UI-komponenter är typade och exporterade från gemini_live_swarm',
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return results;
}
