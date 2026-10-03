AKTIVT UPPDRAG: TCK-020c
Titel: Live Audio Piping & Fail-Fast Error Rendering via Gemini Docs MCP
Domän: Global / src/features/gemini_live_swarm/
Active Skills: gemini-live-api-dev, gemini-api-dev

Mål för TCK-020c:
1. Validera API-kontrakt via gemini-docs MCP:
   - Anropa search_documentation på MCP-servern gemini-docs för att verifiera @google/genai Live API-mönster för sendRealtimeInput (PCM16 16kHz mono base64) och anslutningsfel.
2. Bidi Audio Piping & Fail-Fast UI Alignment:
   - Vidarebefordra base64-kodade PCM16-mikrofonpaket direkt till WebSocket-sessionen vid aktiv röstström.
   - Rendera alla HALTED-, ERROR- och anslutningsfel i klartext i chattfönstret (SplitPaneCanva# Building Ticket TCK-020c: Gemini Live API WebSocket Bidi-renodling och extended thinking

## Mål & Kontext
Renodla och stabilisera Gemini Live API WebSocket-kabeln under FSD-domänen src/features/gemini_live_swarm/. Säkra strikt PCM16 realtimeInput-payload, aktivera extended thinking i setup-handskakningen och automatisera verktygssvar utan att stänga sessionen.

## Avgränsning
- Exklusiv FSD-domän: src/features/gemini_live_swarm/

## Defensiva Antaganden (Bevaras orört)
- UI-skal (AppShell.tsx, SplitPaneCanvas.tsx, SymbolCrown.tsx) bevaras helt orörda.
- SwarmContext.tsx och swarmEventBus.ts behålls som centrala event-nav.

## Destruktiva Handlingssteg (Raderas / Ersätts helt)
- Radera all REST/HTTP-anropskod, REST-fallbacks och dubbla API-nyckelvägar under src/features/gemini_live_swarm/session/geminiLiveSession.ts.
- Radera platta/föråldrade audio-payloadbyggare i geminiLiveSession.ts och ersätt med strikt Zod-validerad realtimeInput.mediaChunks-struktur (mimeType: "audio/pcm;rate=16000").
- Radera manuella reconnect-loops i WebSocket-klienten som skapar dolda zombiekablar.

## Genomförande
1. Konfigurera setup-meddelandet över Bidi WebSocket med extended_thinking och responseModalities ["TEXT", "AUDIO"].
2. Implementera strikt packaging av PCM16 16kHz-ljudchunkiar under realtimeInput.mediaChunks i geminiLiveSession.ts.
3. Koppla swarmOrchestrator.ts till WebSocket-eventbussen för att autonomt returnera toolResponse satt till NON_BLOCKING vid verktygsanrop.
4. Skapa ett isolerat transient test under src/__tests__/transient_TCK-020c.test.ts som verifierar handskakning och mockad PCM16-ljudström på < 3 sekunder.

## Testkriterier
- pnpm verify passerar utan Zod- eller TypeScript-fel.
- Transient mikro-E2E-test köres i minnet på under 3 sekunder.s.tsx < 125 rader, < 5 förgreningar).
   - Nollställ activeIntent i UI omedelbart vid frånkoppling eller fel.
3. Obrutet Svep & Token Gate (Steg 3c):
   - Driv kedjan 1a -> 1b -> 2a -> 2b -> 2e -> 3c i ett obrutet svep under doc/.
   - Stanna vid Steg 3c och redovisa statusraden, Användarnytta, Systembeteende samt godkännandekoden från REQUIRED_TOKEN.txt.