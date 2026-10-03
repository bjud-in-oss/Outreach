# Building Ticket TCK-020c: Gemini Live API WebSocket Bidi-renodling och extended thinking

## Mål & Kontext
Renodla och stabilisera Gemini Live API WebSocket-kabeln under FSD-domänen src/features/gemini_live_swarm/. Säkra strikt PCM16 realtimeInput-payload, aktivera extended thinking i setup-handskakningen och automatisera verktygssvar utan att stänga sessionen eller störa TCK-020b:s ljudgest-funktionalitet.

## Avgränsning
- Exklusiv FSD-domän: src/features/gemini_live_swarm/

## Defensiva Antaganden (Bevaras orört)
- UI-skal (AppShell.tsx, SplitPaneCanvas.tsx, SymbolCrown.tsx, ExecutionCard.tsx) bevaras orörda.
- Nytt ljudgest-stöd under src/features/gemini_live_swarm/session/sessionIntentAudio.ts bevaras orört.
- SwarmContext.tsx och swarmEventBus.ts behålls som centrala event-nav.

## Destruktiva Handlingssteg (Raderas / Ersätts helt)
- Radera all REST/HTTP-anropskod, REST-fallbacks och dubbla API-nyckelvägar under src/features/gemini_live_swarm/session/geminiLiveSession.ts.
- Radera platta/föråldrade audio-payloadbyggare i geminiLiveSession.ts och ersätt med strikt Zod-validerad realtimeInput.mediaChunks-struktur (mimeType: "audio/pcm;rate=16000").
- Radera manuella reconnect-loops i WebSocket-klienten som skapar dolda zombiekablar.

## Genomförande
1. Konfigurera setup-meddelandet över Bidi WebSocket med extended_thinking och responseModalities ["TEXT", "AUDIO"].
2. Implementera strikt packaging av PCM16 16kHz-ljudchunkiar under realtimeInput.mediaChunks i geminiLiveSession.ts samtidigt som hooks mot sessionIntentAudio.ts hålls intakta.
3. Koppla swarmOrchestrator.ts till WebSocket-eventbussen för att autonomt returnera toolResponse satt till NON_BLOCKING vid verktygsanrop.
4. Skapa ett isolerat transient test under src/__tests__/transient_TCK-020c.test.ts som verifierar handskakning och mockad PCM16-ljudström på < 3 sekunder.

## Testkriterier
- pnpm verify passerar utan Zod- eller TypeScript-fel.
- Transient mikro-E2E-test köres i minnet på under 3 sekunder utan kollisioner med TCK-020b:s tester.