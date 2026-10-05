import fs from 'node:fs';
import path from 'node:path';
import { checkAstMetrics, checkNoProductionMocks } from '../../scripts/drivers/ts.js';
import {
  appendStreamChunkToTurns,
  computeSplitFromPointer,
  calculateRatioFromPointer,
  clampSnapState,
  stepSnapState,
  handleSwipeGesture,
  PANEL_TITLES,
  SWARM_INTENTS,
  INTENT_FORCE_MAP,
  AccumulatedTurn,
} from '../features/gemini_live_swarm/ui/splitPaneHelper.ts';

export async function runTransientTCK023Tests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];
  const rootDir = process.cwd();

  function assert(condition: boolean, msg: string) {
    if (!condition) throw new Error(msg);
  }

  // Test 1: Sammanhängande prosaströmning (Stream Concatenation) och tur-ackumulering
  try {
    let turns: AccumulatedTurn[] = [];

    // Chunk 1 från Att förlikas
    turns = appendStreamChunkToTurns(turns, 'Försoning och närhet ', 'Att förlikas', 'Harmonisk syntes', false);
    assert(turns.length === 1, 'Ska finnas 1 tur efter första chunk');
    assert(turns[0].text === 'Försoning och närhet ', 'Text ska matcha första chunk');
    assert(turns[0].isComplete === false, 'Turen ska inte vara markerad som klar');

    // Chunk 2 från samma talare i pågående tur
    turns = appendStreamChunkToTurns(turns, 'till den ideala människan.', 'Att förlikas', 'Harmonisk syntes', true);
    assert(turns.length === 1, 'Samma talare ska konkateneras till samma sammanhängande stycke utan radbrytning');
    assert(turns[0].text === 'Försoning och närhet till den ideala människan.', 'Text ska vara sömlöst ackumulerad');
    assert(turns[0].isComplete === true, 'Turen ska nu vara markerad som klar efter turnComplete');

    // Chunk 3 från ny talare (Att följa)
    turns = appendStreamChunkToTurns(turns, 'Vi följer kompassen.', 'Att följa', 'Rak orientering', false);
    assert(turns.length === 2, 'Ny talare eller efter avslutad tur ska skapa ett nytt block');
    assert(turns[1].agentRole === 'Att följa', 'Ny tur ska ha rollen Att följa');
    assert(turns[1].text === 'Vi följer kompassen.', 'Ny tur ska innehålla sin text');

    // Tom chunk utan completion ska inte modifiera array
    const beforeEmpty = turns.length;
    turns = appendStreamChunkToTurns(turns, '', 'Att följa', 'Rak orientering', false);
    assert(turns.length === beforeEmpty, 'Tom chunk ska inte skapa ny tur');

    results.push({ name: 'Sammanhängande prosaströmning och tur-ackumulering per talare', passed: true });
  } catch (err: any) {
    results.push({ name: 'Sammanhängande prosaströmning och tur-ackumulering per talare', passed: false, error: err.message });
  }

  // Test 2: Full Hitbox-beräkningar, split-förhållande och svep-gester
  try {
    // computeSplitFromPointer
    assert(computeSplitFromPointer(50, 0, 100) === 50, '50 på 0..100 ska ge 50%');
    assert(computeSplitFromPointer(10, 0, 100) === 10, '10 på 0..100 ska ge 10%');
    assert(computeSplitFromPointer(-20, 0, 100) === 0, 'Negativ offset ska clampas till 0%');
    assert(computeSplitFromPointer(120, 0, 100) === 100, 'Överskridande offset ska clampas till 100%');
    assert(computeSplitFromPointer(50, 0, 0) === 50, 'Nollstorlek ska falla tillbaka till 50%');

    // calculateRatioFromPointer för horisontell (landscape) och vertikal (portrait)
    const mockRect = { left: 100, top: 50, width: 400, height: 200 } as DOMRect;
    const ratioLandscape = calculateRatioFromPointer(300, 100, mockRect, 'landscape');
    assert(ratioLandscape === 50, `Landscape 300 på [100, 400] ska ge 50%, fick ${ratioLandscape}`);

    const ratioPortrait = calculateRatioFromPointer(200, 150, mockRect, 'portrait');
    assert(ratioPortrait === 50, `Portrait 150 på [50, 200] ska ge 50%, fick ${ratioPortrait}`);

    // clampSnapState och stepSnapState
    assert(clampSnapState(20) === 0, '20 ska clampas till 0');
    assert(clampSnapState(50) === 50, '50 ska clampas till 50');
    assert(clampSnapState(80) === 100, '80 ska clampas till 100');
    assert(stepSnapState(50, 'prev') === 0, '50 prev ska ge 0');
    assert(stepSnapState(50, 'next') === 100, '50 next ska ge 100');

    // handleSwipeGesture
    assert(handleSwipeGesture(0, -40, 'portrait', 50) === 0, 'Vertikal swipe upp ska ge 0');
    assert(handleSwipeGesture(0, 40, 'portrait', 50) === 100, 'Vertikal swipe ned ska ge 100');
    assert(handleSwipeGesture(-40, 0, 'landscape', 50) === 0, 'Horisontell swipe vänster ska ge 0');
    assert(handleSwipeGesture(40, 0, 'landscape', 50) === 100, 'Horisontell swipe höger ska ge 100');

    results.push({ name: 'Full hitbox pointer-beräkningar, orientation-ratio och svep-gester', passed: true });
  } catch (err: any) {
    results.push({ name: 'Full hitbox pointer-beräkningar, orientation-ratio och svep-gester', passed: false, error: err.message });
  }

  // Test 3: Panelnamn, Försoningsikoner och Sanering av statusprickar
  try {
    assert(PANEL_TITLES.LEFT === 'Dialog', 'Vänster panel ska heta Dialog');
    assert(PANEL_TITLES.RIGHT === 'Verktyg', 'Höger panel ska heta Verktyg');

    // De 3 försoningskrafterna
    assert(SWARM_INTENTS.length === 3, 'Exakt 3 försoningskrafter i dockan');
    const folja = SWARM_INTENTS.find((i) => i.id === 'REFLECT');
    const forlikas = SWARM_INTENTS.find((i) => i.id === 'CONSULT');
    const vandaOm = SWARM_INTENTS.find((i) => i.id === 'REMEMBER');

    assert(Boolean(folja && folja.label === 'Att följa' && folja.color === '#38bdf8' && folja.iconName === 'Compass'), 'Att följa ska ha Compass och #38bdf8');
    assert(Boolean(forlikas && forlikas.label === 'Att förlikas' && forlikas.color === '#facc15' && forlikas.iconName === 'ReconciliationRays'), 'Att förlikas ska ha Försoningsfamnen och #facc15');
    assert(Boolean(vandaOm && vandaOm.label === 'Att vända om' && vandaOm.color === '#a855f7' && vandaOm.iconName === 'RotateCcw'), 'Att vända om ska ha RotateCcw och #a855f7');

    // Verifiera att SplitPaneCanvas.tsx inte har gamla etiketter kvar
    const canvasPath = path.join(rootDir, 'src/features/gemini_live_swarm/ui/SplitPaneCanvas.tsx');
    const canvasContent = fs.readFileSync(canvasPath, 'utf8');
    assert(!canvasContent.includes('Agentchatt & Dialog'), 'SplitPaneCanvas.tsx får inte innehålla gamla Agentchatt & Dialog');
    assert(!canvasContent.includes('Exekveringskanvas'), 'SplitPaneCanvas.tsx får inte innehålla gamla Exekveringskanvas');
    assert(canvasContent.includes('Dialog'), 'SplitPaneCanvas.tsx ska rendera Dialog');
    assert(canvasContent.includes('Verktyg'), 'SplitPaneCanvas.tsx ska rendera Verktyg');
    assert(canvasContent.includes('ReconciliationRaysIcon'), 'SplitPaneCanvas.tsx ska inkludera Försoningsfamnen');

    results.push({ name: 'UI-harmonisering: Dialog, Verktyg, 3 försoningsikoner och sanerade etiketter', passed: true });
  } catch (err: any) {
    results.push({ name: 'UI-harmonisering: Dialog, Verktyg, 3 försoningsikoner och sanerade etiketter', passed: false, error: err.message });
  }

  // Test 4: AST-kontroll, radgränser och förbud mot produktionsmockar i berörda UI-filer
  try {
    const filesToAudit = [
      'src/features/gemini_live_swarm/ui/SplitPaneCanvas.tsx',
      'src/features/gemini_live_swarm/ui/splitPaneHelper.ts',
      'src/features/gemini_live_swarm/ui/SymbolCrown.tsx',
      'src/features/gemini_live_swarm/ui/ExecutionCard.tsx',
    ];

    for (const relPath of filesToAudit) {
      const fullPath = path.join(rootDir, relPath);
      const content = fs.readFileSync(fullPath, 'utf8');

      const astRes = checkAstMetrics(fullPath, content);
      assert(astRes.valid, `AST-fel i ${relPath}: ${astRes.error}`);

      const mockRes = checkNoProductionMocks(fullPath, content);
      assert(mockRes.valid, `Mock-fel i ${relPath}: ${mockRes.error}`);
    }

    results.push({ name: 'AST- och mock-regler för berörda UI-moduler (TCK-023)', passed: true });
  } catch (err: any) {
    results.push({ name: 'AST- och mock-regler för berörda UI-moduler (TCK-023)', passed: false, error: err.message });
  }

  return results;
}
