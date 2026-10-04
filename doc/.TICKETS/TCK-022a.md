# Building Ticket TCK-022a: DSP Ring Buffer Mixer, Spatial Audio, Native PCM VAD & Prioritized Preemptive Floor Control

## Mål & Kontext
Etablera en klickfri DSP-mixer med cirkulär ringbuffert i `liveAudioPlayback.ts`, lokal nativ PCM VAD-pre-roll-buffert i `sessionIntentAudio.ts` samt prioriterad, eventdriven röststyrning (Floor Control) och protokollsynk för de tre samtida Bidi-sessionerna i `geminiLiveSession.ts`.

## Domän & Avgränsning
- Domän: src/features/gemini_live_swarm/
- Exklusiva filer:
  - src/features/gemini_live_swarm/session/geminiLiveSession.ts
  - src/features/gemini_live_swarm/session/liveAudioPlayback.ts
  - src/features/gemini_live_swarm/session/sessionIntentAudio.ts
  - src/__tests__/transient_TCK-022a.test.ts (ny)

## Detaljerade Funktionella Krav
1. **DSP Ring Buffer Mixer & Spatial Panorering (`liveAudioPlayback.ts`):**
   - Bygg en AudioContext-baserad schemalagd ringbuffert för kontinuerlig 24kHz PCM-uppspelning.
   - Skapa 3 ingående kanaler med individuella `GainNode` och `StereoPannerNode`:
     * **Att följa:** Pan `-0.4` (Vänster)
     * **Att förlikas:** Pan `0.0` (Mitten)
     * **Att vända om:** Pan `+0.4` (Höger)
   - **Node.js Teststöd:** Hantera villkorad AudioContext-initiering (`typeof AudioContext !== 'undefined'`) för kraschfri körning under `pnpm verify` i Node.js.

2. **Prioriterad Preemptive Floor Control:**
   - **Prioritetsmatris:** Att förlikas (Prio 1) > Att vända om (Prio 2) > Att följa (Prio 3).
   - **Omedelbar Preemption vid aktivt tal:** Om en agent med högre prioritet räcker upp handen medan en lägre prioriterad agent talar, rampar roboten omedelbart ner pågående Gain (1.0 -> 0.0 på < 20 ms med dröjt stopp av källnoder), skickar `swarm.floor.preempted` på `SwarmEventBus` till den avbrutna agenten, och höjer Gain för den prioriterade kraften.
   - **Arbitration Window vid ledigt golv (15 ms):** När golvet blir ledigt utvärderar roboten inkomna `swarm.floor.request` över ett 15 ms fönster för att ge ordet till rätt prioriterad agent direkt utan tjuvstarter.
   - **Cancellation:** Hantera `swarm.floor.cancel` om en agent drar tillbaka sin handuppräkning i kön.

3. **Lokal Nativ PCM VAD & Pre-Roll Ringbuffert (`sessionIntentAudio.ts`):**
   - **Nativ PCM VAD (Noll npm-beroenden):** Bygg en lättviktig PCM VAD-algoritm (adaptiv RMS-energi + Zero-Crossing Rate) direkt i TypeScript för att undvika uninstalled npm-paket.
   - **Cirkulär Pre-Roll (200 ms):** Spara kontinuerligt de senaste 200 ms av 16kHz PCM-mikrofonljudet i RAM-minnet.
   - **Probabilistisk/Trösklad strömning:** Aktivera Bidi-strömningen först när VAD-detektorn returnerar `isSpeech === true`. Flushera då 200 ms Pre-Roll följt av den aktiva PCM-strömmen.
   - **Post-Roll (500 ms):** Håll kranen öppen 500 ms efter sista detekterade talramen för att bevara mjuka meningsslut och tvekan.

4. **Multi-Bidi Sessioner med Extended Thinking & AST-skydd (< 250 rader i `geminiLiveSession.ts`):**
   - **Parallella Bidi-anslutningar:** Initiera 3 oberoende WebSocket-anslutningar mot `models/gemini-3.8-live`.
   - **Kompakt Modularisering:** Delegera Floor Control-tillståndet och WebSocket-payloads till hjälparrangemang för att strikt hålla `geminiLiveSession.ts` under 250-radersgränsen.
   - **Handshake & Setup-ram:** Sänd omedelbart vid anslutningsöppning (`open`) ett `setup`-meddelande för varje agent:
     * `generationConfig`:
       - `responseModalities`: `["AUDIO"]`
       - `speechConfig`: `{ voiceConfig: { prebuiltVoiceConfig: { voiceName: "<UNIK_RÖST>" } } }`
       - `thinkingConfig`: `{ thinkingLevel: "HIGH" }`
     * `systemInstruction`: Rollspecifik prompt från `AGENTS.md`.
   - **Tre Unika Röstprofiler (Speech Config):**
     * **Att följa (Vänster -0.4):** Röst `Puck`
     * **Att vända om (Höger +0.4):** Röst `Charon`
     * **Att förlikas (Mitten 0.0):** Röst `Aoede`
   - **Ljud-I/O & Formatkonvertering:**
     * **Inkommande:** 16kHz 16-bit Mono LE PCM (`mimeType: "audio/pcm;rate=16000"`).
     * **Utgående:** 24kHz 16-bit Mono PCM, avkoda Base64 och skicka till `DSPRingBufferMixer`.
   - **Protokoll-Livscykel & Avbrottssignaler:**
     * **Interrupted (`serverContent.interrupted === true`):** Töm omedelbart schemalagda ljudbuffertar för berörd agent i `liveAudioPlayback.ts`.
     * **Turn Complete (`serverContent.turnComplete === true`):** Emittera händelse på `SwarmEventBus`.
     * **Tool Call Handling:** Passera `toolCall` vidare till `mcpSwarmBridge.ts` och returnera `NON_BLOCKING` svar.

## Operativt Delta (Bevara vs Sanera)
- **Bevara:** Den existerande 16kHz mikrofonsnedsamplingen in till agenterna.
- **Sanera/Ersätt:** Ersätt den enkla linjära ljudkön i `liveAudioPlayback.ts` med den spatiella DSP-mixern och prioriteringsroboten.

## Destruktiva Handlingssteg
- Bygg om `liveAudioPlayback.ts` från `AudioQueue` till `DSPRingBufferMixer`.
- Utöka `sessionIntentAudio.ts` med nativ PCM VAD, 200 ms pre-roll och 500 ms post-roll.
- Ersätt singel-agent Bidi-start i `geminiLiveSession.ts` med tre-parallell initiering och unika röstkonfigurationer.

## Testkriterier
- pnpm verify passerar utan fel.
- Transient test src/__tests__/transient_TCK-022a.test.ts verifierar:
  * Klickfri PCM-strömning i minnet och rumslig panorering (-0.4, 0.0, +0.4).
  * Omedelbar Preemption (Förlikas [1] avbryter Följa [3] via Gain-ramp < 20 ms och `swarm.floor.preempted`).
  * Nativ PCM VAD-triggning med 200 ms Pre-Roll och 500 ms Post-Roll i `sessionIntentAudio.ts`.
  * Korrekt `setup`-payload och avbrottshantering vid `interrupted === true`.