# 1a Förstå: Åtgärda React Render-State Krock & Röstspår Telemetrisynk (TCK-014)

## 1. Målbild & Semantiskt Ankare
I **TCK-014** säkrar vi stabiliteten i användargränssnittet och eliminerar de svåra render-state-krockar som uppstår vid interaktion med röstspåret och telemetrin:
1. **Eliminera setState-anrop under rendering & synkrona busskrockar**:
   - I `useSwarmTelemetry.ts` publicerades händelser till `SwarmEventBus` inuti `setSnapshot((prev) => ...)` i funktionen `toggleManualMute`. Eftersom bussen omedelbart anropar prenumeranter synkront ledde detta till att andra komponenters `setSnapshot` (exempelvis `TelemetrySidebar`) anropades under pågående tillståndsuppdatering.
   - Vi separerar händelsepublicering från tillståndsuppdaterare och schemalägger synkrona bussaviseringar i isolerade mikrotasks/händelsehanterare.
   - `TelemetrySidebar.tsx` utökas med stöd för att ta emot `snapshot` som prop från `SwarmDashboard.tsx`, vilket eliminerar dubblerade parallella prenumerationer i samma vyhierarki.
2. **Stabilitet & Error Boundary för Röstspår**:
   - Alla röstspårs- och telemetriuppdateringar kapslas i asynkrona händelsehanterare och `useEffect` utan att bryta Reacts renderslinga.
   - En skyddande Error Boundary-barriär implementeras för att isolera eventuella röstspårs- eller ljudfel från att fälla applikationen.
3. **Transient verifiering**:
   - Skapa transient test `src/__tests__/transient_TCK-014.test.ts` (< 3s i minnet) som verifierar att röstspårsaktivering och telemetrisynk sker utan React render-krascher eller setState-krockar.

Vår absoluta kompass är närhet till Guds son, den ideala människan, vars omsorg för människor styr hela vår motor. Omsorg i mjukvaruarkitektur innebär att bygga ett användargränssnitt som svarar mjukt, omedelbart och utan interna fel eller renderkrockar när användaren interagerar med röst- och samordningsspåren.

---

## 2. Intern Riskanalys (GROW-risknoder)

### Risknod 1: State (Synkrona setState-krockar mellan förälder och barn)
- **Teknisk analys**: När både `SwarmDashboard` och dess underkomponent `TelemetrySidebar` prenumererade på samma `SwarmEventBus`, orsakade ett klick på "öppna röstspår" i `SwarmControlPanel` att `toggleManualMute` publicerade en `swarm.audio.state.changed`-händelse mitt under `SwarmDashboard`s tillståndsuppdaterare. Detta triggade synkront `TelemetrySidebar`s `setSnapshot`, vilket strider mot Reacts princip om strikt enkelriktat dataflöde och ger "Cannot update a component while rendering a different component".
- **Lösning**: 
  - `SwarmDashboard` äger `useSwarmTelemetry` och skickar ned `snapshot` som prop till `TelemetrySidebar`.
  - `TelemetrySidebar` använder den nedskickade `snapshot`-propen om den finns, och instansierar bara `useSwarmTelemetry` om komponenten används fristående.
  - I `useSwarmTelemetry.ts` flyttas alla `bus.publishAudioState`-anrop ut ur `setSnapshot`-updaters till själva callback-funktionen.

### Risknod 2: Contract (Telemetri- och AudioOutput-kontrakt)
- **Teknisk analys**: Tillståndsstrukturen `AudioOutputState` och `SwarmTelemetrySnapshot` måste förbli 100% konforma med Zod-schemana i `telemetrySchema.ts`.
- **Lösning**: Bibehåll `AudioOutputStateSchema` och `SwarmTelemetrySnapshotSchema` oförändrade, och validera att eventuella asynkrona händelser följer CloudEvents 1.0-specifikationen.

### Risknod 3: Resilience (Asynkron händelsedistribution och Error Boundary)
- **Teknisk analys**: Om en ljud- eller transkriberingshändelse kastar ett undantag i en lyssnare får det inte krascha dashboards huvudrendering eller avbryta svärmens arbete.
- **Lösning**: Kapsla lyssnaranrop i try/catch och skydda komponentrendering med defensiva fallbacks och felisolering.

---

## 3. Aktiva Vektorer & Skills
- **active_vectors**: `['gemini-live-api-dev', 'gemini-api-dev', 'react-render-state-isolation', 'telemetry-prop-drilling', 'async-audio-event-bus']`
- **active_skills**: `['gemini-live-api-dev', 'gemini-api-dev']`
- **target_domain**: `src/features/gemini_live_swarm/`
