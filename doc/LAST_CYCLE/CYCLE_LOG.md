# CYCLE LOG: TCK-023b

## Steg 1a
Intention & Mänsklig Nytta: Ställa om svärmens orkestrering till 1 Live-röstkabel (Host: Att förlikas) mot användaren och 2 High-Thinking underagenter (Att följa, Att vända om) via @google/genai. VAD sänder Turn Complete vid > 400 ms tystnad för att bryta 50s-timeouten. Orkestratorn prenumererar på ReflectionMode och styr oscillationsdjupet till MÄTTNAD: JA.

## Steg 0a
Kontraktsaudit: 1. Max 1 FSD-domän: src/features/gemini_live_swarm/coordinator/. 2. API-skills: @google/genai med Live API och standard generationConfig.thinkingConfig. 3. Saneringskrav: Destruktiv sanering av tre parallella WebSocket-anslutningar och 50s-timeout spärrar.

## Steg 0b
Vägval & Förlikningsport: Å ena sidan kan man försöka lappa 3 samtidiga Bidi-kablar, å andra sidan leder det till krockar och 50s-timeouts. Att förlikas som Host (1 Live Agent) med bakgrunds-thinking är robust och följer AGENTS.md v10.2 exakt. Väg 2 (Godkänd för svep).

## Steg 1b
Kartlägg Domän & Systemgränser: Existerande moduler i src/features/gemini_live_swarm/coordinator/ (swarmOrchestrator.ts) och session (geminiLiveSession.ts). UI-kontrakt läses från reflectionStateHelper.ts (UI_REFLECTION_MODE_CHANGED). Telemetri exporterar token_throughput_per_minute.

## Steg 2a
Avgränsa Tillstånd & Biverkningar: Host håller en aktiv Live WebSocket. VAD övervakar mikrofonströmmen och sänder Turn Complete vid > 400 ms tystnad. Bakgrundsagenter anropas asynkront med High-Thinking. UI-reflektionsläge styr djupet: normal (0 varv), mikro (1 varv), makro (2 varv), meta (3 varv) fram till MÄTTNAD: JA.

## Steg 2b
Modellera Zod-kontrakt: OrchestratorConfigSchema = z.object({ reflectionMode: ReflectionModeSchema.default("normal"), vadSilenceThresholdMs: z.number().default(400), hostChannel: z.literal("forlikas").default("forlikas") }). SwarmTurnCompleteSchema = z.object({ agentRole: z.string(), turnComplete: z.boolean(), tokenThroughputPerMinute: z.number().nonnegative().optional() }).

## Steg 2c
Utvärdera Resiliens & Felhantering: Fail-Fast vid WebSocket-avbrott. VAD bryter automatiskt 50s timeout utan att hänga socketen. Respektera strikt AST-gränser (< 250 rader per .ts, noll produktionsmockar).

## Steg 2d
Syntetisk Vägvägning & Mognadskontroll: Vägning mot AGENTS.md v10.2 och SI v10.2. 1 Live Host + 2 bakgrundsagenter garanterar ren stereosyntes och kraschfri VAD. human_decision_required: false.

## Steg 3a
describe('TCK-023b Single Live Agent & VAD Turn-Completion', () => {
  test('Single Live WebSocket cable for Att förlikas with VAD turnComplete', () => {
    expect(orchestrator.getHostChannel()).toBe('forlikas');
    expect(orchestrator.getLiveChannels().length).toBe(1);
    expect(orchestrator.getVadSilenceMs()).toBe(400);
  });
  test('High-Thinking background agents for folja and vanda_om', async () => {
    const res = await orchestrator.executeBackgroundThinking('folja', 'prompt');
    expect(res.thinkingLevel).toBe('high');
    expect(res.thought).toBeDefined();
  });
  test('ReflectionMode subscription and oscillation termination', () => {
    orchestrator.setReflectionMode('mikro');
    expect(orchestrator.getReflectionMode()).toBe('mikro');
    expect(orchestrator.isSatiated()).toBe(true);
  });
});

## Steg 3b
Exakt Källkodsspecifikation under src/features/gemini_live_swarm/coordinator/ och session/:
1. src/features/gemini_live_swarm/coordinator/swarmOrchestrator.ts:
   - Konfigurera 1 Live WebSocket exklusivt för Host (Att förlikas).
   - Integrera VAD-avlyssning som emitterar Turn Complete vid > 400 ms tystnad.
   - Anropa Att följa och Att vända om som bakgrundsagenter via @google/genai med High-Thinking (thinkingConfig: { thinkingLevel: 'high' }).
   - Prenumerera på UI_REFLECTION_MODE_CHANGED och reglera oscillationsdjup (normal: 0, mikro: 1, makro: 2, meta: 3) fram till MÄTTNAD: JA.
   - Exponera token_throughput_per_minute i telemetrin.
2. src/features/gemini_live_swarm/session/geminiLiveSession.ts:
   - Renodla till 1 primär aktiv WebSocket för Host-agenten.
   - Sanera parallella 3-agent connect loops och osynkade fallback-timers.

## Steg 2e
Operativt Delta (Destruktiv Sanering): 1. Radera parallella 3-agent Bidi-connects i geminiLiveSession.ts. 2. Radera 50s timers i floorController.ts. 3. Radera döda testfall som kräver 3 parallella Bidi-kablar.

## Steg 3c
Slutgiltigt Byggkontrakt: Samtliga steg i v10.2 linjärt svep är fullbordade och HMAC-kedjan är intakt. human_decision_required: false. Token genereras.

