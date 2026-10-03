# Steg 1b: Kartlägga Beroenden & Aktiva Vektorer (TCK-020d)

## 1. Aktiva Vektorer & Skills
- **active_skill**: `gemini-live-api-dev`, `gemini-api-dev`
- **mcp_docs_check**: Verifierat via `https://gemini-api-docs-mcp.dev` (`gemini_search_docs`):
  - `GoogleGenAI` instansieras med `{ apiKey: string, apiVersion: 'v1alpha' }`.
  - WebSocket Live ansluter via `v1alpha.generativeservice.BidiGenerateContent`.

## 2. Beroendekarta
```
src/features/gemini_live_swarm/
└── session/
    ├── geminiLiveSession.ts (AKTIV FÖR FAS 2: Sanera modelName, tvinga apiVersion: 'v1alpha')
    ├── sessionIntentAudio.ts (BEVARAS ORÖRD)
    └── liveAudioPlayback.ts (BEVARAS ORÖRD)
```

## 3. Destruktiva Handlingssteg
- **Källkod att radera**:
  - Radera `private modelName = 'gemini-3.8-flash';` i `geminiLiveSession.ts`.
  - Ersätt instansiering `new GoogleGenAI({ apiKey: key })` med `new GoogleGenAI({ apiKey: key, apiVersion: 'v1alpha' })`.
  - Ersätt instansiering i `setApiKey` med `new GoogleGenAI({ apiKey: apiKey.trim(), apiVersion: 'v1alpha' })`.
