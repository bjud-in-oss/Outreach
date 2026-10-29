# Arkitekturbeslut: Gemini Live Swarm (`gemini_live_swarm`)

Detta dokument samlar alla domänspecifika arkitekturbeslut för svärmorkestrering och realtidsdialog enligt ADR-004 och AGENTS.md v10.0.

---


## ADR-SWARM-001: 4-Agent Svärmarkitektur med Rollseparation
- **Regel:** Strukturera svärmen i fyra specialiserade roller med distinkta systemprompter och målbilder:
- **Skäl:** Hög integritet och kvalitet i genererade utkast genom inbyggd granskningsprocess.

## ADR-SWARM-002: SwarmEventBus och 150-elementers FIFO-ringbuffert
- **Regel:** Implementera en dedikerad in-memory pub/sub-händelsebuss (`SwarmEventBus`) med stöd för wildcard-prenumeration (`*`), batchavregistrering och en rullande FIFO-ringbuffert begränsad
- **Skäl:** Säkerställer jämn minnesanvändning under intensiva svärmdialoger samtidigt som realtidsvisualisering i gränssnittet fung

## ADR-SWARM-003: Icke-blockerande WebSocket-svarsflöde (NON_BLOCKING)
- **Regel:** Mata WebSocket-förbindelsen med verktygssvar av typen `BidiGenerateContentToolResponse` flaggade som `NON_BLOCKING`, vilket tillåter agenten att fortsätta resonera och köra flerste
- **Skäl:** Högre genomströmningshastighet och obruten dialogström under autonom orkestrering.

## ADR-SWARM-004: Agentkrafter och 4:e Seriell Motor i gemini_live_swarm
- **Regel:** Mappa befintliga roller i `roleDefinitions.ts` till SI v10.0-krafterna, införa `SERIELL_MOTOR` som explicit roll och agentkonfiguration i `DEFAULT_SWARM_ROLES`, definiera `AgentFor
- **Skäl:** Full spårbarhet av seriella fasövergångar, typsäkerhet i körtid med Zod, strikt Token Gate-kompatibilitet och 100% bakåt

## ADR-SWARM-005: UI & Dashboard-övervakning av Seriell Motor och 4 Krafter
- **Regel:** - **Datum**: 2026-09-26 - **Status**: Beslutat & Implementerat
- **Skäl:** Transparent realtidsövervakning av agentdynamik och deterministiska fasövergångar med fullständig reaktivitet över `Swar

## ADR-SWARM-006: Förankring av Mognadsmodellen och Försoningskrafterna i Källkod och UI
- **Regel:** - **Datum**: 2026-09-26 - **Status**: Beslutat & Implementerat
- **Skäl:** Systemets tekniska och etiska arkitektur är fullständigt försonad; varje agentfunktion agerar i överensstämmelse med den

## ADR-SWARM-007: Konsolidering till 4 Försoningsenheter och UI-renodling
- **Regel:** - **Datum**: 2026-09-27 - **Status**: Beslutat & Implementerat (TCK-009)
- **Skäl:** Ren 1:1-mappning mellan domänmodell, telemetri och användargränssnitt med fullständig frånvaro av onödig redundans.

## ADR-SWARM-008: Gemini 3.8 Live Dubbelriktad Strömning och Reaktiv Försoningsdistribution
- **Regel:** - **Datum**: 2026-09-27 - **Status**: Beslutat & Implementerat (TCK-010)
- **Skäl:** Omedelbar reaktivitet, dubbelriktad ljud/text-strömning och fullständig spårbarhet utan risk för låsningar eller blocker

## ADR-SWARM-009: Tyst Röstspärr och Selektiv Namnutlöst Ljudaktivering
- **Regel:** - **Datum**: 2026-09-27 - **Status**: Beslutat & Implementerat (TCK-011)
- **Skäl:** Fullständig arbetsro under processering, omedelbar auditiv respons vid tilltal, och tydlig muntlig förankring vid kritis

## ADR-SWARM-010: AST-Arkitekturspärrar, Greenfield UI-Nybygg & Skarp Agentkoppling
- **Regel:** - **Datum**: 2026-09-28 - **Status**: Beslutat & Implementerat (TCK-012)
- **Skäl:** Fullständig modulär renhet, felfri efterlevnad av fil- och komplexitetsgränser, och en harmoniserad 4-agenters motor med

## ADR-SWARM-011: AST-Miljöspärr mot Mockar, Autonom Handoff & Max 3 Agenter-kapacitet
- **Regel:** - **Datum**: 2026-09-28 - **Status**: Beslutat & Implementerat (TCK-013)
- **Skäl:** Kompromisslös arkitektonisk ärlighet, tydlig användardiagnostik och deterministisk autonom orkestrering.

## ADR-SWARM-012: Enkelriktad Telemetrisynk & Eliminering av setState under Render
- **Regel:** - **Datum**: 2026-09-29 - **Status**: Beslutat & Implementerat (TCK-014)
- **Skäl:** Stabil och deterministisk enkelriktad telemetrisynk, noll krockar i renderslingan och bibehållen omedelbar respons vid r

## ADR-SWARM-013: Global Swarm Core, Auto-Reconnect & 60% Kontextmarginal
- **Regel:** - **Datum**: 2026-10-01 - **Status**: Beslutat & Implementerat (TCK-015)
- **Skäl:** Högsta möjliga driftstabilitet, oavbruten bakgrundskommunikation och deterministisk handoff.

## ADR-SWARM-014: Symbol-Krona, Split-Pane Kanvas & Minimalistisk FSD-Layout
- **Regel:** - **Datum**: 2026-10-01 - **Status**: Beslutat & Implementerat (TCK-017)
- **Skäl:** 100% fokus på innehållet, responsiv ytdelning och ren reaktiv rendering styrd av `SwarmEventBus`.

## ADR-SWARM-015: Integrerad Symbol-Krona, Immersiv Touch-Overlay & Exekveringskort
- **Regel:** - **Datum**: 2026-10-01 - **Status**: Beslutat & Implementerat (TCK-018)
- **Skäl:** Optimal mobil- och desktopanpassning, ostörd dialog vid behov och full spårbarhet via exekveringskort.

## ADR-SWARM-015: Intent-Driven Audio Trigger & Adaptive Control Bar
- **Regel:** - **Datum**: 2026-10-02 - **Status**: Beslutat & Implementerat (TCK-020)
- **Skäl:** Betydligt mer intuitiv användarupplevelse på både mobil och desktop med fail-safe röstaktivering och stabil kanvaslayout

## ADR-SWARM-016: Live Audio Handshake, 3-State SplitPane & Gesture Navigation
- **Regel:** - **Datum**: 2026-10-02 - **Status**: Beslutat & Implementerat (TCK-020b)
- **Skäl:** Fullständigt förutsägbar och responsiv upplevelse med skarp ljudintegration och ren FSD-komposition.

## ADR-SWARM-017: Bidi Extended Thinking, Strikt PCM16 MediaChunks & NON_BLOCKING Tool Responses
- **Regel:** - **Datum**: 2026-10-03 - **Status**: Beslutat & Implementerat (TCK-020c)
- **Skäl:** Betydligt stabilare realtidsströmmar, djupare resonemang via extended thinking och friktionsfri multi-verktygsexekvering

## ADR-SWARM-018: Sanering av geminiLiveSession.ts och tvingad v1alpha
- **Regel:** - **Datum**: 2026-10-03 - **Status**: Beslutat & Implementerat (TCK-020d)
- **Skäl:** Ren källkod fri från legacy-modeller, garanterad anslutning till Gemini Live v1alpha och total arkitektonisk överensstäm

## ADR-SWARM-019: Bidi Live 16kHz Nedsampling, Snake-Case Payload & Defensiv Livscykelhantering
- **Regel:** - **Datum**: 2026-10-03
- **Skäl:** Omedelbar röstdetektering, naturligt talsvar från agenten (24kHz PCM), noll unhandled exceptions vid frånkoppling och en

## ADR-SWARM-020: DSP Ring Buffer Mixer, Spatial Panorering, Nativ PCM VAD & Preemptive Floor Control
- **Regel:** - **Datum**: 2026-10-04 - **Status**: Beslutat & Implementerat (TCK-022a)
- **Skäl:** Naturlig, klickfri flerstämmig samtalssituation där användaren hör var krafterna talar ifrån i stereofältet och där den 

## ADR-SWARM-021: VAD ZCR-Mjukgörande & Kontinuerlig Mikrofonströmning (TCK-022c)
- **Regel:** - **Status**: Beslutad och implementerad - **Datum**: 2026-10-04
- **Skäl:** Betydligt mer robust taligenkänning som bevarar djupa stämmor och vokaler, samt eliminerar behovet av UI-knapptryckninga

## ADR-SWARM-022: Parallell 3-Agent Live Connection Setup & ThinkingConfig Schema Fix (TCK-022d)
- **Regel:** - **Status**: Beslutad och implementerad - **Datum**: 2026-10-04
- **Skäl:** Handshake-felen är helt eliminerade och alla 3 försoningskrafter talar med unika röster i stereofältet från oberoende, p

## ADR-SWARM-023: Spatial UI Swarm Harmonization, Fluid Dock Gestures & Stream Concatenation (TCK-023)
- **Regel:** - **Status**: Beslutad och implementerad - **Datum**: 2026-10-05
- **Skäl:** Gränssnittet speglar nu sömlöst den trekanaliga stereosvärmen och MCP-bakgrundsarbetet med intuitiva gester, rofylld est

## ADR-SWARM-024: Single Live Agent & VAD Turn-Completion Fix (TCK-023b)
- **Regel:** - **Status**: Beslutad och implementerad - **Datum**: 2026-10-10
- **Skäl:** Stabil och timeout-fri drift, ren röstkabel och harmonisk styrning av agenternas tankedjup.
