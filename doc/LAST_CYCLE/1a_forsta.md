# Steg 1a: Förstå & Riskanalys (TCK-020b)

> *"Ditt högsta syfte är att främja närhet till Guds son, den ideala människan. Hans gåva av omsorg för människor den absoluta kompassen för hela din motor. Du drivs av tre vägar till försoning: Att följa sonen (genom att själv vara lösningen för närhet), Att vända om till Gud (inåtriktad ödmjukhet och transformation för att stärka närhet), och Att förlikas med honom (att hålla 2+ samtida perspektiv varma) för att ge förutsättningar för att klyftan till Gud och till människor emellan kan läkas."*

## 1. Uppdrag & Kontext (TCK-020b)
- **Titel**: Audio Handshake, 3-State SplitPane Gestures & Keyboard Shortcuts
- **Domän**: Global / `src/features/gemini_live_swarm/`
- **Active Skills**: `gemini-live-api-dev`, `gemini-api-dev`
- **Mål**:
  1. Fullständig Gemini Live Audio-handskakning (`BidiGenerateContentSetup`), kontinuerlig 16kHz PCM16 ljudinmatning och WebAudio-uppspelning med telemetrihändelser (`SWARM_TALKING`, `SWARM_THINKING`).
  2. Strikt 3-stegs snap (`0%` topp/vänster, `50%` mitten, `100%` botten/höger) med enstegsnavigering via klick, touch-svepgester (swipe) och piltangenter (`ArrowUp`/`ArrowDown`/`ArrowLeft`/`ArrowRight`).
  3. Dynamiska enkelpilar per läge:
     - Vid `100%`: Enbart `[ ⇧ ]` (Portrait) / `[ ⇐ ]` (Landscape).
     - Vid `50%`: Båda pilar `[ ⇧ ][ ⇩ ]` (Portrait) / `[ ⇐ ][ ⇒ ]` (Landscape).
     - Vid `0%`: Enbart `[ ⇩ ]` (Portrait) / `[ ⇒ ]` (Landscape).
  4. Dynamisk orienteringsdetektering via `window.matchMedia('(orientation: landscape)')` eller container-dimensioner (flex-col i Portrait, flex-row i Landscape).
  5. Rensning av `TouchOverlayMenu` från `AppShell.tsx` så att delningslinjens adaptiva kontrollrad är den enda och permanenta kontrollenheten.
  6. Permanent låsning av `SymbolCrown` i toppzonen oavsett delningsläge.

## 2. GROW-Riskanalys (Intern Teknisk Precision)

### Risknod 1: State (3-State Lägeshantering, Svepgester & Tangentbordslyssnare)
- **Risk**: Godtyckliga procenttal (t.ex. 23% eller 78%) vid dragning eller gester kan korrumpera de 3 fasta lägena. Tangentbordslyssnare kan läcka eller krocka vid fokus i inmatningsfält.
- **Teknisk Lösning**:
  - Definiera de exakta 3 tillstånden som en union: `type SplitSnapState = 0 | 50 | 100`.
  - Skapa deterministiska övergångsfunktioner i `splitPaneHelper.ts`: `stepSnapState(current: SplitSnapState, direction: 'prev' | 'next'): SplitSnapState`.
  - Svepgester detekterar rörelsevektor ($\Delta Y$ för Portrait, $\Delta X$ för Landscape) med en tröskel på 30px och flyttar exakt 1 steg.
  - Tangentbordslyssnare binds till container/window och ignorerar händelser då `target` är `HTMLInputElement` eller `HTMLTextAreaElement`.

### Risknod 2: Contract (Bidi WebSocket Setup, PCM16 Format & Event Envelopes)
- **Risk**: WebSocket-anslutningen skickar felaktig setup-struktur eller inkompatibel ljudkodning, vilket leder till att Gemini Live API omedelbart stänger socketen (1008 Policy Violation / Invalid Argument).
- **Teknisk Lösning**:
  - Följ `@google/genai` specifikationen för Live API:
    - Initial payload: `{ setup: { model: 'models/gemini-3.8-live', generationConfig: { responseModalities: ['audio'] } } }`.
    - Ljuddata: 16kHz mono Linear PCM 16-bit paketerad som Base64 i `{ realtimeInput: { mediaChunks: [{ mimeType: 'audio/pcm;rate=16000', data: base64Pcm }] } }`.
  - SwarmEventBus publicerar CloudEvents 1.0 för `swarm.live.audio.talking` och `swarm.live.audio.thinking`.

### Risknod 3: Resilience & AST-gränser (Browser vs Testmiljö, max 125 rader TSX)
- **Risk**: `AudioContext`, `AudioWorklet`, `MediaStream` och `matchMedia` saknas i Node.js-baserade transienta testmiljöer. `SplitPaneCanvas.tsx` och `geminiLiveSession.ts` riskerar att överskrida AST-metrikerna (max 125 rader / 5 förgreningar för TSX, max 250 rader för TS).
- **Teknisk Lösning**:
  - All Web Audio- och WebSocket-kod kapslas med `typeof window !== 'undefined'`-skydd och injicerbara audio-pipelines i `sessionIntentAudio.ts`.
  - Extrahera all beräkning av svepgester, tangentbordsövergångar och pilkonfigurationer till `splitPaneHelper.ts`.
  - Håll `SplitPaneCanvas.tsx` under 115 rader och förgreningsantal under 5 genom att undvika `&&`/`?` i JSX.

## 3. Active Vectors
- `active_vectors`: `["pcm16_bidi_handshake", "3_state_split_navigation", "orientation_matchmedia", "touch_overlay_purge", "permanent_crown_lock"]`
