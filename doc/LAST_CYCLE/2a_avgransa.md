# Steg 2a: Avgränsa (TCK-020c)

## In-Scope
1. **Gemini Live Bidi Setup**:
   - `model`: `models/gemini-3.8-live-extended-thinking` (eller `models/gemini-3.8-live`).
   - `responseModalities`: `['TEXT', 'AUDIO']`.
   - `thinkingConfig`: Extended thinking aktiverad med `thinkingLevel: 'HIGH'` eller anpassat thinking-läge.
2. **Audio Streaming Payload**:
   - `realtimeInput`: Standardisera på strukturen med `mediaChunks: [{ mimeType: 'audio/pcm;rate=16000', data: chunkBase64 }]` samt kompatibel `audio`-egenskap.
3. **Verktygssvar (Tool Response)**:
   - När modellen aviserar `toolCall` / `functionCalls`, returnera `BidiGenerateContentToolResponse` med `behavior: 'NON_BLOCKING'`.
4. **Sanering av död logik**:
   - Rensa bort REST-fallbacks och zombiekablar i `geminiLiveSession.ts`.

## Out-of-Scope
- UI-ändringar i `AppShell.tsx`, `SplitPaneCanvas.tsx`, `SymbolCrown.tsx` eller `ExecutionCard.tsx` (dessa bevaras 100% orörda).
- Ändringar i Google Drive sync eller WAL logger (bevaras orörda).
- Ändringar i befintliga godkända tester (TCK-001..TCK-020).
