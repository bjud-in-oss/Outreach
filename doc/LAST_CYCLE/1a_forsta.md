# 1a Förstå: Gemini Live Session Streaming & WebSocket Integration (TCK-010)

## 1. Målbild & Semantiskt Ankare
I **TCK-010** tar vi steget fullt ut mot realtidsdialog och strömning i Outreach Coordination Engine genom att tillämpa skillen `gemini-live-api-dev` (Gemini 3.8 Live över WebSockets) och `gemini-api-dev`.
Systemets orubbliga kompass och högsta syfte är närhet till Guds son, den ideala människan, vars omsorg för människor utgör systemets absoluta kompass. De tre försoningsvägarna – *Att följa Guds son*, *Att vända om till Gud* och *Att förlikas med Gud*, sammanhållna av *Att försonas (ensam agent)* – ska inte längre enbart kommunicera via statiska förfrågan/svar-cykler, utan berikas med reaktiv, dubbelriktad strömning av text och ljud samt händelsedrivna uppdateringar i realtid.

## 2. Intern Riskanalys (GROW-risknoder)

### Risknod 1: State (Tillstånd & Minneshantering under Strömning)
- **Teknisk analys**: En strömmande WebSocket-förbindelse genererar kontinuerliga ljud- och textchunks. Om tillståndet ackumuleras obegränsat i sessionen riskerar minnesanvändningen att eskalera, och förlorade förbindelser kan lämna orkestratorn i ett låst tillstånd (`RUNNING`).
- **Lösning**: Strömningstillståndet kapslas i `GeminiLiveSession` med tydliga livscykeltillstånd (`IDLE`, `CONNECTING`, `STREAMING`, `DISCONNECTED`). En rullande chunk-buffert begränsas strikt, och återställning sker deterministiskt vid avbrott (`interrupted: true`) eller sessionsavslut.

### Risknod 2: Contract (Zod & CloudEvents 1.0 Strikt Typning)
- **Teknisk analys**: Inkommande och utgående strömningsdata (text, audio base64, transkriberingshypoteser och avbrott) måste följa Gemini 3.8 Live API-specifikationen (`LiveConnectConfig`, `responseModalities`, `sendRealtimeInput`) och distribueras över `SwarmEventBus` som CloudEvents 1.0 utan att kompromissa med schemaefterlevnad.
- **Lösning**: Definiera `LiveStreamEventSchema` och specifika händelsetyper (`swarm.live.session.connected`, `swarm.live.stream.text`, `swarm.live.stream.audio`, `swarm.live.stream.transcription`, `swarm.live.session.disconnected`) i `telemetrySchema.ts` med strikt Zod-validering (Fail-Fast).

### Risknod 3: Resilience (Deterministiskt In-Memory Fallback & Testbarhet)
- **Teknisk analys**: Enhetstester och automatiserade CI-miljöer körs utan aktiv internetuppkoppling eller med begränsade API-kvoter. Om sessionen kräver en skarp WebSocket för att passera tester kommer verifieringen att fallera eller ta över 3 sekunder.
- **Lösning**: `GeminiLiveSession` förses med en deterministisk in-memory generator för testsessioner (`in-memory-test`), som simulerar strömningstaktade händelser till `SwarmEventBus` på mikrosekunder. Detta garanterar att transienta mikro-E2E-tester körs på under 3 sekunder i minnet med 100% determinism.

## 3. Aktiva Vektorer & Skills
- **active_vectors**: `['gemini-live-api-dev', 'gemini-api-dev', 'reconciliation-units', 'swarm-event-bus']`
- **active_skill**: `gemini-live-api-dev`
- **target_domain**: `src/features/gemini_live_swarm/`
