# Steg 2a: Avgränsa & Isolera (TCK-022d)

## 1. Strikt Domän- och FSD-avgränsning
- **Modul**: `src/features/gemini_live_swarm/`
- **Exklusiva filer**:
  - `src/features/gemini_live_swarm/session/geminiLiveSession.ts`
  - `src/__tests__/transient_TCK-022d.test.ts`
- **AST-gräns**: `geminiLiveSession.ts` har för närvarande 245 rader. Den uppdaterade koden måste ligga strikt under 250 rader och under 4 indenteringsnivåer.
- **Inga externa beroenden**: Använder befintlig `@google/genai` JS SDK utan nya bibliotek.
