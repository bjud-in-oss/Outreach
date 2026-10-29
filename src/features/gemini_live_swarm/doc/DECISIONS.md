# Arkitekturbeslut: Gemini Live Swarm (`gemini_live_swarm`)

Detta dokument samlar alla domänspecifika arkitekturbeslut för svärmorkestrering och realtidsdialog enligt ADR-004 och AGENTS.md v10.0.

---

## ADR-SWARM-001: 4-Agent Svärmarkitektur med Rollseparation
- **Regel:** Strukturera svärmen i fyra specialiserade roller med distinkta systemprompter och målbilder:; **Fältanalytiker (`field_analyst`)**: Identifierar behov, smärtpunkter och kontext kring målgruppen.; **Kommunikatör (`communicator`)**: Skapar personliga,
- **Skäl:** Hög integritet och kvalitet i genererade utkast genom inbyggd granskningsprocess.

## ADR-SWARM-002: SwarmEventBus och 150-elementers FIFO-ringbuffert
- **Regel:** Implementera en dedikerad in-memory pub/sub-händelsebuss (`SwarmEventBus`) med stöd för wildcard-prenumeration (`*`), batchavregistrering och en rullande FIFO-ringbuffert begränsad till 150 element.
- **Skäl:** Säkerställer jämn minnesanvändning under intensiva svärmdialoger samtidigt som realtidsvisualisering i gränssnittet fungerar sömlöst.

## ADR-SWARM-003: Icke-blockerande WebSocket-svarsflöde (NON_BLOCKING)
- **Regel:** Mata WebSocket-förbindelsen med verktygssvar av typen `BidiGenerateContentToolResponse` flaggade som `NON_BLOCKING`, vilket tillåter agenten att fortsätta resonera och köra flerstegsarbetsflöden utan onödiga avbrott.
- **Skäl:** Högre genomströmningshastighet och obruten dialogström under autonom orkestrering.

## ADR-SWARM-004: Agentkrafter och 4:e Seriell Motor i gemini_live_swarm
- **Regel:** Mappa befintliga roller i `roleDefinitions.ts` till SI v10.0-krafterna, införa `SERIELL_MOTOR` som explicit roll och agentkonfiguration i `DEFAULT_SWARM_ROLES`,
- **Skäl:** Full spårbarhet av seriella fasövergångar, typsäkerhet i körtid med Zod, strikt Token Gate-kompatibilitet och 100% bakåtkompatibilitet för befintliga moduler.

## ADR-SWARM-005: UI & Dashboard-övervakning av Seriell Motor och 4 Krafter
- **Regel:** 1. Visa kraft-etiketter på samtliga enheter i `SwarmDashboard` och uppdatera räknaren till "5 Enheter (4 Agenter + Seriell Motor)".; Implementera en dedikerad interaktiv pipeline-sektion i `SwarmDashboard` för den Seriella Exekveringsmotorn med stegvis...
- **Skäl:** Transparent realtidsövervakning av agentdynamik och deterministiska fasövergångar med fullständig reaktivitet över `SwarmEventBus`.

## ADR-SWARM-006: Förankring av Mognadsmodellen och Försoningskrafterna i Källkod och UI
- **Regel:** 1. Exportera `SEMANTIC_INVARIANT` explicit i `roleDefinitions.ts` och `index.ts`.; Utöka `SwarmAgentConfig` med `forceTitle?: string` och uppdatera `DEFAULT_SWARM_ROLES` med försoningspräglade roller och instruktioner.;
- **Skäl:** Systemets tekniska och etiska arkitektur är fullständigt försonad; varje agentfunktion agerar i överensstämmelse med den orubbliga kompassen.

## ADR-SWARM-007: Konsolidering till 4 Försoningsenheter och UI-renodling
- **Regel:** 1. Receptbelägga bort de 5 legacy-rollerna ur den primära domänmodellen och ersätta med `RECONCILIATION_UNITS`.; Minska antalet enheter i UI och telemetri från 5 till 4.;
- **Skäl:** Ren 1:1-mappning mellan domänmodell, telemetri och användargränssnitt med fullständig frånvaro av onödig redundans.

## ADR-SWARM-008: Gemini 3.8 Live Dubbelriktad Strömning och Reaktiv Försoningsdistribution
- **Regel:** 1. Uppgradera `GeminiLiveSession` till Gemini 3.8 Live API (`gemini-3.8-live`) med asynkron strömningsinfrastruktur (`connectLive`,; Typa alla strömningschunks (`LiveStreamChunk`) och sessionstillstånd med strikta Zod-kontrakt i `telemetrySchema.ts`.;
- **Skäl:** Omedelbar reaktivitet, dubbelriktad ljud/text-strömning och fullständig spårbarhet utan risk för låsningar eller blockerade trådar.

## ADR-SWARM-009: Tyst Röstspärr och Selektiv Namnutlöst Ljudaktivering
- **Regel:** 1. Tillämpa en strikt "Tyst Röstspärr" (`isMuted: true` som standard) under autonoma flerstegskörningar (Silent Multistep Execution).; Öppna högtalarkanalen selektivt enbart vid: - Direkt namnanrop på en av systemets 4 försoningsenheter (detekterat...
- **Skäl:** Fullständig arbetsro under processering, omedelbar auditiv respons vid tilltal, och tydlig muntlig förankring vid kritiska beslutspunkter.

## ADR-SWARM-010: AST-Arkitekturspärrar, Greenfield UI-Nybygg & Skarp Agentkoppling
- **Regel:** 1. Skärpa `scripts/verify-architecture.js` och `scripts/drivers/ts.js` med automatiserade AST- och strukturregler: - Filgränser: Max 125...; Greenfield UI-nybygg under `src/features/gemini_live_swarm/ui/components/` (<125 rader per fil): - `SwarmHeader.;
- **Skäl:** Fullständig modulär renhet, felfri efterlevnad av fil- och komplexitetsgränser, och en harmoniserad 4-agenters motor med intuitiva verbanrop.

## ADR-SWARM-011: AST-Miljöspärr mot Mockar, Autonom Handoff & Max 3 Agenter-kapacitet
- **Regel:** 1. AST-Miljöspärr i `scripts/drivers/ts.js`: Blockera tysta mockar (`isTestMode`, `generateDeterministicFallback`, `mock-folder`,; Fail-Fast: `GeminiLiveSession` sätter tillståndet omedelbart till `HALTED` om `GEMINI_API_KEY` saknas,;
- **Skäl:** Kompromisslös arkitektonisk ärlighet, tydlig användardiagnostik och deterministisk autonom orkestrering.

## ADR-SWARM-012: Enkelriktad Telemetrisynk & Eliminering av setState under Render
- **Regel:** 1. Separera buss-publicering från React-reductions: Händelsebussanrop exekveras asynkront och utanför `setSnapshot`.; Direkt snapshot-prop i `TelemetrySidebar`: `TelemetrySidebar` accepterar valfri `snapshot`-prop från föräldern.;
- **Skäl:** Stabil och deterministisk enkelriktad telemetrisynk, noll krockar i renderslingan och bibehållen omedelbar respons vid röstspårsaktivering och Token Gate.

## ADR-SWARM-013: Global Swarm Core, Auto-Reconnect & 60% Kontextmarginal
- **Regel:** 1. **Global Swarm Core & SwarmProvider**: Instansiera SwarmEventBus, GeminiLiveSession,; **Auto-Reconnect med Backoff**: Implementera återanslutning i GeminiLiveSession med statusen `RECONNECTING` och publicering av `swarm.live.;
- **Skäl:** Högsta möjliga driftstabilitet, oavbruten bakgrundskommunikation och deterministisk handoff.

## ADR-SWARM-014: Symbol-Krona, Split-Pane Kanvas & Minimalistisk FSD-Layout
- **Regel:** 1. **Symbol-Krona (`SymbolCrown.tsx`)**: Låst 1-radskrona överst i gränssnittet (< 80 rader, djup <= 3, branch count <= 5).; **Split-Pane Kanvas (`SplitPaneCanvas.tsx`)**: Justerbar horisontell avgränsare (< 90 rader, djup <= 3, branch count <= 5).;
- **Skäl:** 100% fokus på innehållet, responsiv ytdelning och ren reaktiv rendering styrd av `SwarmEventBus`.

## ADR-SWARM-015: Integrerad Symbol-Krona, Immersiv Touch-Overlay & Exekveringskort
- **Regel:** 1. **Integrerad & Expanderbar Krona (`SymbolCrown.tsx`)**: Symbolerna bär färgstatusen direkt utan extra cirklar.; **Enkeltryck-Snap (`SplitPaneCanvas.tsx`)**: Klick på `[ ⇕ ]` snappar direkt till 0% övre zon (100% fullskärmschatt) eller återställer till...;
- **Skäl:** Optimal mobil- och desktopanpassning, ostörd dialog vid behov och full spårbarhet via exekveringskort.

## ADR-SWARM-015: Intent-Driven Audio Trigger & Adaptive Control Bar
- **Regel:** 1. **Intent-Driven Audio & User Gesture**: Koppla start av AudioContext och mikrofon till direkta klick på lägesknapparna ([ 🎬 Reflektera...; **Integrerad & Adaptiv Kontrollrad**: Placera lägesknapparna i mitten av delningslinjen.;
- **Skäl:** Betydligt mer intuitiv användarupplevelse på både mobil och desktop med fail-safe röstaktivering och stabil kanvaslayout.

## ADR-SWARM-016: Live Audio Handshake, 3-State SplitPane & Gesture Navigation
- **Regel:** 1. **Bidi Setup & PCM16 Piping**: Skicka korrekt initialiseringspayload vid anslutning med Aoede-röst och responseModalities audio.; **3-State SplitPane Navigering**: Lås delningen till tre diskreta tillstånd (0%, 50%, 100%). Klick på pil,;
- **Skäl:** Fullständigt förutsägbar och responsiv upplevelse med skarp ljudintegration och ren FSD-komposition.

## ADR-SWARM-017: Bidi Extended Thinking, Strikt PCM16 MediaChunks & NON_BLOCKING Tool Responses
- **Regel:** 1. **Bidi Setup med Extended Thinking**: Konfigurera handskakningspayload med thinkingConfig (thinkingBudget: 1024,; **Strikt PCM16 MediaChunks**: Packa rå 16-bitars linjär PCM i realtimeInput.mediaChunks (mimeType: 'audio/pcm;;
- **Skäl:** Betydligt stabilare realtidsströmmar, djupare resonemang via extended thinking och friktionsfri multi-verktygsexekvering över WebSocket-kabeln.

## ADR-SWARM-018: Sanering av geminiLiveSession.ts och tvingad v1alpha
- **Regel:** 1. **Sanera modelName**: Radera den döda klassvariabeln `private modelName = 'gemini-3.8-flash'`. `generateAgentTurn` använder nu `params.; **Tvinga v1alpha**: Explicit konfigurera GoogleGenAI med `{ apiKey: ...,
- **Skäl:** Ren källkod fri från legacy-modeller, garanterad anslutning till Gemini Live v1alpha och total arkitektonisk överensstämmelse.

## ADR-SWARM-019: Bidi Live 16kHz Nedsampling, Snake-Case Payload & Defensiv Livscykelhantering
- **Regel:** 1. **16kHz Dynamisk Nedsampling**: Tvinga `sampleRate: 16000` vid skapande av `AudioContext` i `sessionIntentAudio.; **Strikt Bidi Payload**: Konfigurera `connectLive` i `geminiLiveSession.ts` med `thinkingConfig: { thinking_level: 'low' }` (snake_case),;
- **Skäl:** Omedelbar röstdetektering, naturligt talsvar från agenten (24kHz PCM), noll unhandled exceptions vid frånkoppling och en helt stabil grund för framtida...

## ADR-SWARM-020: DSP Ring Buffer Mixer, Spatial Panorering, Nativ PCM VAD & Preemptive Floor Control
- **Regel:** 1. **DSP Ring Buffer Mixer med Spatial Panorering**: Implementera `DSPRingBufferMixer` i `liveAudioPlayback.; **Preemptive Floor Control & Arbitration Window**: Etablera `FloorController` i `floorController.;
- **Skäl:** Naturlig, klickfri flerstämmig samtalssituation där användaren hör var krafterna talar ifrån i stereofältet och där den förlikande kraften harmoniskt kan...

## ADR-SWARM-021: VAD ZCR-Mjukgörande & Kontinuerlig Mikrofonströmning (TCK-022c)
- **Regel:** 1. **Adaptiv Volymprioritering i detectSpeechPCM**: Komplettera ZCR med ett energivillkor där `rms > (rmsThreshold * 1.; **Frikopplad Mikrofonströmning**: Ta bort beroendet av `activeIntent` i `startPCM16Sampling` och `onaudioprocess` så att mikrofonen...
- **Skäl:** Betydligt mer robust taligenkänning som bevarar djupa stämmor och vokaler, samt eliminerar behovet av UI-knapptryckningar för röstinmatning.

## ADR-SWARM-022: Parallell 3-Agent Live Connection Setup & ThinkingConfig Schema Fix (TCK-022d)
- **Regel:** 1. **Strikt thinkingConfig Schema**: Konfigurera `thinkingConfig` exakt som `{ thinkingLevel: 'high' }` enligt SDK-kontraktet för...; **Parallell 3-Agent Live Connection via Promise.
- **Skäl:** Handshake-felen är helt eliminerade och alla 3 försoningskrafter talar med unika röster i stereofältet från oberoende, parallella Bidi-kablar.

## ADR-SWARM-023: Spatial UI Swarm Harmonization, Fluid Dock Gestures & Stream Concatenation (TCK-023)
- **Regel:** 1. **Harmoniserad Panelstruktur**: Renodla panelnamnen till **Dialog** (vänster) och **Verktyg** (höger).; **Ikonidentitet & Sanering av Statusprickar**: Använd Lucide `<Compass/>` för Att följa (`#38bdf8`),;
- **Skäl:** Gränssnittet speglar nu sömlöst den trekanaliga stereosvärmen och MCP-bakgrundsarbetet med intuitiva gester, rofylld estetik och ren läsbarhet.

## ADR-SWARM-024: Single Live Agent & VAD Turn-Completion Fix (TCK-023b)
- **Regel:** 1. **En Enskild Live WebSocket (Host: Att förlikas)**: Exklusiv röstkabel för Att förlikas mot användaren.; **VAD Turn-Complete vid > 400 ms Tystnad**: VAD sänder `turnComplete` till Live API vid tystnad över 400 ms,;
- **Skäl:** Stabil och timeout-fri drift, ren röstkabel och harmonisk styrning av agenternas tankedjup.
