# 2a Avgränsa: Gemini Live Session Streaming & WebSocket Integration (TCK-010)

## 1. Avgränsningsmatris

| Område | Ingår i TCK-010 | Ingår INTE (Avgränsat) | Motivering |
| :--- | :--- | :--- | :--- |
| **Domän** | `src/features/gemini_live_swarm/` | Övriga moduler (`google_drive_sync`, `wal_logger`, `mcp_bridge`) | TCK-010 är strikt avgränsat till Live API-strömning och svärmkoppling. |
| **Modell** | `gemini-3.8-live` (och `gemini-3.8-flash` för syntes) | Äldre deprecated modeller (`gemini-2.0`, `gemini-2.5`, `gemini-3.1-flash-live-preview`) | `gemini-live-api-dev` stipulerar strikt Gemini 3.8 Live för realtidsinteraktion. |
| **Modaliteter** | Dubbelriktad text och 16kHz PCM Audio streaming (Base64) | Videoströmning och skärmdelning | TCK-010 fokuserar på röst- och textburen outreach-dialog. |
| **Körtidsläge** | Deterministisk in-memory fallback + skarp WebSocket-klient | WebRTC / Partner-infrastruktur (LiveKit, Pipecat) | Direkt SDK-implementation (@google/genai) uppfyller systemkraven utan externa molntjänstberoenden. |
| **Enheter** | Exakt de 4 försoningsenheterna i UI och orkestrering | Nya agentroller eller förändring av `RECONCILIATION_UNITS` | Domänmodellen och de 4 enheterna konsoliderades i TCK-009 och hålls oförändrade. |
| **Säkerhetsspärr** | Token Gate (Steg 3c) | Källkodsändringar under Fas 1 | Inga filer under `src/` ändras förrän användaren godkänt koden. |
