import { SwarmEventBus } from '../features/gemini_live_swarm/bus/swarmEventBus.ts';
import { GeminiLiveSession } from '../features/gemini_live_swarm/session/geminiLiveSession.ts';
import {
  appendStreamChunkToTurns,
  extractTurnEventData,
  AccumulatedTurn,
} from '../features/gemini_live_swarm/ui/turnContainerHelper.ts';

export async function runTransientTCK032Tests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  // Scenario 1: Avdubblering av användarinmatning & Idempotens i appendStreamChunkToTurns
  try {
    const initialTurns: AccumulatedTurn[] = [];
    const clientMessageId = 'client-msg-123';
    const text = 'Herre, visa mig vägen till försoning.';

    // Första anropet: lägger till användarens tur
    const turnsAfterFirst = appendStreamChunkToTurns(
      initialTurns,
      text,
      'Användare',
      'Mänsklig intention',
      true,
      clientMessageId
    );

    // Andra anropet (simulerad dubbelsändning från buss / timeout / nätverk)
    const turnsAfterDuplicate = appendStreamChunkToTurns(
      turnsAfterFirst,
      text,
      'Användare',
      'Mänsklig intention',
      true,
      clientMessageId
    );

    const isIdempotentCount = turnsAfterDuplicate.length === 1;
    const isIdempotentContent = turnsAfterDuplicate[0]?.text === text;
    const passed = isIdempotentCount && isIdempotentContent;

    results.push({
      name: 'TCK-032 Scenario 1: Idempotens i appendStreamChunkToTurns - Dubbelinmatning förhindras strikt',
      passed,
      error: !passed
        ? `Idempotens bröts: length=${turnsAfterDuplicate.length}, text="${turnsAfterDuplicate[0]?.text}"`
        : undefined,
    });
  } catch (err) {
    results.push({
      name: 'TCK-032 Scenario 1: Idempotens i appendStreamChunkToTurns',
      passed: false,
      error: String(err),
    });
  }

  // Scenario 2: Skriven textrespons från Gemini Live (part.text extraktion i handleAgentMessage)
  try {
    const bus = new SwarmEventBus();
    const session = new GeminiLiveSession('dummy-test-key-tck032', bus);
    let capturedDelta: any = null;

    bus.subscribe('swarm.session.text_delta', (env) => {
      capturedDelta = env.data;
    });

    // Simulera inkommande Gemini Live part.text
    const liveMsg = { serverContent: { modelTurn: { parts: [{ text: 'Guds frid över ditt samtal och din strävan.' }] } } };
    session.handleAgentMessage('forlikas', liveMsg);

    const isAssistant = capturedDelta?.sourceRole === 'assistant';
    const isHarmonizedRole = capturedDelta?.agentRole === 'Att förlikas';
    const hasText = capturedDelta?.text === 'Guds frid över ditt samtal och din strävan.';
    const passed = Boolean(isAssistant && isHarmonizedRole && hasText);

    results.push({
      name: 'TCK-032 Scenario 2: Gemini Live part.text extraheras och emitteras som assistentsvar till tursfären',
      passed,
      error: !passed ? `Misslyckades extrahera part.text: capturedDelta=${JSON.stringify(capturedDelta)}` : undefined,
    });
  } catch (err) {
    results.push({
      name: 'TCK-032 Scenario 2: Gemini Live part.text extraktion',
      passed: false,
      error: String(err),
    });
  }

  // Scenario 3: Harmonisering av Mikrofon-Intent ('CONSULT')
  try {
    // Verifiera att turnContainerHelper och promptBarHelper exporterar och använder CONSULT
    const { SWARM_INTENTS } = await import('../features/gemini_live_swarm/ui/turnContainerHelper.ts');
    const consultDef = SWARM_INTENTS.find((i) => i.id === 'CONSULT');
    const hasConsult = Boolean(consultDef && consultDef.force === 'ATT_FORLIKAS');

    // Kontrollera att promptBarHelper.ts innehåller anropet activateIntent('CONSULT') och inte 'forlikas'
    const fs = await import('node:fs');
    const path = await import('node:path');
    const helperSource = fs.readFileSync(
      path.join(process.cwd(), 'src/features/gemini_live_swarm/ui/promptBarHelper.ts'),
      'utf8'
    );
    const usesConsultIntent = helperSource.includes("activateIntent('CONSULT')");
    const noLegacyString = !helperSource.includes("activateIntent('forlikas')");
    const noDuplicateSendDelta = !helperSource.includes("swarmCtx?.eventBus?.emit('swarm.session.text_delta',");

    const passed = hasConsult && usesConsultIntent && noLegacyString && noDuplicateSendDelta;

    results.push({
      name: "TCK-032 Scenario 3: Harmonisering av Mikrofon-Intent ('CONSULT') och sanering av dubbelemitt",
      passed,
      error: !passed
        ? `Intent-harmonisering eller avdubblering brister: hasConsult=${hasConsult}, usesConsultIntent=${usesConsultIntent}, noLegacyString=${noLegacyString}, noDuplicateSendDelta=${noDuplicateSendDelta}`
        : undefined,
    });
  } catch (err) {
    results.push({
      name: 'TCK-032 Scenario 3: Harmonisering av Mikrofon-Intent',
      passed: false,
      error: String(err),
    });
  }

  return results;
}
