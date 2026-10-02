# Steg 2a: Avgränsa & Systemkontrakt (TCK-020b)

## 1. Vad som SKA göras i TCK-020b
- **Audio Handshake & PCM16 Streaming**:
  - Sänd `BidiGenerateContentSetup` direkt vid anslutning med `gemini-3.8-live` och `responseModalities: ['audio']`.
  - Konvertera mikrofonström till 16kHz mono PCM16 och strömma via `realtimeInput`.
  - Hantera inkommande server-ljud och signalera `SWARM_TALKING` och `SWARM_THINKING` på SwarmEventBus.
- **3-State SplitPane Navigering**:
  - Endast 3 lägen tillåtna: `0%`, `50%`, `100%`.
  - Stegvis förflyttning (ett steg per interaktion) via klick, piltangenter eller svep.
  - Dynamiska pilar: 100% visar enbart back-pil (`[ ⇧ ]` / `[ ⇐ ]`), 0% visar enbart forward-pil (`[ ⇩ ]` / `[ ⇒ ]`), 50% visar båda.
- **Menyrensning & MatchMedia**:
  - Radera `TouchOverlayMenu` från `AppShell.tsx`.
  - Detektera orientering via `window.matchMedia('(orientation: landscape)')`.
- **Permanent SymbolCrown**:
  - Behåll SymbolCrown låst och synlig i toppzonen oavsett läge.

## 2. Vad som INTE ska göras (Out of Scope)
- Inga förändringar av MCP Bridge eller Google Drive synkronisering.
- Inga nya AI-assistenter eller externa API-klienter utanför Gemini Live.
- Ingen modifiering av WAL-logger eller databaslagring.
