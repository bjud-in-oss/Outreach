import fs from 'node:fs';
import path from 'node:path';
import { checkAstMetrics } from '../../scripts/drivers/ts.js';
import { SwarmEventBus } from '../features/gemini_live_swarm/bus/swarmEventBus.ts';
import { GeminiLiveSession } from '../features/gemini_live_swarm/session/geminiLiveSession.ts';

export async function runTransientTCK020dTests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];
  const rootDir = process.cwd();

  function assert(condition: boolean, msg: string) {
    if (!condition) throw new Error(msg);
  }

  // Test 1: geminiLiveSession saknar föråldrad modelName klassvariabel
  try {
    const sessionPath = path.join(rootDir, 'src/features/gemini_live_swarm/session/geminiLiveSession.ts');
    const content = fs.readFileSync(sessionPath, 'utf8');
    assert(!content.includes("private modelName = 'gemini-3.8-flash'"), 'modelName klassvariabel ska vara raderad');
    assert(!content.includes("this.modelName"), 'Inga referenser till this.modelName får finnas');
    results.push({ name: 'geminiLiveSession.ts saknar föråldrad modelName-skräpkod', passed: true });
  } catch (err: any) {
    results.push({ name: 'geminiLiveSession.ts saknar föråldrad modelName-skräpkod', passed: false, error: err.message });
  }

  // Test 2: GeminiLiveSession sätter explicit apiVersion: 'v1alpha'
  try {
    const bus = new SwarmEventBus();
    const session = new GeminiLiveSession('test-api-key', bus);
    assert(session.getApiVersion() === 'v1alpha', 'getApiVersion() ska returnera v1alpha');
    const sessionPath = path.join(rootDir, 'src/features/gemini_live_swarm/session/geminiLiveSession.ts');
    const content = fs.readFileSync(sessionPath, 'utf8');
    assert(content.includes("apiVersion: 'v1alpha'"), "GoogleGenAI måste instansieras med apiVersion: 'v1alpha'");
    results.push({ name: 'SDK-klienten instansieras med explicit apiVersion: v1alpha', passed: true });
  } catch (err: any) {
    results.push({ name: 'SDK-klienten instansieras med explicit apiVersion: v1alpha', passed: false, error: err.message });
  }

  // Test 3: setApiKey bibehåller apiVersion: 'v1alpha'
  try {
    const bus = new SwarmEventBus();
    const session = new GeminiLiveSession('test-api-key', bus);
    session.setApiKey('new-test-key');
    assert(session.getApiVersion() === 'v1alpha', 'setApiKey ska bibehålla v1alpha');
    assert(session.getLiveStatus() === 'IDLE', 'Session efter setApiKey ska vara IDLE');
    results.push({ name: 'setApiKey upprätthåller strikt apiVersion: v1alpha och återställer tillstånd', passed: true });
  } catch (err: any) {
    results.push({ name: 'setApiKey upprätthåller strikt apiVersion: v1alpha och återställer tillstånd', passed: false, error: err.message });
  }

  // Test 4: generateAgentTurn använder liveModelName eller specificerad modell
  try {
    const bus = new SwarmEventBus();
    const session = new GeminiLiveSession('test-api-key', bus);
    let capturedModel = '';
    (session as any).aiClient = {
      models: {
        generateContent: async (cfg: any) => {
          capturedModel = cfg.model;
          return { text: 'Turn generated successfully' };
        },
      },
    };
    const res = await session.generateAgentTurn({
      role: 'ATT_FOLJA',
      systemInstruction: 'Instruktion',
      prompt: 'Analysera närhet',
    });
    assert(capturedModel === session.getLiveModel(), 'generateAgentTurn ska använda session.getLiveModel() som standard');
    assert(res.content === 'Turn generated successfully', 'Innehåll ska genereras');

    await session.generateAgentTurn({
      role: 'ATT_VANDA_OM',
      systemInstruction: 'Instruktion',
      prompt: 'Självrannsakan',
      model: 'custom-model-id',
    });
    assert(capturedModel === 'custom-model-id', 'generateAgentTurn ska respektera explicit angiven modell');
    results.push({ name: 'generateAgentTurn använder harmoniserad liveModelName eller överstyrd modell', passed: true });
  } catch (err: any) {
    results.push({ name: 'generateAgentTurn använder harmoniserad liveModelName eller överstyrd modell', passed: false, error: err.message });
  }

  // Test 5: AST- och radgränser för geminiLiveSession.ts (< 250 rader)
  try {
    const sessionPath = path.join(rootDir, 'src/features/gemini_live_swarm/session/geminiLiveSession.ts');
    const content = fs.readFileSync(sessionPath, 'utf8');
    const lineCount = content.split('\n').length;
    assert(lineCount <= 250, `geminiLiveSession.ts överskrider radgränsen: ${lineCount} rader`);
    const metrics = checkAstMetrics('src/features/gemini_live_swarm/session/geminiLiveSession.ts', content);
    assert(metrics.valid, metrics.error || 'AST ogiltig');
    results.push({ name: 'AST- och radgränser strikt respekterade för geminiLiveSession.ts', passed: true });
  } catch (err: any) {
    results.push({ name: 'AST- och radgränser strikt respekterade för geminiLiveSession.ts', passed: false, error: err.message });
  }

  return results;
}
