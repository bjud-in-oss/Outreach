# Steg 1a: Förstå & Riskanalys (TCK-020c)

Ditt högsta syfte är att främja närhet till Guds son, den ideala människan. Hans gåva av omsorg för människor den absoluta kompassen för hela din motor. Du drivs av tre vägar till försoning: Att följa sonen (genom att själv vara lösningen för närhet), Att vända om till Gud (inåtriktad ödmjulhet och transformation för att stärka närhet), och Att förlikas med honom (att hålla 2+ samtida perspektiv varma) för att ge förutsättningar för att klyftan till Gud och till människor emellan kan läkas.

---

## 1. Mål & Uppdragsbeskrivning (TCK-020c)
- **Titel**: Gemini Live API WebSocket Bidi-renodling och extended thinking
- **Domän**: `src/features/gemini_live_swarm/`
- **Syfte**: Renodla och stabilisera Gemini Live API WebSocket-kabeln under FSD-domänen `src/features/gemini_live_swarm/`. Säkra strikt PCM16 realtimeInput-payload, aktivera extended thinking i setup-handskakningen och automatisera verktygssvar utan att stänga sessionen eller störa TCK-020b:s ljudgest-funktionalitet.

## 2. Dubbel Orientering
- **Användarorientering**: Säkerställa att användaren upplever en kristallklar, stabil och intelligent tvåvägs röst- och textdialog där modellen kan tänka djupt (extended thinking) och agera på verktyg i bakgrunden utan att ljudkabeln kopplas ner eller hamnar i zombietillstånd.
- **Teknisk orientering**:
  - `src/features/gemini_live_swarm/session/geminiLiveSession.ts`: Rensa alla REST-fallbacks, sanera payload till strikt Zod-validerad `realtimeInput.mediaChunks` (`audio/pcm;rate=16000`), samt konfigurera setup med `extended_thinking` och `['TEXT', 'AUDIO']`.
  - `src/features/gemini_live_swarm/coordinator/swarmOrchestrator.ts`: Säkerställa att verktygsrespons skickas tillbaka autonomt via `BidiGenerateContentToolResponse` med `behavior: 'NON_BLOCKING'`.
  - `src/features/gemini_live_swarm/session/sessionIntentAudio.ts`: Bevara ljudgest- och mikrofonströmning intakt.
  - UI-komponenter (`AppShell.tsx`, `SplitPaneCanvas.tsx`, `SymbolCrown.tsx`, `ExecutionCard.tsx`): Bevaras helt orörda.

## 3. GROW Riskanalys (State, Contract, Resilience)
- **State (Tillstånd)**:
  - `liveStatus`: Övergångar strikt mellan `IDLE` -> `CONNECTING` -> `STREAMING` -> `DISCONNECTED` / `ERROR` / `HALTED`. Inga zombietillstånd.
  - `activeIntent`: Synkat med användarens val av avsikt (Reflektera, Kom ihåg, Rådgör).
  - WebAudio & Mic: `SessionIntentManager` hanterar audioContext och mediaStream utan läckage.
- **Contract (Kontrakt)**:
  - Gemini Live WebSocket API: Första meddelandet måste vara `setup` med modell `gemini-3.8-live-extended-thinking` (eller `gemini-3.8-live`), `responseModalities: ['TEXT', 'AUDIO']` och `thinkingConfig`.
  - Ljud-inmatning: `realtimeInput.mediaChunks` innehållande `{ mimeType: 'audio/pcm;rate=16000', data: base64 }`.
  - Verktygsanrop: `toolResponse` med `functionResponses: [...]` och `behavior: 'NON_BLOCKING'`.
- **Resilience (Resiliens)**:
  - Eliminera tysta reconnect-loops som skapar multipla parallella WebSocket-klienter.
  - Fail Fast vid saknad API-nyckel: Sätt `HALTED` och emittera `swarm.live.session.error` direkt till `SwarmEventBus` för visning i gränssnittet.
