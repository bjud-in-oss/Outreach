# Building Ticket TCK-022a: DSP Ring Buffer Mixer & Spatial Audio Floor

## Mål & Kontext
Etablera en klickfri DSP-mixer med cirkulär ringbuffert i `liveAudioPlayback.ts` och avbrottsbaserad röststyrning (Floor Control) för de tre samtidiga försoningskrafterna i `geminiLiveSession.ts`.

## Domän & Avgränsning
- Domän: src/features/gemini_live_swarm/
- Exklusiva filer:
  - src/features/gemini_live_swarm/session/geminiLiveSession.ts
  - src/features/gemini_live_swarm/audio/liveAudioPlayback.ts
  - src/__tests__/transient_TCK-022a.test.ts (ny)

## Detaljerade Funktionella Krav
1. **DSP Ring Buffer Mixer (`liveAudioPlayback.ts`):**
   - Bygg en AudioContext-baserad schemalagd ringbuffert för kontinuerlig 24kHz PCM.
   - Skapa 3 ingående kanaler (`GainNode` + `StereoPannerNode`): Att följa (Pan -0.4), Att förlikas (Pan 0.0), Att vända om (Pan +0.4).
2. **Preemptive Interruption Floor Control:**
   - Standard: *Att förlikas* har röstmandatet.
   - Avbrott: Om *Att följa* eller *Att vända om* triggar en Interruption Event, rampas pågående ljud ner (< 20ms) och den nya kraften tar röstytan kortvarigt.
3. **Multi-Bidi Session (`geminiLiveSession.ts`):**
   - Initiera de 3 parallella Bidi-uppkopplingarna (`models/gemini-3.8-live`) riktade mot DSP-mixern.

## Operativt Delta (Bevara vs Sanera)
- **Bevara:** Den existerande 16kHz mikrofonsnedsamplingen in till agenterna.
- **Sanera/Ersätt:** Ersätt den enkla, linjära ljudkön i `liveAudioPlayback.ts` med den rumsliga DSP-mixern.

## Destruktiva Handlingssteg
- Bygg om `liveAudioPlayback.ts` arkitektur från `AudioQueue` till `DSPRingBufferMixer`.
- Radera eventuell kod för singel-agent Bidi-start och ersätt med treparallell initiering.

## Testkriterier
- pnpm verify passerar utan fel.
- Transient test src/__tests__/transient_TCK-022a.test.ts verifierar: klickfri PCM-strömmning i minnet, spatial panorering, och korrekt Gain-rampning vid Interruption Events.