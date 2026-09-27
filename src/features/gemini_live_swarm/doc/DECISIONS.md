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



