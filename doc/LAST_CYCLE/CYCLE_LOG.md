# CYCLE LOG: TCK-025

## Steg 1a
Intention & Användarnytta: Eliminera rösthackande vid High-Thinking genom trådisolering via Node worker_threads och AudioWorklet i webbläsaren. Skapa deterministisk VAD som garanterar Engine TTFT < 1 200 ms och separerar VAD Detection (~800 ms). Ersätta mittskenans tre knappar med en enda Start/Paus-brytare synkad med SwarmEventBus och VAD Auto-Listen. Vid Paus avbryts pågående thinking via AbortController och fryser tillståndet deterministiskt.

## Steg 0a
Kontraktsaudit: 1. Max 1 FSD-domän: src/features/gemini_live_swarm/ (session/ och ui/). 2. API-skills: @google/genai med Live API och worker_threads/AudioWorklet isolering. 3. Saneringskrav: Destruktiv sanering av de tre gamla mittskeneknapparna i SymbolCrown.tsx och AppShell.tsx, samt eliminering av monolitiskt ljudblock i huvudtråden.

## Steg 0b
Vägval & Förlikningsport: Att köra ljudbehandling och High-Thinking i samma JavaScript-huvudtråd leder till event loop-lagg och hackande röst. Trådisolering med Worker Threads/SharedArrayBuffer är den arkitektoniskt överlägsna vägen. Väg 2 (Godkänd för linjärt svep).

## Steg 1b
Kartlägg Domän & Systemgränser: Källkod berör src/features/gemini_live_swarm/session/ (liveAudioPlayback.ts, audioWorker.ts) och ui/ (SymbolCrown.tsx, AppShell.tsx). BDD-låsning sker i doc/features/voice_flow.feature och src/__tests__/bdd/voice_flow.test.ts samt src/__tests__/bdd/helpers/pcmGenerator.ts. Telemetri exporterar vadLatencyMs och engineTtftMs.

## Steg 2a
Avgränsa Tillstånd & Biverkningar: Ljudmixning sker i isolerad tråd via SharedArrayBuffer. Start/Paus-knapp styr sessionens livscykel: start sätter session i Auto-Listen och öppnar VAD; paus sänder AbortController.abort() till bakgrundsagenter, tystar ljudbuffert och fryser tillstånd i WAL/STATE.json.

## Steg 2b
Modellera Zod-kontrakt: VoiceFlowMetricsSchema

## Steg 2c
Utvärdera Resiliens & Felhantering: Fail-Fast om worker_threads inte kan startas eller om Engine TTFT överstiger 1 200 ms. Ren abort-signal hanteras kraschfritt av GeminiLiveSession och SwarmOrchestrator. Strikt efterlevnad av AST-mått (< 250 rader per .ts, < 125 rader per .tsx, noll produktionsmockar).

## Steg 2d
Syntetisk Vägvägning & Mognadskontroll: Vägning mot kraven i TCK-025 och SI v10.2. BDD-låsning och trådisolering skapar förutsägbarhet och hög användarnyttig responsivitet. human_decision_required: false.

## Steg 3a
Transient & BDD Testspecifikation: 1. doc/features/voice_flow.feature definierar BDD-scenarier för VAD (< 800 ms), Engine TTFT (< 1 200 ms) och Start/Paus-knappen. 2. src/__tests__/bdd/voice_flow.test.ts kör BDD-krav via pcmGenerator.ts (16kHz PCM-sinusvåg i minnet). 3. src/__tests__/transient_TCK-025.test.ts verifierar trådisolering, VAD/TTFT-mått, Start/Paus-knapp och AbortController.

## Steg 3b
Exakt Källkodsspecifikation under src/features/gemini_live_swarm/: 1. session/liveAudioPlayback.ts: Refaktorisera till trådisolerad DSP-ringbuffert med Worker/AudioWorklet stöd. 2. session/audioWorker.ts: Dedikerad trådkod för PCM-buffring och mixning. 3. ui/SymbolCrown.tsx & AppShell.tsx: Ersätt gamla mittknappar med 1 Start/Paus-knapp synkad via SwarmEventBus (swarm.session.toggle). 4. session/geminiLiveSession.ts: Integrera AbortController vid paus.

## Steg 2e
Operativt Delta (Destruktiv Sanering): 1. Radera mittskenans 3 gamla knappar i SymbolCrown.tsx och AppShell.tsx. 2. Radera synkron blockering i liveAudioPlayback.ts och ersätt med trådavlastning.

## Steg 3c
Slutgiltigt Byggkontrakt: Samtliga steg i Fas 1 är fullbordade och HMAC-kedjan är intakt. human_decision_required: false. Token genereras i doc/LAST_CYCLE/REQUIRED_TOKEN.txt.

