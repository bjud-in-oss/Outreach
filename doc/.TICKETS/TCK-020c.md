AKTIVT UPPDRAG: TCK-020c
Titel: Live Audio Piping & Fail-Fast Error Rendering via Gemini Docs MCP
Domän: Global / src/features/gemini_live_swarm/
Active Skills: gemini-live-api-dev, gemini-api-dev

Mål för TCK-020c:
1. Validera API-kontrakt via gemini-docs MCP:
   - Anropa search_documentation på MCP-servern gemini-docs för att verifiera @google/genai Live API-mönster för sendRealtimeInput (PCM16 16kHz mono base64) och anslutningsfel.
2. Bidi Audio Piping & Fail-Fast UI Alignment:
   - Vidarebefordra base64-kodade PCM16-mikrofonpaket direkt till WebSocket-sessionen vid aktiv röstström.
   - Rendera alla HALTED-, ERROR- och anslutningsfel i klartext i chattfönstret (SplitPaneCanvas.tsx < 125 rader, < 5 förgreningar).
   - Nollställ activeIntent i UI omedelbart vid frånkoppling eller fel.
3. Obrutet Svep & Token Gate (Steg 3c):
   - Driv kedjan 1a -> 1b -> 2a -> 2b -> 2e -> 3c i ett obrutet svep under doc/.
   - Stanna vid Steg 3c och redovisa statusraden, Användarnytta, Systembeteende samt godkännandekoden från REQUIRED_TOKEN.txt.