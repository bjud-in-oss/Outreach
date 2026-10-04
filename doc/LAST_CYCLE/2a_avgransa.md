# Steg 2a: Avgränsa & Isolera (TCK-022c)

## 1. Strikt Domän- och FSD-avgränsning
- **Modul**: `src/features/gemini_live_swarm/`
- **Exklusiva filer**:
  - `src/features/gemini_live_swarm/session/sessionIntentAudio.ts`
  - `src/__tests__/transient_TCK-022c.test.ts`
- **Inga externa beroenden**: Inga nya npm-paket eller externa VAD-bibliotek introduceras. All beräkning förblir ren TypeScript med Float32Array och Int16Array matematiska operationer.
- **AST-gräns**: `sessionIntentAudio.ts` ska hålla sig under 250 rader och under 4 indenteringsnivåer.
