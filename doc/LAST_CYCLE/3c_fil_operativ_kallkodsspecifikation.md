# 3c Fil-operativ Källkodsspecifikation (TCK-010)

## 1. Översikt över Förändringskedjan (Fas 2)

Följande filer är specificerade för källkodsändring under Fas 2 så snart godkännandekoden (`TCK-010-LIVE-STREAMING-TOKEN`) bekräftats via `pnpm genomfor`:

---

### Fil 1: `src/features/gemini_live_swarm/telemetry/telemetrySchema.ts` (MODIFIERING)
- **Förändringar**:
  1. Inför `LiveSessionStatusSchema`: `z.enum(['IDLE', 'CONNECTING', 'STREAMING', 'DISCONNECTED', 'ERROR'])`.
  2. Inför `LiveStreamChunkSchema`: Validerar `{ streamId, sourceRole, force, textChunk, audioChunkBase64, transcription, isFinal, timestamp }`.
  3. Exportera typerna `LiveSessionStatus` och `LiveStreamChunk`.

---

### Fil 2: `src/features/gemini_live_swarm/session/geminiLiveSession.ts` (MODIFIERING)
- **Förändringar**:
  1. Lägg till stöd för `gemini-3.8-live` anslutningshantering.
  2. Implementera metoder:
     - `connectLive(config?: { responseModalities?: ('audio' | 'text')[] }): Promise<boolean>`
     - `disconnectLive(): Promise<void>`
     - `isLiveConnected(): boolean`
     - `sendRealtimeText(text: string, force?: ReconciliationForce): Promise<void>`
     - `sendRealtimeAudio(audioChunkBase64: string, mimeType?: string): Promise<void>`
     - `onStreamChunk(listener: (chunk: LiveStreamChunk) => void): () => void`
  3. Knyt sessionen till `SwarmEventBus` och publicera CloudEvents (`swarm.live.*`).
  4. Implementera deterministisk in-memory strömning vid `'in-memory-test'` API-nyckel så att tester körs deterministiskt på < 3s utan externa API-krav.

---

### Fil 3: `src/features/gemini_live_swarm/bus/swarmEventBus.ts` (MODIFIERING)
- **Förändringar**:
  1. Implementera hjälparmetod `publishLiveEvent(type: string, data: Record<string, unknown>): EventEnvelope`.

---

### Fil 4: `src/features/gemini_live_swarm/doc/DECISIONS.md` (MODIFIERING)
- **Förändringar**:
  1. Dokumentera **ADR-SWARM-008: Gemini 3.8 Live Dubbelriktad Strömning och Reaktiv Försoningsdistribution**.

---

### Fil 5: `src/__tests__/transient_TCK-010.test.ts` (NY TRANSIENT TESTFIL I FAS 2)
- **Testomfång** (< 3s i minnet):
  1. Validera att `LiveSessionStatusSchema` och `LiveStreamChunkSchema` validerar Fail-Fast.
  2. Validera att `GeminiLiveSession` ansluter och sänder `swarm.live.session.connected`.
  3. Validera att `sendRealtimeText` och `sendRealtimeAudio` genererar CloudEvents till `SwarmEventBus`.
  4. Validera att strömningschunks tas emot och kan konsumeras av de 4 försoningsenheterna.
  5. Validera att `disconnectLive` rensar tillstånd och sänder `swarm.live.session.disconnected`.

---

### Fil 6: `scripts/run-tests.js` & `src/__tests__/suite/e2e_regression.test.ts` (UPPDATERING I FAS 2)
- Integrera `runTransientTCK010Tests` i testsviten.

---

### Fil 7: `doc/TICKETS.md` & `doc/TICKETS/TCK-010.md` (UPPDATERING I FAS 2)
- Uppdatera status till `[VERIFIERAD]` efter genomförande.
