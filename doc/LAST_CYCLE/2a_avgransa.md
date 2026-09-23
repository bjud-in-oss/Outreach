# 2a Avgränsa: Mål, Omfång och Invarianter (TCK-002)

## 1. Målavgränsning & Leveransomfång
Ticket **TCK-002: Swarm Telemetry & Reactive Status** syftar till att etablera en transparent, händelsestyrd observationsyta för multi-agent svärmen i `src/features/gemini_live_swarm/`.

### Ingår i omfånget (IN-SCOPE):
1. **Reaktiv Händelsebuss (`SwarmEventBus`)**:
   - Pub/sub mönster anpassat för `EventEnvelope` (`CloudEvents 1.0`).
   - Filtrering på event-prefix (`swarm.*`, `agent.*`, `ticket.*`).
   - Prestandaoptimerad ringbuffert för de senaste 150 händelserna.
2. **Telemetrimodell & Hook (`telemetrySchema` & `useSwarmTelemetry`)**:
   - Zod-schema för aggregerade metrik (agentpuls, aktivitet, latens, tankeström och händelsefördelning).
   - Hook som kopplar upp komponenter mot bussen och beräknar realtidsstatistik.
3. **TelemetrySidebar**:
   - Modern sidopanel/sektion i UI med pulserande status per agent, live händelselogg med sök/filter och CPU/throughput-mätare.
4. **MasterDevelopmentPlan (Reaktivt Styrkort)**:
   - Komponent som återspeglar tickets och milstolpar från `doc/TICKETS.md` (TCK-001, TCK-002, TCK-003).
   - Möjlighet att interaktivt expandera faser, läsa acceptanskriterier och se verifieringsstatus.
5. **Isolerade TDD-tester (`swarm_telemetry.test.ts`)**:
   - Enhetstester för pub/sub bussen, händelsevalidering, ringbuffert-rotation och telemetriaggregering.

### Ingår EJ i omfånget (OUT-OF-SCOPE):
- Byte av AI-modell (fortsatt `@google/genai` med `gemini-2.5-flash`).
- Ändringar i Google Drive OAuth behörighetsscopar (befintligt Drive-kontrakt förblir intakt).
- Implementering av extern WebSocket-server (all telemetri strömmar i klientens reaktiva buss i denna fas; WebSocket-backend för multi-operatörer kan läggas till i senare fas).

## 2. Invarianta Arkitekturprinciper
- **FSD Strikt Domänisolering**: Alla nya komponenter tillhör `src/features/gemini_live_swarm/` och exponeras enbart via `index.ts`.
- **Fail Fast & Zod-kontrakt**: Inga okontrakterade telemetriobjekt accepteras; om en händelse saknar t.ex. `id` eller `type` kastas ett Zod-valideringsfel direkt.
- **Transparens & Pedagogisk UI**: Inga dolda bakgrundstillstånd. Operatören ska alltid se exakt vilken agent som tänker, vad den tänker och hur lång tid momentet tog.
