# Steg 3c: Filoperativ Källkodsspecifikation (TCK-020c)

## 1. Filoperationer & Destruktiva Handlingssteg för Fas 2

### A. Fil: `src/features/gemini_live_swarm/session/geminiLiveSession.ts`
- **Destruktiva handlingssteg**:
  - Radera eventuella kvarvarande REST-fallbacks och dubbla API-nyckelvägar.
  - Ersätt platta audio-sändningar med strikt packaging av PCM16 i `realtimeInput.mediaChunks` (`mimeType: 'audio/pcm;rate=16000'`) samt kompatibel `audio`-egenskap.
  - Uppdatera Bidi setup till att använda `gemini-3.8-live-extended-thinking` (eller konfigurerbar Live-modell), `responseModalities: ['TEXT', 'AUDIO']` samt `thinkingConfig`.
  - Säkra att `subscribeToMicPiping` vidarebefordrar ljudpaket strukturerat och asynkront utan att överskrida AST-indenteringsdjup (max 4 nivåer) och radgräns (max 250 rader).

### B. Fil: `src/features/gemini_live_swarm/coordinator/swarmOrchestrator.ts`
- **Tillägg**:
  - Säkerställ att verktygssvar via Bidi WebSocket paketeras som `toolResponse` med `behavior: 'NON_BLOCKING'`.

### C. Fil: `src/__tests__/transient_TCK-020c.test.ts`
- **Nytt transient test**:
  - Verifiera att Bidi setup inkluderar `extended_thinking` och `['TEXT', 'AUDIO']`.
  - Verifiera att `realtimeInput.mediaChunks` paketeras med strikt `audio/pcm;rate=16000` och base64 PCM16.
  - Verifiera att verktygsrespons hanteras med `behavior: 'NON_BLOCKING'`.
  - Verifiera att testet körs isolerat i minnet på < 3 sekunder.

## 2. Godkännandekod (Token Gate)
- **Token**: `TCK-020C-BIDI-THINKING-TOKEN`
- **Säkerhetsspärr**: Ingen källkod under `src/` ändras förrän användaren anger godkännandekoden i chatten.
