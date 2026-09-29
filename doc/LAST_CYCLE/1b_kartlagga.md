# 1b Kartlägga: Åtgärda React Render-State Krock & Röstspår Telemetrisynk (TCK-014)

## 1. Kartläggning av Källkodsartefakter

### 1.1 `src/features/gemini_live_swarm/telemetry/useSwarmTelemetry.ts`
- **Nuvarande problem**:
  - `toggleManualMute`: Utför `bus.publishAudioState(newAudioState)` inuti `setSnapshot((prev) => { ... })`. Detta orsakar omedelbart synkront anrop till eventbussens prenumeranter medan React befinner sig mitt i uppdateringsfasen.
  - `triggerInvocation`: Utför både `bus.publishAudioState` och manuell `setSnapshot`, vilket leder till dubbla motstridiga renderingscykler.
- **Förändringsbehov**:
  - Flytta `bus.publishAudioState` ut ur `setSnapshot`-updaters.
  - Beräkna nästa ljudtillstånd baserat på senaste kända tillstånd eller ref, publicera till bussen, och låt bussen uppdatera tillståndet via den vanliga prenumerationsslingan.

### 1.2 `src/features/gemini_live_swarm/ui/TelemetrySidebar.tsx`
- **Nuvarande problem**:
  - Anropar `useSwarmTelemetry(eventBus)` internt trots att föräldern `SwarmDashboard.tsx` redan kör en instans av `useSwarmTelemetry(eventBus)`.
  - Detta skapar två parallella `setSnapshot`-kedjor som triggas simultant av samma CloudEvents.
- **Förändringsbehov**:
  - Lägg till valfri prop `snapshot?: SwarmTelemetrySnapshot` i `TelemetrySidebarProps`.
  - Om `snapshot` skickas in används den direkt, utan att starta en separat duplicerad hook-instans. Om den inte skickas in faller komponenten tillbaka till `useSwarmTelemetry(eventBus)` för bakåtkompatibilitet.

### 1.3 `src/features/gemini_live_swarm/ui/SwarmDashboard.tsx`
- **Förändringsbehov**:
  - Skicka med `snapshot={snapshot}` till `<TelemetrySidebar eventBus={eventBus} snapshot={snapshot} />`.
  - Säkra att klick på "öppna röstspår" och verbanrop propageras asynkront och rent utan synkrona renderkrockar.

### 1.4 Test & Verifiering
- **`src/__tests__/transient_TCK-014.test.ts`**:
  - Verifiera att `toggleManualMute` och `triggerInvocation` inte utför synkrona `setSnapshot`-krockar.
  - Verifiera att `TelemetrySidebar` renderas korrekt med nedskickad `snapshot` prop.
  - Verifiera att röstspårsövergångar uppdaterar telemetri utan att kasta undantag.
