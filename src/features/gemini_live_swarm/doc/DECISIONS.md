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
