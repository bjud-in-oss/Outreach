# CYCLE LOG: TCK-023b

## Steg 1a
Intention & Mänsklig Nytta: Ställa om svärmens orkestrering till 1 Live-röstkabel (Host: Att förlikas) mot användaren och 2 High-Thinking underagenter (Att följa, Att vända om) via @google/genai. VAD sänder Turn Complete vid > 400 ms tystnad för att eliminera 50s-timeouten. Orkestratorn prenumererar på ReflectionMode och styr oscillationsdjupet till MÄTTNAD: JA.

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
Transient Testspecifikation: src/__tests__/transient_TCK-023b.test.ts. Test 1: 1 Live Host & VAD Turn Complete vid > 400 ms tystnad. Test 2: High-Thinking bakgrundsagenter och syntes i Host. Test 3: ReflectionMode prenumeration och oscillation till MÄTTNAD: JA. Test 4: AST- och mock-regler.

## Steg 3b
Exakt Källkodsspecifikation under src/features/gemini_live_swarm/: 1. swarmOrchestrator.ts ställs om till 1 Live Host + VAD + ReflectionMode. 2. geminiLiveSession.ts renodlas för 1 aktiv Bidi-kabel mot Host. 3. floorController.ts saneras från 50s loopar.

## Steg 2e
Operativt Delta (Destruktiv Sanering): 1. Radera parallella 3-agent Bidi-connects i geminiLiveSession.ts. 2. Radera 50s timers i floorController.ts. 3. Radera döda testfall som kräver 3 parallella Bidi-kablar.

## Steg 3c
Slutgiltigt Byggkontrakt: Samtliga steg i v10.2 linjärt svep är fullbordade och HMAC-kedjan är intakt. human_decision_required: false. Token genereras.

