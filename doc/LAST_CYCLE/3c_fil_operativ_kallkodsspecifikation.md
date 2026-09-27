# 3c Fil-operativ Källkodsspecifikation (TCK-011)

## 1. Översikt över Förändringskedjan (Fas 2)

Följande filer är specificerade för källkodsändring under Fas 2 så snart godkännandekoden (`TCK-011-SILENT-VOICE-TOKEN`) bekräftats:

---

### Fil 1: `src/features/gemini_live_swarm/telemetry/telemetrySchema.ts` (MODIFIERING)
- **Förändringar**:
  1. Definiera `AudioTriggerReasonSchema`: `z.enum(['DEFAULT_SILENCE', 'NAME_INVOCATION', 'TOKEN_GATE', 'MANUAL_UNMUTE'])`.
  2. Definiera `AudioOutputStateSchema`: `{ isMuted: z.boolean(), activeSpeakerUnitId: z.string().optional(), activeForce: AgentForceSchema.optional(), triggerReason: AudioTriggerReasonSchema.optional(), lastChangedAt: z.string() }`.
  3. Utöka `SwarmTelemetrySnapshotSchema` med `audioOutput: AudioOutputStateSchema.optional()`.
  4. Exportera `detectUnitInvocation(input: string)`.

---

### Fil 2: `src/features/gemini_live_swarm/bus/swarmEventBus.ts` (MODIFIERING)
- **Förändringar**:
  1. Lägg till `publishAudioState(state: AudioOutputState): EventEnvelope` som publicerar CloudEvents 1.0 av typen `swarm.audio.state.changed`.

---

### Fil 3: `src/features/gemini_live_swarm/telemetry/useSwarmTelemetry.ts` (MODIFIERING)
- **Förändringar**:
  1. Håll internt `audioOutputState` med `{ isMuted: true, triggerReason: 'DEFAULT_SILENCE', lastChangedAt: ... }`.
  2. Vid inkommande användartext / transkribering: Kör `detectUnitInvocation`. Om träff, publicera `swarm.audio.state.changed` med `{ isMuted: false, activeSpeakerUnitId, activeForce, triggerReason: 'NAME_INVOCATION' }`.
  3. Vid seriell motor-händelse `swarm.serial.*` där `currentStage === '3c_spec'` eller `stageStatus === 'GATED'`: Aktivera ljudkanalen för `unit-seriell-motor` med `triggerReason: 'TOKEN_GATE'`.
  4. Exponera `toggleManualMute` och `triggerInvocation`.

---

### Fil 4: `src/features/gemini_live_swarm/ui/SwarmDashboard.tsx` (MODIFIERING)
- **Förändringar**:
  1. Lägg till visuell röstspärrsbanner i gränssnittet:
     - Ikon `VolumeX` vid tyst körning: "Tyst röstspärr aktiv: Bakgrundskörning i tystnad för att bevara fokus".
     - Ikon `Volume2` vid tal: "Högtalare aktiv: [Enhetsnamn] talar (Orsak: [Namnanrop / Token Gate])".
  2. Manuell knapp för att slå på/av ljud.

---

### Fil 5: `src/features/gemini_live_swarm/doc/DECISIONS.md` (MODIFIERING)
- **Förändringar**:
  1. Dokumentera **ADR-SWARM-009: Tyst Röstspärr och Selektiv Namnutlöst Ljudaktivering**.

---

### Fil 6: `src/__tests__/transient_TCK-011.test.ts` (NY TRANSIENT TESTFIL I FAS 2)
- **Testomfång** (< 3s i minnet):
  1. Validera att `AudioOutputStateSchema` och `detectUnitInvocation` fungerar deterministiskt.
  2. Validera att ljudkanalen hålls tyst (`isMuted: true`) under initial körning och normala flerstegshändelser.
  3. Validera att namnanrop på de 4 försoningsenheterna öppnar ljudkanalen för exakt den enheten.
  4. Validera att Token Gate (Steg 3c) automatiskt öppnar ljudkanalen för "Att försonas (ensam agent)".
  5. Validera återställning till tystnad efter taltur.

---

### Fil 7: `scripts/run-tests.js` & `src/__tests__/suite/e2e_regression.test.ts` (UPPDATERING I FAS 2)
- Registrera och kör `runTransientTCK011Tests`.
