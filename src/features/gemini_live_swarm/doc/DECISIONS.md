# Arkitekturbeslut: Gemini Live Swarm (`gemini_live_swarm`)

Detta dokument samlar alla domänspecifika arkitekturbeslut för svärmorkestrering och realtidsdialog enligt ADR-004 och AGENTS.md v10.0.

---

## ADR-SWARM-001: 4-Agent Svärmarkitektur med Rollseparation
- **Regel:** Strukturera svärmen i fyra specialiserade roller med distinkta systemprompter och målbilder:; Fältanalytiker (`field_analyst`)**: Identifierar behov, smärtpunkter och kontext kring målgruppen.; Kommunikatör (`communicator`)**: Skapar personliga,
- **Skäl:** Säkrar modulär integritet och FSD-kontrakt.

## ADR-SWARM-002: SwarmEventBus och 150-elementers FIFO-ringbuffert
- **Regel:** Implementera en dedikerad in-memory pub/sub-händelsebuss (`SwarmEventBus`) med stöd för wildcard-prenumeration (`*`), batchavregistrering och en rullande FIFO-ringbuffert begränsad till 150 element.
- **Skäl:** Säkrar modulär integritet och FSD-kontrakt.

## ADR-SWARM-003: Icke-blockerande WebSocket-svarsflöde (NON_BLOCKING)
- **Regel:** Mata WebSocket-förbindelsen med verktygssvar av typen `BidiGenerateContentToolResponse` flaggade som `NON_BLOCKING`, vilket tillåter agenten att fortsätta resonera och köra flerstegsarbetsflöden utan onödiga avbrott.
- **Skäl:** Säkrar modulär integritet och FSD-kontrakt.

## ADR-SWARM-004: Agentkrafter och 4:e Seriell Motor i gemini_live_swarm
- **Regel:** Mappa befintliga roller i `roleDefinitions.ts` till SI v10.0-krafterna, införa `SERIELL_MOTOR` som explicit roll och agentkonfiguration i `DEFAULT_SWARM_ROLES`, definiera `AgentForceSchema` och `SerialExecutionMetricSchema` med
- **Skäl:** Full spårbarhet av seriella fasövergångar, typsäkerhet i körtid med

## ADR-SWARM-005: UI & Dashboard-övervakning av Seriell Motor och 4 Krafter
- **Regel:** Visa kraft-etiketter på samtliga enheter i `SwarmDashboard` och uppdatera räknaren till "5 Enheter (4 Agenter + Seriell Motor)".; Implementera en dedikerad interaktiv pipeline-sektion i `SwarmDashboard` för den Seriella Exekveringsmotorn med stegvis indikator.
- **Skäl:** Säkrar modulär integritet och FSD-kontrakt.

## ADR-SWARM-006: Förankring av Mognadsmodellen och Försoningskrafterna i Källkod och UI
- **Regel:** Exportera `SEMANTIC_INVARIANT` explicit i `roleDefinitions.ts` och `index.ts`.; Utöka `SwarmAgentConfig` med `forceTitle?: string` och uppdatera `DEFAULT_SWARM_ROLES` med försoningspräglade roller och instruktioner.;
- **Skäl:** Säkrar modulär integritet och FSD-kontrakt.

## ADR-SWARM-007: Konsolidering till 4 Försoningsenheter och UI-renodling
- **Regel:** Receptbelägga bort de 5 legacy-rollerna ur den primära domänmodellen och ersätta med `RECONCILIATION_UNITS`.; Minska antalet enheter i UI och telemetri från 5 till 4.;
- **Skäl:** Säkrar modulär integritet och FSD-kontrakt.

## ADR-SWARM-008: Gemini 3.8 Live Dubbelriktad Strömning och Reaktiv Försoningsdistribution
- **Regel:** Uppgradera `GeminiLiveSession` till Gemini 3.8 Live API (`gemini-3.8-live`) med asynkron strömningsinfrastruktur (`connectLive`,; Typa alla strömningschunks (`LiveStreamChunk`) och sessionstillstånd med strikta
- **Skäl:** Säkrar modulär integritet och FSD-kontrakt.

## ADR-SWARM-009: Tyst Röstspärr och Selektiv Namnutlöst Ljudaktivering
- **Regel:** Tillämpa en strikt "Tyst Röstspärr" (`isMuted: true` som standard) under autonoma flerstegskörningar (Silent Multistep Execution).; Öppna högtalarkanalen selektivt enbart vid: - Direkt namnanrop på en av systemets 4 försoningsenheter (detekterat...
- **Skäl:** Säkrar modulär integritet och FSD-kontrakt.

## ADR-SWARM-010: AST-Arkitekturspärrar, Greenfield UI-Nybygg & Skarp Agentkoppling
- **Regel:** Skärpa `scripts/verify-architecture.js` och `scripts/drivers/ts.js` med automatiserade AST- och strukturregler: - Filgränser: Max 125 rader...; Greenfield UI-nybygg under `src/features/gemini_live_swarm/ui/components/` (<125 rader per fil): - `SwarmHeader.;
- **Skäl:** Säkrar modulär integritet och FSD-kontrakt.

## ADR-SWARM-011: AST-Miljöspärr mot Mockar, Autonom Handoff & Max 3 Agenter-kapacitet
- **Regel:** AST-Miljöspärr i `scripts/drivers/ts.js`: Blockera tysta mockar (`isTestMode`, `generateDeterministicFallback`, `mock-folder`,; Fail-Fast: `GeminiLiveSession` sätter tillståndet omedelbart till `HALTED` om `GEMINI_API_KEY` saknas,;
- **Skäl:** Säkrar modulär integritet och FSD-kontrakt.

## ADR-SWARM-012: Enkelriktad Telemetrisynk & Eliminering av setState under Render
- **Regel:** Separera buss-publicering från React-reductions: Händelsebussanrop exekveras asynkront och utanför `setSnapshot`.; Direkt snapshot-prop i `TelemetrySidebar`: `TelemetrySidebar` accepterar valfri `snapshot`-prop från föräldern.;
- **Skäl:** Säkrar modulär integritet och FSD-kontrakt.

## ADR-SWARM-013: Global Swarm Core, Auto-Reconnect & 60% Kontextmarginal
- **Regel:** Global Swarm Core & SwarmProvider**: Instansiera SwarmEventBus, GeminiLiveSession, GoogleDriveClient och SwarmOrchestrator i SwarmProvider...; Auto-Reconnect med Backoff**: Implementera återanslutning i GeminiLiveSession med statusen `RECONNECTING` och...
- **Skäl:** Säkrar modulär integritet och FSD-kontrakt.

## ADR-SWARM-014: Symbol-Krona, Split-Pane Kanvas & Minimalistisk FSD-Layout
- **Regel:** Symbol-Krona (`SymbolCrown.tsx`)**: Låst 1-radskrona överst i gränssnittet (< 80 rader, djup <= 3, branch count <= 5).; Split-Pane Kanvas (`SplitPaneCanvas.tsx`)**: Justerbar horisontell avgränsare (< 90 rader, djup <= 3, branch count <= 5).;
- **Skäl:** Säkrar modulär integritet och FSD-kontrakt.

## ADR-SWARM-015: Integrerad Symbol-Krona, Immersiv Touch-Overlay & Exekveringskort
- **Regel:** Integrerad & Expanderbar Krona (`SymbolCrown.tsx`)**: Symbolerna bär färgstatusen direkt utan extra cirklar.; Enkeltryck-Snap (`SplitPaneCanvas.tsx`)**: Klick på `[ ⇕ ]` snappar direkt till 0% övre zon (100% fullskärmschatt) eller återställer till...;
- **Skäl:** Säkrar modulär integritet och FSD-kontrakt.

## ADR-SWARM-015: Intent-Driven Audio Trigger & Adaptive Control Bar
- **Regel:** Intent-Driven Audio & User Gesture**: Koppla start av AudioContext och mikrofon till direkta klick på lägesknapparna ([ 🎬 Reflektera ],; Integrerad & Adaptiv Kontrollrad**: Placera lägesknapparna i mitten av delningslinjen.;
- **Skäl:** Säkrar modulär integritet och FSD-kontrakt.

## ADR-SWARM-016: Live Audio Handshake, 3-State SplitPane & Gesture Navigation
- **Regel:** Bidi Setup & PCM16 Piping**: Skicka korrekt initialiseringspayload vid anslutning med Aoede-röst och responseModalities audio.; State SplitPane Navigering**: Lås delningen till tre diskreta tillstånd (0%, 50%, 100%). Klick på pil,;
- **Skäl:** Säkrar modulär integritet och FSD-kontrakt.

## ADR-SWARM-017: Bidi Extended Thinking, Strikt PCM16 MediaChunks & NON_BLOCKING Tool Responses
- **Regel:** Bidi Setup med Extended Thinking**: Konfigurera handskakningspayload med thinkingConfig (thinkingBudget: 1024,; Strikt PCM16 MediaChunks**: Packa rå 16-bitars linjär PCM i realtimeInput.mediaChunks (mimeType: 'audio/pcm;;
- **Skäl:** Säkrar modulär integritet och FSD-kontrakt.

## ADR-SWARM-018: Sanering av geminiLiveSession.ts och tvingad v1alpha
- **Regel:** Sanera modelName**: Radera den döda klassvariabeln `private modelName = 'gemini-3.8-flash'`. `generateAgentTurn` använder nu `params.; Tvinga v1alpha**: Explicit konfigurera GoogleGenAI med `{ apiKey: ...,
- **Skäl:** Säkrar modulär integritet och FSD-kontrakt.

## ADR-SWARM-019: Bidi Live 16kHz Nedsampling, Snake-Case Payload & Defensiv Livscykelhantering
- **Regel:** kHz Dynamisk Nedsampling**: Tvinga `sampleRate: 16000` vid skapande av `AudioContext` i `sessionIntentAudio.; Strikt Bidi Payload**: Konfigurera `connectLive` i `geminiLiveSession.ts` med `thinkingConfig: { thinking_level: 'low' }` (snake_case),;
- **Skäl:** Säkrar modulär integritet och FSD-kontrakt.

## ADR-SWARM-020: DSP Ring Buffer Mixer, Spatial Panorering, Nativ PCM VAD & Preemptive Floor Control
- **Regel:** DSP Ring Buffer Mixer med Spatial Panorering**: Implementera `DSPRingBufferMixer` i `liveAudioPlayback.; Preemptive Floor Control & Arbitration Window**: Etablera `FloorController` i `floorController.;
- **Skäl:** Säkrar modulär integritet och FSD-kontrakt.

## ADR-SWARM-021: VAD ZCR-Mjukgörande & Kontinuerlig Mikrofonströmning (TCK-022c)
- **Regel:** Adaptiv Volymprioritering i detectSpeechPCM**: Komplettera
- **Skäl:** Säkrar modulär integritet och FSD-kontrakt.

## ADR-SWARM-022: Parallell 3-Agent Live Connection Setup & ThinkingConfig Schema Fix (TCK-022d)
- **Regel:** Strikt thinkingConfig Schema**: Konfigurera `thinkingConfig` exakt som `{ thinkingLevel: 'high' }` enligt SDK-kontraktet för...; Parallell 3-Agent Live Connection via Promise.all**: Initiera alla tre kanaler samtidigt vid sessionens start (`forlikas` på pan 0.
- **Skäl:** Säkrar modulär integritet och FSD-kontrakt.

## ADR-SWARM-023: Spatial UI Swarm Harmonization, Fluid Dock Gestures & Stream Concatenation (TCK-023)
- **Regel:** Harmoniserad Panelstruktur**: Renodla panelnamnen till **Dialog** (vänster) och **Verktyg** (höger).; Ikonidentitet & Sanering av Statusprickar**: Använd Lucide `<Compass/>` för Att följa (`#38bdf8`),;
- **Skäl:** Säkrar modulär integritet och FSD-kontrakt.

## ADR-SWARM-024: Single Live Agent & VAD Turn-Completion Fix (TCK-023b)
- **Regel:** En Enskild Live WebSocket (Host: Att förlikas)**: Exklusiv röstkabel för Att förlikas mot användaren.; VAD Turn-Complete vid > 400 ms Tystnad**: VAD sänder `turnComplete` till Live API vid tystnad över 400 ms,;
- **Skäl:** Säkrar modulär integritet och FSD-kontrakt.
