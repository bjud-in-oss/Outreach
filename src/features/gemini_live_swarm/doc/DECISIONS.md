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

