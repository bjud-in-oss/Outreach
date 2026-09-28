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







