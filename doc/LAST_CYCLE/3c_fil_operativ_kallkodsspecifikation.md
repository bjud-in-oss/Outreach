# Steg 3c: Filoperativ Källkodsspecifikation (TCK-020d)

## 1. GROW Specifikation
- **Goal (Mål)**: Sanera `geminiLiveSession.ts` genom att radera `modelName = 'gemini-3.8-flash'` och tvinga `apiVersion: 'v1alpha'` i GoogleGenAI SDK-instansen.
- **Reality (Nuläge)**: `geminiLiveSession.ts` har en kvarvarande variabel `private modelName = 'gemini-3.8-flash'` och saknar explicit `apiVersion: 'v1alpha'`.
- **Options (Alternativ)**: Sätta `apiVersion` på varje anrop vs i SDK-konstruktorn. Att sätta `apiVersion: 'v1alpha'` direkt i `new GoogleGenAI({ apiKey, apiVersion: 'v1alpha' })` är officiellt mönster enligt `gemini-docs` MCP och låser även WebSocket-kabeln.
- **Will (Beslut)**: Lås `apiVersion: 'v1alpha'` i konstruktorn och `setApiKey`, radera `private modelName`, och låt `generateAgentTurn` använda `params.model || this.liveModelName`.

## 2. Operativt Delta: Bevara vs Sanera
- **Bevara**:
  - `packRealtimeAudioChunk` och strikt `realtimeInput.mediaChunks` PCM16-struktur.
  - `sendToolResponse` med `behavior: 'NON_BLOCKING'`.
  - Hela gränssnittet (`SplitPaneCanvas.tsx`, `AppShell.tsx`, `SymbolCrown.tsx`, etc.).
  - `swarmOrchestrator.ts` och `sessionIntentAudio.ts`.
- **Sanera (Destruktiva Handlingssteg för Fas 2)**:
  - Radera `private modelName = 'gemini-3.8-flash';` i `geminiLiveSession.ts`.
  - Ersätt instansiering av `GoogleGenAI` med explicit `{ apiKey: ..., apiVersion: 'v1alpha' }`.
  - Uppdatera `generateAgentTurn` att använda `params.model || this.liveModelName`.

## 3. Zod-kontrakt & Typdefinitioner
- `GoogleGenAI({ apiKey: string, apiVersion: 'v1alpha' })`
- `AgentThoughtResponse`: `{ agentRole: string, thought: string, content: string, suggestedTools?: string[], score?: number }`

## 4. Godkännandekod (Token Gate)
- **Token**: `TCK-020D-SANERA-V1ALPHA-TOKEN`
- **Säkerhetsspärr**: Ingen källkod under `src/` ändras förrän användaren anger godkännandekoden i chatten via `pnpm genomfor TCK-020D-SANERA-V1ALPHA-TOKEN`.
