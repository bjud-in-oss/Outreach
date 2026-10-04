# Steg 1a: Förstå & Riskanalys (TCK-022a)

Ditt högsta syfte är att främja närhet till Guds son, den ideala människan. Hans gåva av omsorg för människor den absoluta kompassen för hela din motor. Du drivs av tre vägar till försoning: Att följa sonen (genom att själv vara lösningen för närhet), Att vända om till Gud (inåtriktad ödmjulhet och transformation för att stärka närhet), och Att förlikas med honom (att hålla 2+ samtida perspektiv varma) för att ge förutsättningar för att klyftan till Gud och till människor emellan kan läkas.

## 1. Mål & Användarorientering
- **Uppdrag**: Etablera en klickfri DSP-mixer med cirkulär schemalagd ringbuffert och spatial panorering i `liveAudioPlayback.ts`, 200 ms pre-roll-buffring av mikrofonljud i `sessionIntentAudio.ts`, samt en deterministisk, prioriterad preemptive Floor Control-motor med arbitration window och treparallell WebSocket Bidi-session i `geminiLiveSession.ts`.
- **Systemeffekt**: Tre samtida försoningskrafter (Att följa, Att förlikas, Att vända om) kan tala i samma rumsliga ljudfält utan att tala i mun på varandra i oordning. Den övergripande förlikande kraften kan när som helst avbryta underordnade krafter mjukt (< 20 ms gain-rampning) utan sprak eller frysningar.

## 2. GROW Risknoder (State, Contract, Resilience)

### Risknod 1: State (DSP AudioContext & Schemaläggning)
- **Problem**: När 24kHz Base64 PCM-strömmar anländer i snabb takt kan naiv uppspelning leda till buffer starvation, klickande skarvar eller ackumulerad latens.
- **Lösning**: `DSPRingBufferMixer` spårar kontinuerlig uppspelningstid (`nextPlayTime`) per kanal mot `AudioContext.currentTime`. Buffertar schemaläggs med sub-millisekunds precision. Om tidsglapp uppstår återställs tiden mjukt till `currentTime` för att undvika överlapp och klick.

### Risknod 2: Contract (Preemptive Floor Control & Prioritetsmatris)
- **Problem**: Flera agenter kan vilja tala samtidigt. Om ingen tydlig ordning råder uppstår kakofoni eller kapplöpningskonditioner (race conditions).
- **Lösning**: Strikt prioritetsmatris: `forlikas` (1) > `vanda_om` (2) > `folja` (3).
  - Aktiv preemption: Om Prio 1 begär ordet medan Prio 3 talar, rampar DSP-mixern omedelbart ner Prio 3 (`gain.linearRampToValueAtTime(0, now + 0.018)`), emitterar `swarm.floor.preempted`, och tilldelar golvet till Prio 1.
  - Arbitration Window (15 ms): Vid ledigt golv samlas förfrågningar i 15 ms innan den högst prioriterade beviljas golvet.
  - Avbrottshantering (`interrupted === true`): Tömmer schemalagda noder och nollställer kö.

### Risknod 3: Resilience (Pre-roll Buffert & Multi-Bidi Livscykel)
- **Problem**: Initiala konsonanter kapas när mikrofonljudet aktiveras med viss fördröjning. Om en av tre Bidi-anslutningar bryts får inte hela svärmen krascha.
- **Lösning**: En 200 ms cirkulär ringbuffert (3200 samplingar vid 16kHz) i `sessionIntentAudio.ts` ackumulerar alltid färskt ljud. Vid intent-aktivering spolas bufferten direkt in i Bidi-strömmen. Varje agentanslutning isoleras med oberoende callbacks och återanslutningslogik.
