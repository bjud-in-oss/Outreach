import fs from 'node:fs';
import path from 'node:path';
import { checkAstMetrics, checkNoProductionMocks } from '../../scripts/drivers/ts.js';
import { SwarmEventBus } from '../features/gemini_live_swarm/bus/swarmEventBus.ts';
import { GeminiLiveSession } from '../features/gemini_live_swarm/session/geminiLiveSession.ts';
import { createBidiSetupPayload } from '../features/gemini_live_swarm/session/sessionIntentAudio.ts';
import { SwarmOrchestrator } from '../features/gemini_live_swarm/coordinator/swarmOrchestrator.ts';
import { McpSwarmBridge } from '../features/mcp_bridge/orchestrator/mcpSwarmBridge.ts';

export async function runTransientTCK020cTests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];
  const rootDir = process.cwd();

  function assert(condition: boolean, msg: string) {
    if (!condition) throw new Error(msg);
  }

  // Test 1: Bidi Setup med extended_thinking och TEXT/AUDIO-modaliteter
  try {
    const setup = createBidiSetupPayload('Kompass för närhet');
    assert(Boolean(setup?.setup?.model), 'Setup ska ha en modell konfigurerad');
    const modalities = setup.setup.generationConfig.responseModalities;
    assert(modalities.includes('AUDIO') || modalities.includes('audio'), 'Modalitet AUDIO ska ingå');
    assert(modalities.includes('TEXT') || modalities.includes('text'), 'Modalitet TEXT ska ingå');
    const thinking = (setup.setup.generationConfig as any).thinkingConfig;
    assert(Boolean(thinking?.extendedThinking || thinking?.thinkingBudget), 'thinkingConfig ska vara konfigurerat');
    assert(setup.setup.systemInstruction.parts[0].text === 'Kompass för närhet', 'Systeminstruktion ska sättas i setup');
    results.push({ name: 'Bidi Setup inkluderar extended_thinking och AUDIO/TEXT-modaliteter', passed: true });
  } catch (err: any) {
    results.push({ name: 'Bidi Setup inkluderar extended_thinking och AUDIO/TEXT-modaliteter', passed: false, error: err.message });
  }

  // Test 2: Strikt packaging av PCM16 i realtimeInput.mediaChunks
  try {
    const bus = new SwarmEventBus();
    const session = new GeminiLiveSession('test-api-key', bus);
    const mockPcmBase64 = 'AP8A/wD/AP8A';
    const payload = session.packRealtimeAudioChunk(mockPcmBase64, 'audio/pcm;rate=16000');
    assert(Boolean(payload.realtimeInput?.mediaChunks), 'realtimeInput.mediaChunks ska finnas i payload');
    assert(payload.realtimeInput!.mediaChunks![0].mimeType === 'audio/pcm;rate=16000', 'mimeType ska vara audio/pcm;rate=16000');
    assert(payload.realtimeInput!.mediaChunks![0].data === mockPcmBase64, 'Data ska matcha base64 PCM16');
    assert(payload.audio?.mimeType === 'audio/pcm;rate=16000', 'audio-egenskapen ska bibehållas för bakåtkompatibilitet');
    assert(payload.audio?.data === mockPcmBase64, 'audio.data ska matcha PCM16');
    results.push({ name: 'PCM16 packas strikt i realtimeInput.mediaChunks och audio-objekt', passed: true });
  } catch (err: any) {
    results.push({ name: 'PCM16 packas strikt i realtimeInput.mediaChunks och audio-objekt', passed: false, error: err.message });
  }

  // Test 3: Mic Piping över SwarmEventBus
  try {
    const bus = new SwarmEventBus();
    const session = new GeminiLiveSession('test-api-key', bus);
    let pipedPayload: any = null;
    (session as any).activeSdkSession = {
      sendRealtimeInput: (p: any) => { pipedPayload = p; },
    };
    (session as any).liveStatus = 'STREAMING';
    bus.publishLiveEvent('swarm.live.stream.audio', {
      audioChunkBase64: 'dGVzdA==',
      mimeType: 'audio/pcm;rate=16000',
    });
    assert(Boolean(pipedPayload?.realtimeInput?.mediaChunks), 'Piping ska leverera realtimeInput.mediaChunks');
    assert(pipedPayload.realtimeInput.mediaChunks[0].data === 'dGVzdA==', 'Piped data ska matcha');
    results.push({ name: 'Mic Piping vidarebefordrar ljudchunkiar asynkront via eventbussen', passed: true });
  } catch (err: any) {
    results.push({ name: 'Mic Piping vidarebefordrar ljudchunkiar asynkront via eventbussen', passed: false, error: err.message });
  }

  // Test 4: Bidi toolResponse med behavior: 'NON_BLOCKING'
  try {
    const bus = new SwarmEventBus();
    const session = new GeminiLiveSession('test-api-key', bus);
    let capturedResponse: any = null;
    (session as any).activeSdkSession = {
      sendRealtimeInput: (p: any) => { capturedResponse = p; },
    };
    session.sendToolResponse([
      { id: 'call-xyz', name: 'drive_create_file', response: { output: { fileId: 'doc-123' } } },
    ], 'NON_BLOCKING');
    assert(Boolean(capturedResponse?.toolResponse), 'toolResponse ska paketeras');
    assert(capturedResponse.toolResponse.behavior === 'NON_BLOCKING', 'behavior ska vara NON_BLOCKING');
    assert(capturedResponse.toolResponse.functionResponses[0].id === 'call-xyz', 'functionResponses ska innehålla call-xyz');
    const history = bus.getHistory();
    const evt = history.find((e) => e.type === 'swarm.live.tool.response');
    assert(Boolean(evt), 'swarm.live.tool.response ska publiceras på eventbussen');
    results.push({ name: 'toolResponse paketeras med behavior: NON_BLOCKING och sänds via Bidi', passed: true });
  } catch (err: any) {
    results.push({ name: 'toolResponse paketeras med behavior: NON_BLOCKING och sänds via Bidi', passed: false, error: err.message });
  }

  // Test 5: SwarmOrchestrator autonom Bidi tool response integration
  try {
    const bus = new SwarmEventBus();
    const session = new GeminiLiveSession('test-api-key', bus);
    let capturedPayload: any = null;
    (session as any).activeSdkSession = {
      sendRealtimeInput: (p: any) => { capturedPayload = p; },
    };
    const bridge = new McpSwarmBridge(undefined, bus);
    const orchestrator = new SwarmOrchestrator(session, bridge, bus);
    const res = await orchestrator.handleToolCall('outreach_evaluate_tone', {
      draftText: 'Kära vänner, vi samlas för gemenskap och försoning.',
      recipientProfile: 'Familjer i församlingen',
    });
    assert(Boolean(res?.bidiResponse), 'handleToolCall ska returnera bidiResponse');
    assert(res!.bidiResponse.behavior === 'NON_BLOCKING', 'bidiResponse ska ha behavior NON_BLOCKING');
    assert(Boolean(capturedPayload?.toolResponse), 'toolResponse ska ha skickats till sessionen');
    assert(capturedPayload.toolResponse.behavior === 'NON_BLOCKING', 'Skickad toolResponse ska vara NON_BLOCKING');
    results.push({ name: 'SwarmOrchestrator automatiserar NON_BLOCKING toolResponse vid verktygsanrop', passed: true });
  } catch (err: any) {
    results.push({ name: 'SwarmOrchestrator automatiserar NON_BLOCKING toolResponse vid verktygsanrop', passed: false, error: err.message });
  }

  // Test 6: AST- och radgränser för modifierade FSD-moduler (TCK-012/TCK-016)
  try {
    const sessionPath = path.join(rootDir, 'src/features/gemini_live_swarm/session/geminiLiveSession.ts');
    const audioPath = path.join(rootDir, 'src/features/gemini_live_swarm/session/sessionIntentAudio.ts');
    const orchestratorPath = path.join(rootDir, 'src/features/gemini_live_swarm/coordinator/swarmOrchestrator.ts');
    const canvasPath = path.join(rootDir, 'src/features/gemini_live_swarm/ui/SplitPaneCanvas.tsx');

    const sessionContent = fs.readFileSync(sessionPath, 'utf8');
    const audioContent = fs.readFileSync(audioPath, 'utf8');
    const orchestratorContent = fs.readFileSync(orchestratorPath, 'utf8');
    const canvasContent = fs.readFileSync(canvasPath, 'utf8');

    const sessionLines = sessionContent.split('\n').length;
    const audioLines = audioContent.split('\n').length;
    const orchestratorLines = orchestratorContent.split('\n').length;
    const canvasLines = canvasContent.split('\n').length;

    assert(sessionLines <= 250, `geminiLiveSession.ts har ${sessionLines} rader (> 250)`);
    assert(audioLines <= 250, `sessionIntentAudio.ts har ${audioLines} rader (> 250)`);
    assert(orchestratorLines <= 250, `swarmOrchestrator.ts har ${orchestratorLines} rader (> 250)`);
    assert(canvasLines <= 125, `SplitPaneCanvas.tsx har ${canvasLines} rader (> 125)`);

    const astSession = checkAstMetrics('src/features/gemini_live_swarm/session/geminiLiveSession.ts', sessionContent);
    assert(astSession.valid, astSession.error || 'AST session ogiltig');
    const astOrchestrator = checkAstMetrics('src/features/gemini_live_swarm/coordinator/swarmOrchestrator.ts', orchestratorContent);
    assert(astOrchestrator.valid, astOrchestrator.error || 'AST orchestrator ogiltig');
    const astCanvas = checkAstMetrics('src/features/gemini_live_swarm/ui/SplitPaneCanvas.tsx', canvasContent);
    assert(astCanvas.valid, astCanvas.error || 'AST canvas ogiltig');

    results.push({ name: 'AST- och radgränser strikt respekterade för modifierade filer', passed: true });
  } catch (err: any) {
    results.push({ name: 'AST- och radgränser strikt respekterade för modifierade filer', passed: false, error: err.message });
  }

  return results;
}
