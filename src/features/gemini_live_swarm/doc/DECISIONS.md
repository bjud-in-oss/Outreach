# Arkitekturbeslut: Gemini Live Swarm (`gemini_live_swarm`)

Detta dokument samlar alla domänspecifika arkitekturbeslut för svärmorkestrering och realtidsdialog enligt ADR-004 och AGENTS.md v10.0.

---

## ADR-SWARM-001: 4-Agent Svärmarkitektur med Rollseparation
- **Datum**: 2026-09-23
- **Status**: Beslutat & Implementerat
- **Kontext**: Automatiserad outreach kräver mångfacetterad analys som inte bör hanteras av en enskild homogen AI-modell, för att undvika tunnelseende, spam och tonfallsfel.
- **Beslut**: Strukturera svärmen i fyra specialiserade roller med distinkta systemprompter och målbilder:
  1. **Fältanalytiker (`field_analyst`)**: Identifierar behov, smärtpunkter och kontext kring målgruppen.
  2. **Kommunikatör (`communicator`)**: Skapar personliga, empatiska brevutkast baserat på fältanalysen.
  3. **Kvalitetsgranskare (`quality_reviewer`)**: Granskar utkastet obarmhärtigt mot spam-indikatorer, relevans och äkthet.
  4. **Svärmorkestratör (`swarm_orchestrator`)**: Samordnar arbetsflödet, beräknar konsensuspoäng och sluter cykeln.
- **Konsekvens**: Hög integritet och kvalitet i genererade utkast genom inbyggd granskningsprocess.

---

## ADR-SWARM-002: SwarmEventBus och 150-elementers FIFO-ringbuffert
- **Datum**: 2026-09-23
- **Status**: Beslutat & Implementerat
- **Kontext**: Telemetri och status för svärmens agenter måste kunna konsumeras reaktivt av UI och loggsystem utan hårdkoppling eller risk för minnesläckage vid långa sessioner.
- **Beslut**: Implementera en dedikerad in-memory pub/sub-händelsebuss (`SwarmEventBus`) med stöd för wildcard-prenumeration (`*`), batchavregistrering och en rullande FIFO-ringbuffert begränsad till 150 element.
- **Konsekvens**: Säkerställer jämn minnesanvändning under intensiva svärmdialoger samtidigt som realtidsvisualisering i gränssnittet fungerar sömlöst.

---

## ADR-SWARM-003: Icke-blockerande WebSocket-svarsflöde (NON_BLOCKING)
- **Datum**: 2026-09-23
- **Status**: Beslutat & Implementerat
- **Kontext**: Vid interaktion via Gemini Live WebSocket API kan synkrona blockeringar under verktygsanrop leda till timeouter och bruten dialogström.
- **Beslut**: Mata WebSocket-förbindelsen med verktygssvar av typen `BidiGenerateContentToolResponse` flaggade som `NON_BLOCKING`, vilket tillåter agenten att fortsätta resonera och köra flerstegsarbetsflöden utan onödiga avbrott.
- **Konsekvens**: Högre genomströmningshastighet och obruten dialogström under autonom orkestrering.

---

## ADR-SWARM-004: Agentkrafter och 4:e Seriell Motor i gemini_live_swarm
- **Datum**: 2026-09-26
- **Status**: Beslutat & Implementerat
- **Kontext**: SI v10.0 etablerar tre grundkrafter (`ATT_FORLIKAS`, `ATT_FOLJA`, `ATT_VANDA_OM`) samt en deterministisk 4:e motor (`SERIELL_MOTOR`) för linjära fasövergångar (1a -> 1b -> 2e -> 3c). Svärmens roller behövde mappas till dessa krafter och utökas med den seriella exekveringsmotorn.
- **Beslut**: Mappa befintliga roller i `roleDefinitions.ts` till SI v10.0-krafterna, införa `SERIELL_MOTOR` som explicit roll och agentkonfiguration i `DEFAULT_SWARM_ROLES`, definiera `AgentForceSchema` och `SerialExecutionMetricSchema` med Zod-validering i `telemetrySchema.ts`, samt utöka `SwarmEventBus` med `publishSerialMetric` för pub/sub av `swarm.serial.*`-kuvert.
- **Konsekvens**: Full spårbarhet av seriella fasövergångar, typsäkerhet i körtid med Zod, strikt Token Gate-kompatibilitet och 100% bakåtkompatibilitet för befintliga moduler.

---

## ADR-SWARM-005: UI & Dashboard-övervakning av Seriell Motor och 4 Krafter
- **Datum**: 2026-09-26
- **Status**: Beslutat & Implementerat
- **Kontext**: Efter införandet av den 4:e motorn och SI v10.0-krafterna behövde användargränssnittet (`SwarmDashboard`, `TelemetrySidebar` och `MasterDevelopmentPlan`) uppdateras för att synliggöra de 4 krafterna, visualisera pipelinesteg i realtid och indikera aktiva Token Gate-spärrar.
- **Beslut**:
  1. Visa kraft-etiketter på samtliga enheter i `SwarmDashboard` och uppdatera räknaren till "5 Enheter (4 Agenter + Seriell Motor)".
  2. Implementera en dedikerad interaktiv pipeline-sektion i `SwarmDashboard` för den Seriella Exekveringsmotorn med stegvis indikator (`1a_forsta` till `e2e_verify`), körtidsmätning i ms och Token Gate-spärr.
  3. Introducera en 4-krafters sammanfattningspanel (`ATT_FORLIKAS`, `ATT_FOLJA`, `ATT_VANDA_OM`, `SERIELL_MOTOR`) samt reaktiv `snapshot.serialExecution`-rendering i `TelemetrySidebar`.
  4. Registrera `TCK-006` och `TCK-007` som verifierade i `MasterDevelopmentPlan`.
- **Konsekvens**: Transparent realtidsövervakning av agentdynamik och deterministiska fasövergångar med fullständig reaktivitet över `SwarmEventBus`.

---

## ADR-SWARM-006: Förankring av Mognadsmodellen och Försoningskrafterna i Källkod och UI
- **Datum**: 2026-09-26
- **Status**: Beslutat & Implementerat
- **Kontext**: Systemets högsta syfte och orubbliga kompass kräver att de tre försoningsvägarna (Att följa, Att vända om, Att förlikas) samt den 4:e motorn är integrerade direkt i källkoden (`SEMANTIC_INVARIANT`), agentdefinitionerna och användargränssnittet för att undvika alienation och ytlig manipulation.
- **Beslut**:
  1. Exportera `SEMANTIC_INVARIANT` explicit i `roleDefinitions.ts` och `index.ts`.
  2. Utöka `SwarmAgentConfig` med `forceTitle?: string` och uppdatera `DEFAULT_SWARM_ROLES` med försoningspräglade roller och instruktioner.
  3. Åskådliggöra syftet och de tre försoningsvägarna i en "Kompass & Högsta Syfte"-banner i `SwarmDashboard.tsx`.
  4. Synliggöra försoningstitlar och förklarande undertitlar i `TelemetrySidebar.tsx` och `MasterDevelopmentPlan.tsx`.
- **Konsekvens**: Systemets tekniska och etiska arkitektur är fullständigt försonad; varje agentfunktion agerar i överensstämmelse med den orubbliga kompassen.

---

## ADR-SWARM-007: Konsolidering till 4 Försoningsenheter och UI-renodling
- **Datum**: 2026-09-27
- **Status**: Beslutat & Implementerat (TCK-009)
- **Kontext**: Tidigare arkitektur bibehöll arvroller och duplicerade abstraktioner under huven. TCK-009 konsoliderar hela domänen till exakt 4 försoningsenheter, direkt knutna till krafterna `ATT_FOLJA`, `ATT_VANDA_OM`, `ATT_FORLIKAS` och `SERIELL_MOTOR`.
- **Beslut**:
  1. Receptbelägga bort de 5 legacy-rollerna ur den primära domänmodellen och ersätta med `RECONCILIATION_UNITS`.
  2. Minska antalet enheter i UI och telemetri från 5 till 4.
  3. Exponera exakt fyra föreskrivna visningsnamn på skärmen:
     - "Att följa Guds son"
     - "Att vända om till Gud"
     - "Att förlikas med Gud"
     - "Att försonas (ensam agent)"
  4. Hålla `SEMANTIC_INVARIANT` strikt och oförvanskat internt i källkod och promptar, och dölja råa interna promptar från gränssnittet till förmån för pedagogisk användarnytta och räckvidd.
- **Konsekvens**: Ren 1:1-mappning mellan domänmodell, telemetri och användargränssnitt med fullständig frånvaro av onödig redundans.

---

## ADR-SWARM-008: Gemini 3.8 Live Dubbelriktad Strömning och Reaktiv Försoningsdistribution
- **Datum**: 2026-09-27
- **Status**: Beslutat & Implementerat (TCK-010)
- **Kontext**: För att fördjupa närheten och skapa en transparent, levande outreach-samordning krävs asynkron realtidsströmning av både text och PCM-ljud över WebSockets, utan att drabbas av blockerande anrop eller ostrukturerad händelsespridning.
- **Beslut**:
  1. Uppgradera `GeminiLiveSession` till Gemini 3.8 Live API (`gemini-3.8-live`) med asynkron strömningsinfrastruktur (`connectLive`, `disconnectLive`, `sendRealtimeText`, `sendRealtimeAudio`).
  2. Typa alla strömningschunks (`LiveStreamChunk`) och sessionstillstånd med strikta Zod-kontrakt i `telemetrySchema.ts`.
  3. Distribuera samtliga strömningshändelser som CloudEvents 1.0 (`swarm.live.session.*`, `swarm.live.stream.*`) över `SwarmEventBus` direkt till de 4 försoningsenheterna:
     - *Att följa Guds son*: Tar emot inkommande behov och formulerar levande kontaktutkast.
     - *Att vända om till Gud*: Granskar transkribering och tillämpar Fail-Fast mot ytlighet.
     - *Att förlikas med Gud*: Sammanväver perspektiv till försonande konsensus i realtid.
     - *Att försonas (ensam agent)*: Övervakar linjär framdrift och fasintegritet.
  4. Garantera deterministisk in-memory strömning vid testsessioner för att säkra < 3s testexekvering utan externa nätverksberoenden.
- **Konsekvens**: Omedelbar reaktivitet, dubbelriktad ljud/text-strömning och fullständig spårbarhet utan risk för låsningar eller blockerade trådar.

---

## ADR-SWARM-009: Tyst Röstspärr och Selektiv Namnutlöst Ljudaktivering
- **Datum**: 2026-09-27
- **Status**: Beslutat & Implementerat (TCK-011)
- **Kontext**: Autonoma flerstegskörningar och bakgrundsanalyser genererar riklig telemetri. Om högtalaren/ljudkanalen är öppen konstant skapas auditiv trötthet och störd arbetsro, vilket strider mot systemets högsta syfte (omsorg om människan).
- **Beslut**:
  1. Tillämpa en strikt "Tyst Röstspärr" (`isMuted: true` som standard) under autonoma flerstegskörningar (Silent Multistep Execution).
  2. Öppna högtalarkanalen selektivt enbart vid:
     - Direkt namnanrop på en av systemets 4 försoningsenheter (detekterat deterministiskt via `detectUnitInvocation`).
     - Token Gate (Steg 3c_spec), där "Att försonas (ensam agent)" når beslutspunkten och muntligen presenterar systemstatus, användarnytta och godkännandekod.
  3. Skicka uppdateringar av ljudtillstånd som CloudEvents 1.0 (`swarm.audio.state.changed`) över `SwarmEventBus`.
  4. Visualisera ljudstatus tydligt i `SwarmDashboard.tsx` med möjlighet till manuell override.
- **Konsekvens**: Fullständig arbetsro under processering, omedelbar auditiv respons vid tilltal, och tydlig muntlig förankring vid kritiska beslutspunkter.

---

## ADR-SWARM-010: AST-Arkitekturspärrar, Greenfield UI-Nybygg & Skarp Agentkoppling
- **Datum**: 2026-09-28
- **Status**: Beslutat & Implementerat (TCK-012)
- **Kontext**: Kodbasens UI tenderade att svälla i en monolitisk dashboard och den 4:e enheten fungerade främst som en passiv Token Gate-vakt snarare än en aktiv byggande agent. För att säkra högsta arkitektoniska kvalitet krävdes mekaniska AST-spärrar och en ren Greenfield-modularisering.
- **Beslut**:
  1. Skärpa `scripts/verify-architecture.js` och `scripts/drivers/ts.js` med automatiserade AST- och strukturregler:
     - Filgränser: Max 125 rader för .tsx och max 250 rader för .ts.
     - Max indenteringsdjup: 4 nivåer.
     - Max förgreningsgrad: 5 villkor per komponent/funktion.
  2. Greenfield UI-nybygg under `src/features/gemini_live_swarm/ui/components/` (<125 rader per fil):
     - `SwarmHeader.tsx`: Arbetssätt "Samordning" och "Stegvis bygge".
     - `SwarmUnitCard.tsx`: De 4 visningsnamnen och verbanropen (`följa`, `vända`, `förlika`, `bygga`, `bygga ett`, `bygga två`, `bygga tre`).
     - `SwarmStreamLog.tsx`: Realtids-transkription och fasvisning för "Planera" och "Genomföra".
     - `SwarmControlPanel.tsx`: Skarp Live API-nyckelbrygga, mute- och interaktionskontroller.
     - `SwarmDashboard.tsx`: Ren samlingsvy under 100 rader.
  3. Koppla ihop den 4:e agenten ("Att tjäna Gud och andra: Bygga" / `SERIELL_MOTOR`) som en aktiv agent i `SwarmOrchestrator` som skapar och exekverar leveranskonstruktion i båda arbetssätten.
  4. Komplettera regressionssviten med `transient_TCK-002.test.ts` och `transient_TCK-012.test.ts` (< 3s i minnet).
- **Konsekvens**: Fullständig modulär renhet, felfri efterlevnad av fil- och komplexitetsgränser, och en harmoniserad 4-agenters motor med intuitiva verbanrop.

---

## ADR-SWARM-011: AST-Miljöspärr mot Mockar, Autonom Handoff & Max 3 Agenter-kapacitet
- **Datum**: 2026-09-28
- **Status**: Beslutat & Implementerat (TCK-013)
- **Kontext**: Tysta mock-fallbacks (`isTestMode = true`, syntetiska stränggenereringar) i produktionskod dolde verkliga miljöfel och försvårade felsökning. Vidare krävdes deterministisk kapacitetsbegränsning (max 3 samtidiga agenter) och en autonom handoff-slinga där Bygga-agenten självständigt stegar fram till Token Gate (3c).
- **Beslut**:
  1. AST-Miljöspärr i `scripts/drivers/ts.js`: Blockera tysta mockar (`isTestMode`, `generateDeterministicFallback`, `mock-folder`, `mock-file`) under `src/features/`. Tillåt mockar enbart i isolerade tester under `src/__tests__/`.
  2. Fail-Fast: `GeminiLiveSession` sätter tillståndet omedelbart till `HALTED` om `GEMINI_API_KEY` saknas, och `GoogleDriveClient` sätter tillståndet till `UNAUTHENTICATED`. Tydlig diagnostik visas i UI.
  3. 100% UI-namnharmonisering: Den 4:e enheten heter konsekvent "Att tjäna Gud och andra: Bygga" i samtliga vyer via dynamisk uppslagning från `roleDefinitions.ts`.
  4. Kapacitetsspärr: `MAX_CONCURRENT_AGENTS = 3` i `SwarmOrchestrator`. Live-agenter pausas när Bygga-agenten exekverar.
  5. Autonom handoff-slinga: Bygga-agenten stegar sig själv från fas 1a till 3c via `SwarmEventBus`, varpå Live-agenterna återaktiveras för reaktiv konsensusgranskning vid Token Gate (3c).
- **Konsekvens**: Kompromisslös arkitektonisk ärlighet, tydlig användardiagnostik och deterministisk autonom orkestrering.

---

## ADR-SWARM-012: Enkelriktad Telemetrisynk & Eliminering av setState under Render
- **Datum**: 2026-09-29
- **Status**: Beslutat & Implementerat (TCK-014)
- **Kontext**: Anrop till händelsebussen (`bus.publishAudioState`) inuti React-tillståndsuppdaterare (`setSnapshot(prev => ...)`) eller mitt under rendering ledde till synkrona krockar, renderkaskader och potentiella tävlingstillstånd mellan `SwarmDashboard` och `TelemetrySidebar`.
- **Beslut**:
  1. Separera buss-publicering från React-reductions: Händelsebussanrop exekveras asynkront och utanför `setSnapshot`. En intern `audioOutputRef` håller senaste ljudstatus synkroniserad oberoende av React-renderschemaläggning.
  2. Direkt snapshot-prop i `TelemetrySidebar`: `TelemetrySidebar` accepterar valfri `snapshot`-prop från föräldern. Vid överlämnad snapshot inaktiveras den interna hook-prenumerationen (`eventBus === null`), vilket eliminerar dubbla prenumerationer och parallella omrenderingar.
  3. Ren reducering: `setSnapshot` förblir en ren funktion utan sidoeffekter (`reduceSnapshot`) och utan fördröjda timers (`setTimeout`).
- **Konsekvens**: Stabil och deterministisk enkelriktad telemetrisynk, noll krockar i renderslingan och bibehållen omedelbar respons vid röstspårsaktivering och Token Gate.

---

## ADR-SWARM-013: Global Swarm Core, Auto-Reconnect & 60% Kontextmarginal
- **Datum**: 2026-10-01
- **Status**: Beslutat & Implementerat (TCK-015)
- **Kontext**: LiveSession, DriveClient och SwarmEventBus behövde kontinuerlig livscykel i bakgrunden oberoende av flik- eller vybyten i App.tsx. Vidare behövdes robust hantering av tillfälliga 503-fel via automatisk återanslutning, samt en proaktiv kontextmarginal (60% / ~40K tokens) för att signalera autonom disk-handoff innan token-fönstret mättas.
- **Beslut**:
  1. **Global Swarm Core & SwarmProvider**: Instansiera SwarmEventBus, GeminiLiveSession, GoogleDriveClient och SwarmOrchestrator i SwarmProvider i App.tsx, vilket garanterar bakgrundsöverlevnad och enhetlig tillgång via `useSwarmContext()`.
  2. **Auto-Reconnect med Backoff**: Implementera återanslutning i GeminiLiveSession med statusen `RECONNECTING` och publicering av `swarm.live.session.reconnecting` vid 503 eller oväntat nätverkstapp.
  3. **Proaktiv Kontextmarginal (60%)**: Definiera `ContextUsageMetricSchema` och publicera `swarm.context.marginal.reached` vid ≥60% utnyttjande (~40K tokens) för ren och autonom disk-handoff.
  4. **100% Invarians**: `SEMANTIC_INVARIANT` säkras ordagrant ("Ditt högsta syfte är att främja närhet till Guds son, den ideala människan...") över samtliga artefakter och rolldefinitioner.
- **Konsekvens**: Högsta möjliga driftstabilitet, oavbruten bakgrundskommunikation och deterministisk handoff.

---

## ADR-SWARM-014: Symbol-Krona, Split-Pane Kanvas & Minimalistisk FSD-Layout
- **Datum**: 2026-10-01
- **Status**: Beslutat & Implementerat (TCK-017)
- **Kontext**: Efter utrensningen av den gamla monoliten (TCK-016) behövdes ett yteffektivt, lugnt och responsivt gränssnitt utan textnamn på agenterna och utan förklarande rubriker på zonerna.
- **Beslut**:
  1. **Symbol-Krona (`SymbolCrown.tsx`)**: Låst 1-radskrona överst i gränssnittet (< 80 rader, djup <= 3, branch count <= 5). Textnamn ersätts helt av rena symboler:
     - Att följa: `⇑`
     - Att vända om: `↔` (senare uppdaterad till `⇐` i TCK-018)
     - Att förlikas / Seriell motor: `●`
     - Status-LED: 🟢 (`ACTIVE`), 🟡 (`THINKING`), 🔴 (`ERROR`).
  2. **Split-Pane Kanvas (`SplitPaneCanvas.tsx`)**: Justerbar horisontell avgränsare (< 90 rader, djup <= 3, branch count <= 5). Dela skärmen mellan övre zon (Agent-Kanvas) och nedre zon (Chattflöde) med dragbar avgränsare (15%–85% spärr).
  3. **Strikt Layoutrenhet**: Inga rubriker (`h1`, `h2`, `h3`) eller förklarande zonnamn i DOM eller UI.
  4. **Rot-Integrering i `App.tsx`**: Minimalistiskt skal under 20 rader med `SwarmProvider`, `SymbolCrown` och `SplitPaneCanvas`.
- **Konsekvens**: 100% fokus på innehållet, responsiv ytdelning och ren reaktiv rendering styrd av `SwarmEventBus`.

---

## ADR-SWARM-015: Integrerad Symbol-Krona, Immersiv Touch-Overlay & Exekveringskort
- **Datum**: 2026-10-01
- **Status**: Beslutat & Implementerat (TCK-018)
- **Kontext**: För att ytterligare renodla gränssnittet togs den separata LED-cirkeln bort till förmån för integrerad färgstatus direkt på symbolerna (`⇑`, `⇐`, `●`). Dessutom krävdes enkeltryck-snap för fullskärmschatt, immersiv touch-overlay och skydd mot störande vybyten (User Activity Lock).
- **Beslut**:
  1. **Integrerad & Expanderbar Krona (`SymbolCrown.tsx`)**: Symbolerna bär färgstatusen direkt utan extra cirklar. Kronan blir klickbar och expanderar en detaljerad telemetripanel vid behov.
  2. **Enkeltryck-Snap (`SplitPaneCanvas.tsx`)**: Klick på `[ ⇕ ]` snappar direkt till 0% övre zon (100% fullskärmschatt) eller återställer till 50%.
  3. **Immersiv Touch-Overlay (`TouchOverlayMenu.tsx`)**: I immersivt läge döljs krona och bottenmeny. Touch/interaktion fäller ut meny och krona flytande med 3 sekunders auto-hide.
  4. **User Activity Lock (`useUserActivityLock.ts`)**: Klick/touch/scroll fryser autonoma kanvas-uppdateringar i 5 sekunder så att användaren inte avbryts.
  5. **Exekveringskort (`ExecutionCard.tsx`)**: Fällbara kort i chatten (`[ ⇑ Exekveringskort #XX ]`) med översikt över skapade filer, ändringsloggar och röstresuméer.
- **Konsekvens**: Optimal mobil- och desktopanpassning, ostörd dialog vid behov och full spårbarhet via exekveringskort.

---

## ADR-SWARM-015: Intent-Driven Audio Trigger & Adaptive Control Bar
- **Datum**: 2026-10-02
- **Status**: Beslutat & Implementerat (TCK-020)
- **Kontext**: Tidigare krävdes manuell röstaktivering och kontrollknapparna var spridda i flytande overlays. Dessutom behövdes orienteringsanpassad split-pane med enkelpilar för gränslägen och permanent synlighet av SymbolCrown.
- **Beslut**:
  1. **Intent-Driven Audio & User Gesture**: Koppla start av AudioContext och mikrofon till direkta klick på lägesknapparna ([ 🎬 Reflektera ], [ 🧠 Kom ihåg ], [ 💬 Rådgör ]). Ett klick ansluter mikrofonströmmen; ett återklick stänger mikrofonen och försätter sessionen i dvala ("🟡 Agenter i dvala").
  2. **Integrerad & Adaptiv Kontrollrad**: Placera lägesknapparna i mitten av delningslinjen. Vid begränsat utrymme döljs texten på inaktiva knappar (kompakta runda ikoner), medan aktiv knapp förstoras (scale-105).
  3. **Orientering & Enkelpilar**: Stöd för både porträtt (vertikal stapling) och landskap (horisontell stapling). Vid gränslägen (0% och 100%) döljs förbrukad pilsymbol så att enbart giltig återställningspil visas ([ ⇧ ] resp [ ⇩ ] i porträtt; [ ⇒ ] resp [ ⇐ ] i landskap).
  4. **Permanent SymbolCrown & Helskärmsåtergång**: SymbolCrown är låst till toppzonen och förblir permanent synlig. Återgång från helskärmsläge återställer delningen balanserat till 50% så att båda fälten visas.
- **Konsekvens**: Betydligt mer intuitiv användarupplevelse på både mobil och desktop med fail-safe röstaktivering och stabil kanvaslayout.

---

## ADR-SWARM-016: Live Audio Handshake, 3-State SplitPane & Gesture Navigation
- **Datum**: 2026-10-02
- **Status**: Beslutat & Implementerat (TCK-020b)
- **Kontext**: För att säkerställa skarp realtidsinteraktion behövdes fullständig BidiGenerateContentSetup-handskakning och 16kHz PCM16-strömning mot Gemini Live. Dessutom krävdes deterministisk 3-state snap (0%, 50%, 100%) med stöd för touch-svepgester och piltangenter, samt total utrensning av TouchOverlayMenu från AppShell.
- **Beslut**:
  1. **Bidi Setup & PCM16 Piping**: Skicka korrekt initialiseringspayload vid anslutning med Aoede-röst och responseModalities audio. Konvertera mikrofonströmmen till Linear PCM 16-bit mono och strömma realtimeInput kontinuerligt. Publicera SWARM_TALKING och SWARM_THINKING vid serverljud.
  2. **3-State SplitPane Navigering**: Lås delningen till tre diskreta tillstånd (0%, 50%, 100%). Klick på pil, svepgester (tröskel 30px) och piltangenter (ArrowUp/Down i Portrait, ArrowLeft/Right i Landscape) stegar exakt ett läge i taget.
  3. **Dynamiska Pilar per Läge**: Vid 100% visas enbart [ ⇧ ] / [ ⇐ ]; vid 50% visas båda [ ⇧ ][ ⇩ ] / [ ⇐ ][ ⇒ ]; vid 0% visas enbart [ ⇩ ] / [ ⇒ ].
  4. **Menyrensning & MatchMedia**: Ta bort TouchOverlayMenu helt ur AppShell. Låt matchMedia styra flex-col (Portrait) vs flex-row (Landscape) dynamiskt, medan SymbolCrown förblir permanent i toppzonen.
- **Konsekvens**: Fullständigt förutsägbar och responsiv upplevelse med skarp ljudintegration och ren FSD-komposition.

---

## ADR-SWARM-017: Bidi Extended Thinking, Strikt PCM16 MediaChunks & NON_BLOCKING Tool Responses
- **Datum**: 2026-10-03
- **Status**: Beslutat & Implementerat (TCK-020c)
- **Kontext**: Gemini Live API kräver strikt packaging av realtime-ljud under realtimeInput.mediaChunks (16kHz PCM16 mono) samt extended thinking i session-setup. För att inte bryta flerstegskörningar eller låsa WebSocket-kabeln vid MCP-verktygsanrop måste verktygsrespons automatiseras med behavior: 'NON_BLOCKING'. Dessutom behövdes eliminering av oändliga zombiekablar vid anslutningsfel genom omedelbar Fail-Fast och nollställning av aktivt intention i UI.
- **Beslut**:
  1. **Bidi Setup med Extended Thinking**: Konfigurera handskakningspayload med thinkingConfig (thinkingBudget: 1024, extendedThinking: true) och dubbla svarsmodaliteter (TEXT och AUDIO).
  2. **Strikt PCM16 MediaChunks**: Packa rå 16-bitars linjär PCM i realtimeInput.mediaChunks (mimeType: 'audio/pcm;rate=16000') med bibehållen bakåtkompatibel audio-egenskap.
  3. **Autonoma NON_BLOCKING Verktygssvar**: SwarmOrchestrator och GeminiLiveSession paketerar alla verktygsresultat som toolResponse med behavior: 'NON_BLOCKING', så att svärmen kan fortsätta samtala utan att användaren manuellt måste sparka igång sessionen mellan varje steg.
  4. **Fail-Fast & Zombie-eliminering**: Ersätt dolda manuella reconnect-slingor med omedelbar felrendering i chattkanvasen och automatisk avaktivering av aktiv intention vid nätverksfel eller sessionstapp.
- **Konsekvens**: Betydligt stabilare realtidsströmmar, djupare resonemang via extended thinking och friktionsfri multi-verktygsexekvering över WebSocket-kabeln.

---

## ADR-SWARM-018: Sanering av geminiLiveSession.ts och tvingad v1alpha
- **Datum**: 2026-10-03
- **Status**: Beslutat & Implementerat (TCK-020d)
- **Kontext**: Föråldrad klassvariabel `modelName = 'gemini-3.8-flash'` skapade fragmentering och risk för osynkade textmodellsanrop vid sidan av den primära försoningsmotorn. Dessutom behövdes explicit hårdlåsning till `apiVersion: 'v1alpha'` i GoogleGenAI-klienten för att förhindra att WebSocket-kabeln kopplar upp mot v1beta.
- **Beslut**:
  1. **Sanera modelName**: Radera den döda klassvariabeln `private modelName = 'gemini-3.8-flash'`. `generateAgentTurn` använder nu `params.model || this.liveModelName`, vilket eliminerar döda fallbacks.
  2. **Tvinga v1alpha**: Explicit konfigurera GoogleGenAI med `{ apiKey: ..., apiVersion: 'v1alpha' }` i både konstruktor och `setApiKey`, samt exponera `getApiVersion(): string`.
- **Konsekvens**: Ren källkod fri från legacy-modeller, garanterad anslutning till Gemini Live v1alpha och total arkitektonisk överensstämmelse.

---

## ADR-SWARM-019: Bidi Live 16kHz Nedsampling, Snake-Case Payload & Defensiv Livscykelhantering

- **Datum**: 2026-10-03
- **Status**: Beslutat & Implementerat
- **Kontext**: För att realisera försoningsmotorns kompass om varm, obehindrad tvåvägsdialog krävdes en fully functional Gemini Live Bidi WebSocket-anslutning (`v1alpha`) med kontinuerlig röst- och textströmning. Tidigare uppstod tystnad från VAD-motorn på grund av sampelfrekvensförskjutning (48kHz vs 16kHz) samt unhandled exceptions i konsolen vid frånkoppling.
- **Beslut**:
  1. **16kHz Dynamisk Nedsampling**: Tvinga `sampleRate: 16000` vid skapande av `AudioContext` i `sessionIntentAudio.ts` samt införa en linjär nedsamplingsalgoritm om hårdvaran körs i 48kHz. Detta eliminerar 3x hastighetsförskjutning (chipmunk-effekt) och garanterar att Googles Server VAD identifierar mänskligt tal.
  2. **Strikt Bidi Payload**: Konfigurera `connectLive` i `geminiLiveSession.ts` med `thinkingConfig: { thinking_level: 'low' }` (snake_case), singular modalitet `['AUDIO']` och en enskild `audio`-kapsel (`{ audio: { data, mimeType } }`) enligt `@google/genai` SKILL-specifikationen.
  3. **Defensiv Teardown**: Kapsla in `sendRealtimeInput` i `subscribeToMicPiping` med `try/catch` för att tyst fånga asynkrona mikrofonpaket när socketen övergår i status `CLOSING` eller `CLOSED`.
- **Konsekvens**: Omedelbar röstdetektering, naturligt talsvar från agenten (24kHz PCM), noll unhandled exceptions vid frånkoppling och en helt stabil grund för framtida MCP-verktyg och försoningsdialoger.

