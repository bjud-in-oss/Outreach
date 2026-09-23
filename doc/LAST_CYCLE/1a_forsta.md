# 1a Förstå: Swarm Telemetry, Reaktiv Händelsebuss & Styrkort (TCK-002)

## 1. Målbild & Bakgrund
I **TCK-001** etablerades Outreach Samordningsmotors grundläggande arkitektur med Google Drive Workspace, Write-Ahead Logging (WAL), MCP-brygga och en grundläggande Gemini Live Swarm. 

I **TCK-002** lyfter vi operatörens insyn och systemets reaktiva förmåga genom att transformera beprövade mönster från referensen **Acoustic-Priming-backup**:
1. **TelemetrySidebar**: En realtidsövervakning av svärmens interna tillstånd (agentpuls, aktivitet, latens, tankeström och händelseflöde).
2. **MasterDevelopmentPlan**: Ett reaktivt styrkort för systemtickets och leveransfaser direkt knutet till `doc/TICKETS.md` och arkitekturkvitton.
3. **Reaktiv Händelsebuss (`swarmEventBus`)**: En typsäker, händelsestyrd pub/sub-motor baserad på `EventEnvelope` (`CloudEvents 1.0`) som orkestrerar kommunikationen mellan svärmens agenter, telemetrin och WAL-loggern.

## 2. Analys av Migrationsmönster (Acoustic-Priming-backup)
- **Händelsestyrd Agent-buss (`useAgent` / Event Bus)**:
  - Tidigare mönster: Komponenter anropade funktioner direkt i ad-hoc state utan standardiserade händelsekontrakt.
  - Vår transformation: Varje tillståndsändring, agenttanke och verktygsutförande publiceras som ett validerat `EventEnvelope`. Bussen tillåter prenumeranter (telemetri, UI, WAL, tester) att lyssna på specifika mönster (`swarm.*`, `agent.*`, `ticket.*`).
- **TelemetrySidebar**:
  - Tidigare mönster: Statisk sidopanel med hårdkodade loggrader.
  - Vår transformation: Levande, reaktiv telemetrikomponent med realtidsaggregering (aktiva agenter, throughput, tankeström i realtid, feltoleransindikator och filtrerbar händelselogg).
- **MasterDevelopmentPlan (Reaktivt Styrkort)**:
  - Tidigare mönster: Hårdkodad text i README eller separata markdown-filer utan koppling till UI.
  - Vår transformation: Interaktivt styrkort integrerat i samordningspanelen som visualiserar statusen för `doc/TICKETS.md` (TCK-001 slutförd, TCK-002 aktiv, TCK-003 väntande) samt verifieringskvitton och acceptanskriterier.

## 3. Intern Riskanalys (Risknoder)
- **Risknod 1: State (Tillståndskoherens & Minnesläckor i Reaktiv Buss)**
  - *Risk*: Om prenumeranter till händelsebussen inte avregistreras vid avmontering av React-komponenter skapas minnesläckor och dubbla händelseutskick.
  - *Åtgärd*: `swarmEventBus` designas med id-baserad prenumeration och explicit `unsubscribe`-funktion. Hooks (`useSwarmTelemetry`, `useSwarmEventBus`) städar upp i `useEffect`-cleanup.
- **Risknod 2: Contract (Zod-schema & Kontraktsintegritet)**
  - *Risk*: Telemetridata och händelsekuvert kan divergera från `EventEnvelopeSchema` och krascha telemetri-parsning.
  - *Åtgärd*: Alla telemetrihändelser valideras med Zod i domängränsen (`telemetrySchema.ts`). Ogiltiga händelser fångas med Fail Fast och skickas till diagnostikpanelen.
- **Risknod 3: Resilience (Prestanda vid hög händelseintensitet)**
  - *Risk*: Svärmens intensiva tankeflöden och stegbyten kan orsaka överdrivna re-renders i operatörsgränssnittet.
  - *Åtgärd*: Buffring och begränsning av telemetriloggen (t.ex. max 100 senaste händelser i rullande ringbuffert) samt ren tillståndsisolering mellan telemetripanelen och formulärdelarna i `SwarmDashboard`.
