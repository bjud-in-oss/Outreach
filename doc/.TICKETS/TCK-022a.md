# Building Ticket TCK-022a: DSP Ring Buffer Mixer, Spatial Audio & Prioritized Preemptive Floor Control

## Mål & Kontext
Etablera en klickfri DSP-mixer med cirkulär ringbuffert i `liveAudioPlayback.ts`, lokal VAD-pre-roll-buffert i `sessionIntentAudio.ts` samt prioriterad, eventdriven röststyrning (Floor Control) och protokollsynk för de tre samtida Bidi-sessionerna i `geminiLiveSession.ts`.

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

2. **Prioriterad Preemptive Floor Control:**
   - **Prioritetsmatris:** Att förlikas (Prio 1) > Att vända om (Prio 2) > Att följa (Prio 3).
   - **Omedelbar Preemption vid aktivt tal:** Om en agent med högre prioritet räcker upp handen medan en lägre prioriterad agent talar, rampar roboten omedelbart ner pågående Gain (1.0 -> 0.0 på < 20 ms), skickar `swarm.floor.preempted` på `SwarmEventBus` till den avbrutna agenten, och höjer Gain för den prioriterade kraften.
   - **Arbitration Window vid ledigt golv (15 ms):** När golvet blir ledigt utvärderar roboten inkomna `swarm.floor.request` över ett 15 ms fönster för att ge ordet till rätt prioriterad agent direkt utan tjuvstarter.
   - **Cancellation:** Hantera `swarm.floor.cancel` om en agent drar tillbaka sin handuppräkning i kön.

3. **Lokal VAD & Pre-Roll Ringbuffert (`sessionIntentAudio.ts`):**
   - Spara kontinuerligt de senaste 200 ms av mikrofonljudet i en cirkulär RAM-buffert.
   - Vid pauser/rådslag hålls mikrofonljudet i bufferten och flushas mot Bidi-kabeln först när röstkanalen öppnas, så att inga inledande konsonanter eller ord klipps.

4. **Multi-Bidi Sessioner med Extended Thinking & Bidi-Protokoll (`geminiLiveSession.ts`):**
   - **Parallella Bidi-anslutningar:** Initiera 3 oberoende WebSocket-anslutningar mot `models/gemini-3.8-live`.
   - **Handshake & Setup-ram:** Sänd omedelbart vid anslutningsöppning (`open`) ett strikt `setup`-meddelande för varje agent:
     * `generationConfig`:
       - `responseModalities`: `["AUDIO"]`
       - `speechConfig`: `{ voiceConfig: { prebuiltVoiceConfig: { voiceName: "<UNIK_RÖST>" } } }`
       - `thinkingConfig`: `{ thinkingLevel: "HIGH" }` (Extended Thinking aktiverat för alla tre)
     * `systemInstruction`: Rollspecifik prompt från `AGENTS.md` för respektive kraft (*Att följa*, *Att vända om*, *Att förlikas*).
   - **Tre Unika Röstprofiler (Speech Config):**
     * **Att följa (Vänster -0.4):** Röst `Puck` (Aktiv, närvarande, handlingskraftig).
     * **Att vända om (Höger +0.4):** Röst `Charon` (Inåtriktad, djup, analytisk).
     * **Att förlikas (Mitten 0.0):** Röst `Kore` / `Aoede` (Balanserad, varm, försonande).
   - **Ljud-I/O & Formatkonvertering:**
     * **Inkommande mikrofonljud:** Konvertera PCM till 16kHz 16-bit Mono LE och skicka via `realtimeInput.mediaChunks` med `mimeType: "audio/pcm;rate=16000"`.
     * **Utgående agentljud:** Fånga `serverContent.modelTurn.parts[].inlineData.data` (24kHz 16-bit Mono PCM), avkoda från Base64 till `Float32Array` och mata direkt till motsvarande kanal i `DSPRingBufferMixer` (`liveAudioPlayback.ts`).
   - **Protokoll-Livscykel & Avbrottssignaler:**
     * **Interrupted (`serverContent.interrupted === true`):** Töm omedelbart alla schemalagda ljudbuffertar för berörd agent i `liveAudioPlayback.ts` och nollställ uppspelningskö.
     * **Turn Complete (`serverContent.turnComplete === true`):** Emittera händelse på `SwarmEventBus` för att signalera att agenten slutfört sitt yttrande.
     * **Tool Call Handling:** Passera inkommande `toolCall` vidare till `mcpSwarmBridge.ts` och returnera `NON_BLOCKING` svar enligt TCK-022b.

## Operativt Delta (Bevara vs Sanera)
- **Bevara:** Den existerande 16kHz mikrofonsnedsamplingen in till agenterna.
- **Sanera/Ersätt:** Ersätt den enkla linjära ljudkön i `liveAudioPlayback.ts` med den spatiella DSP-mixern och prioriteringsroboten.

## Destruktiva Handlingssteg
- Bygg om `liveAudioPlayback.ts` från `AudioQueue` till `DSPRingBufferMixer`.
- Ersätt singel-agent Bidi-start i `geminiLiveSession.ts` med tre-parallell initiering och unika röstkonfigurationer.

## Testkriterier
- pnpm verify passerar utan fel.
- Transient test src/__tests__/transient_TCK-022a.test.ts verifierar:
  * Klickfri PCM-strömning i minnet och rumslig panorering (-0.4, 0.0, +0.4).
  * Omedelbar Preemption (Förlikas [1] avbryter Följa [3] via Gain-ramp < 20 ms och `swarm.floor.preempted`).
  * 200 ms Pre-Roll-buffring i `sessionIntentAudio.ts`.
  * Korrekt `setup`-payload och avbrottshantering vid `interrupted === true`.