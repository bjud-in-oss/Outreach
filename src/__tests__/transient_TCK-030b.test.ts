import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AppShell } from '../features/gemini_live_swarm/ui/AppShell.tsx';
import {
  AccumulatedTurn,
  appendStreamChunkToTurns,
  extractTurnEventData,
} from '../features/gemini_live_swarm/ui/turnContainerHelper.ts';

export async function runTransientTCK030bTests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  // Scenario 1: 90% WAL-verifiering (Enhetlig Tursfär i RAM)
  try {
    let turns: AccumulatedTurn[] = [];

    // Strömma deltan från förlikas
    turns = appendStreamChunkToTurns(turns, 'Första delen av svaret ', 'Att förlikas', 'Harmonisk syntes', false);
    const chunk1Passed = turns.length === 1 && !turns[0].isComplete && turns[0].text === 'Första delen av svaret ';

    // Strömma nästa delta till samma tur och slutför
    turns = appendStreamChunkToTurns(turns, 'och slutgiltig försoning.', 'Att förlikas', 'Harmonisk syntes', true);
    const chunk2Passed = turns.length === 1 && turns[0].isComplete && turns[0].text === 'Första delen av svaret och slutgiltig försoning.';

    // Ny tur från människan
    turns = appendStreamChunkToTurns(turns, 'Tack, jag förstår nu.', 'Människan', 'Användarintention', true);
    const chunk3Passed = turns.length === 2 && turns[1].agentRole === 'Människan' && turns[1].isComplete;

    // Extrahera händelsedata från EventBus
    const extracted = extractTurnEventData({ text: 'Nytt event', agentRole: 'Att följa' }, 'swarm.session.text_delta');
    const extractPassed = extracted.text === 'Nytt event' && extracted.role === 'Att följa';

    results.push({
      name: 'TCK-030b Scenario 1: 90% WAL-verifiering - appendStreamChunkToTurns bygger och ackumulerar tursfären deterministiskt',
      passed: chunk1Passed && chunk2Passed && chunk3Passed && extractPassed,
    });
  } catch (err) {
    results.push({
      name: 'TCK-030b Scenario 1: 90% WAL-verifiering',
      passed: false,
      error: String(err),
    });
  }

  // Scenario 2: 10% Browserless/DOM E2E (Kognitiv Frigörelse i UI)
  try {
    const html = renderToStaticMarkup(React.createElement(AppShell));

    // Bekräfta att SplitPaneCanvas och delaren är helt borta ur DOM-trädet
    const noSplitDivider = !html.includes('split-pane-divider') && !html.includes('snap-toggle-button');
    const noToolSplitPane = !html.includes('>Verktyg</div>');

    // Bekräfta att den enhetliga tursfären renderas vertikalt
    const hasTurnSphere = html.includes('data-testid="turn-sphere-main"');
    const hasCrownZone = html.includes('permanent-crown-zone');

    results.push({
      name: 'TCK-030b Scenario 2: 10% Browserless E2E - AppShell renderar ren vertikal tursfär utan SplitPaneCanvas',
      passed: noSplitDivider && noToolSplitPane && hasTurnSphere && hasCrownZone,
    });
  } catch (err) {
    results.push({
      name: 'TCK-030b Scenario 2: 10% Browserless E2E',
      passed: false,
      error: String(err),
    });
  }

  return results;
}
