# 2b Modellera: Åtgärda React Render-State Krock & Röstspår Telemetrisynk (TCK-014)

## 1. Flödes- och Livscykelmodellering

### 1.1 Före TCK-014 (Krock och dubbla uppdateringar)
```
Användare klickar "Öppna röstkanal"
         │
         ▼
`toggleManualMute()`
         │
         ▼
`setSnapshot((prev) => {`
         │
         ├─► `bus.publishAudioState(newAudioState)` ──► Synkron notering av TelemetrySidebar
         │                                                      │
         │                                                      ▼
         │                                             `TelemetrySidebar.setSnapshot(...)`
         │                                                      │
         │                                                      💥 React Warning/Krock:
         │                                                      "Cannot update component while rendering"
         │
         └─► Returnerar nästa snapshot
```

### 1.2 Efter TCK-014 (Enkelriktat dataflöde och asynkron avisering)
```
Användare klickar "Öppna röstkanal"
         │
         ▼
`toggleManualMute()`
         │
         ├─► Beräknar `newAudioState` från `audioOutputRef.current`
         │
         ├─► Publicerar till bussen: `bus.publishAudioState(newAudioState)`
         │         │
         │         ▼
         │   `bus.subscribe` i `SwarmDashboard`
         │         │
         │         ▼
         │   `setSnapshot` körs en enda gång på toppen
         │         │
         │         ▼
         │   `SwarmDashboard` renderar om och skickar `snapshot` som prop
         │         │
         │         ▼
         └─► `TelemetrySidebar` tar emot uppdaterad `snapshot` via props
             (Ingen sekundär hook, ingen setState under render, ingen krock!)
```

---

## 2. Komponentgränssnitt

### 2.1 `TelemetrySidebarProps`
```ts
export interface TelemetrySidebarProps {
  eventBus?: SwarmEventBus;
  snapshot?: SwarmTelemetrySnapshot; // Valfri: injiceras från SwarmDashboard
  className?: string;
}
```

### 2.2 `useSwarmTelemetry` Refaktorering
- Använd en `audioOutputRef` för att hålla senaste ljudtillstånd så att `toggleManualMute` alltid har tillgång till det aktuella tillståndet utan att behöva läsa inuti `setSnapshot`.
- Publicera `newAudioState` via `bus.publishAudioState` utanför alla `setSnapshot`-anrop.
- Låt prenumerationslyssnaren i `useEffect` ansvara för att föra in tillståndet i `snapshot`.
