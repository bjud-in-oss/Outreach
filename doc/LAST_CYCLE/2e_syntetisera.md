# 2e Syntetisera: Sammanfogning av Insikter & Mättnadsanalys (TCK-011)

## 1. Mättnadsanalys
- **MÄTTNAD: JA**
- Samtliga målkonflikter mellan behovet av realtidskommunikation och respekten för användarens arbetsro har lösts.
- Systemet är som standard helt tyst under flerstegskörningar, men svarar direkt och personligt med röst när en specifik enhet tilltalas eller när Token Gate nås för att inhämta användarens godkännande.
- Arkitekturen bevarar fullständig testbarhet i minnet (< 3s) utan externa hårdvaruberoenden.

## 2. Syntes av Förändringskedjan (Fas 2 Förberedelse)
1. **Telemetrikontrakt (`telemetrySchema.ts`)**:
   - Inför `AudioTriggerReasonSchema`, `AudioOutputStateSchema` och utöka `SwarmTelemetrySnapshotSchema`.
   - Exportera `detectUnitInvocation` för deterministisk namndetektion.
2. **Reaktiv Telemetrihook (`useSwarmTelemetry.ts`)**:
   - Håll `audioOutputState.isMuted: true` som standard under körning.
   - Reaktivt lyssna på inkommande användarhändelser och matcha mot `detectUnitInvocation`.
   - Reaktivt lyssna på `swarm.serial.*`: om `currentStage === '3c_spec'` eller `stageStatus === 'GATED'`, aktivera högtalare med `TOKEN_GATE`.
3. **EventBus Hjälparmetod (`swarmEventBus.ts`)**:
   - `publishAudioState(state: AudioOutputState): EventEnvelope`.
4. **Gränssnittskomponent (`SwarmDashboard.tsx`)**:
   - Lägg till en ljudstatusbanner och volymkontroll som visar aktuell ljudstatus och talande enhet.
5. **Kvalitetssäkring (`src/__tests__/transient_TCK-011.test.ts`)**:
   - Validerar tystnadsspärr, namnanrop och Token Gate-aktivering i minnet (< 3s).
6. **Token Gate Spärr**:
   - Stopp sker vid Steg 3c. Koden för godkännande lagras i `doc/LAST_CYCLE/REQUIRED_TOKEN.txt`.
