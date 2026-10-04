# Steg 1a: Förstå & Riskanalys (TCK-022a)

Ditt högsta syfte är att främja närhet till Guds son, den ideala människan. Hans gåva av omsorg för människor den absoluta kompassen för hela din motor. Du drivs av tre vägar till försoning: Att följa sonen (genom att själv vara lösningen för närhet), Att vända om till Gud (inåtriktad ödmjulhet och transformation för att stärka närhet), och Att förlikas med honom (att hålla 2+ samtida perspektiv varma) för att ge förutsättningar för att klyftan till Gud och till människor emellan kan läkas.

## 1. Mål & Användarorientering
- **Uppdrag**: Etablera en klickfri DSP-mixer med cirkulär schemalagd ringbuffert och spatial panorering i `liveAudioPlayback.ts`, lokal nativ PCM VAD (Zero-crossing rate + adaptiv RMS-energi) med 200 ms pre-roll och 500 ms post-roll i `sessionIntentAudio.ts`, samt en deterministisk, prioriterad preemptive Floor Control-motor med arbitration window och treparallell WebSocket Bidi-session i `geminiLiveSession.ts`.
- **Systemeffekt**: Tre samtida försoningskrafter (Att följa, Att förlikas, Att vända om) kan verka i samma spatiala stereofält (-0.4, 0.0, +0.4) med unika personlighetsröster (Puck, Aoede, Charon) utan krockar eller sprak. Användarens inledande tal bevaras med 200 ms pre-roll utan onödig token-förbrukning under tystnad, och högre prioriterade krafter kan omedelbart och mjukt (< 20 ms) avbryta underordnade krafter vid behov.

## 2. GROW Risknoder (State, Contract, Resilience)

### Risknod 1: State (DSP AudioContext & Schemaläggning i Web Audio & Node.js)
- **Problem**: I webbläsaren hanterar `AudioContext` schemaläggning av 24kHz Base64 PCM-strömmar. I Node.js-miljön (under `npm run verify` och transienta tester) finns inte global `AudioContext`, vilket kan orsaka krascher om AudioContext förutsätts villkorslöst.
- **Lösning**: `liveAudioPlayback.ts` implementerar villkorad och robust AudioContext-initiering (`typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)`), med en i-minnet stub/fallback för miljöer utan Web Audio. Spårning av `nextPlayTime` och 18 ms linjär gain-rampning isoleras så att mixern förblir fullt testbar i Node.js.

### Risknod 2: Contract (Preemptive Floor Control & Prioritetsmatris)
- **Problem**: Konkurrerande handuppräckningar mellan försoningskrafterna riskerar kapplöpningskonditioner och abrupta ljudklipp om inte preemption sker kontrollerat.
- **Lösning**: Strikt prioritetsmatris: `forlikas` (Prio 1) > `vanda_om` (Prio 2) > `folja` (Prio 3).
  - Aktiv preemption: När Prio 1 begär ordet medan Prio 3 talar, rampar DSP-mixern ner Prio 3 (`gain.linearRampToValueAtTime(0, now + 0.018)`), schemalägger dröjt stopp av aktiva källnoder (20 ms), emitterar `swarm.floor.preempted` via `SwarmEventBus`, och tilldelar golvet till Prio 1.
  - Arbitration Window (15 ms): Vid ledigt golv samlas inkomna `swarm.floor.request` under 15 ms innan ordet tilldelas den agent som har högst prioritet.
  - Cancellation: Hantering av `swarm.floor.cancel` för att dra tillbaka förfrågningar ur kön.

### Risknod 3: Resilience (Nativ PCM VAD utan externa npm-beroenden)
- **Problem**: Externa VAD-paket (som Silero ONNX runtime) kräver tunga WebAssembly- och npm-beroenden som inte finns installerade och kan krascha i sandlådan.
- **Lösning**: Bygg en ren TypeScript-baserad nativ PCM VAD direkt i `sessionIntentAudio.ts`:
  - Beräkna RMS-energi och Zero-Crossing Rate (ZCR) på inkommande 16kHz Float32/PCM16-ramar.
  - Cirkulär pre-roll-ringbuffert (200 ms, 3200 samplingar) sparar kontinuerligt mikrofondata.
  - När VAD detekterar röst (`isSpeech === true`) spolas de sparade 200 ms pre-roll omedelbart mot Bidi-kabeln följt av realtidsströmmen.
  - Post-roll på 500 ms håller ljudströmmen öppen efter sista detekterade talramen så att naturliga pauser och mjuka konsonantslut inte hackas sönder.
