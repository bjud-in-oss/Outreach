# Steg 1b: Kartlägga & Komponentinventering (TCK-020)

## 1. Inventering av Filer att Skapa och Modifiera

### Filer att Skapa
1. `src/features/gemini_live_swarm/ui/splitPaneHelper.ts`:
   - Beräkning av pil-symboler (`[ ⇧ ]`, `[ ⇩ ]`, `[ ⇐ ]`, `[ ⇒ ]`) baserat på orientering (`portrait` vs `landscape`) och `splitRatio`.
   - Logik för att dölja förbrukad riktningspil vid gränslägena 0% och 100%.
   - Klassnamnshjälpare för adaptiv kollaps av lägesknappar (full text vs cirkelformad ikon).
   - Hjälper `SplitPaneCanvas.tsx` att hålla sig strikt inom AST-kraven (max 125 rader, djup max 4, max 5 förgreningar).
2. `src/__tests__/transient_TCK-020.test.ts`:
   - Transienta mikro-E2E-tester (< 3s i minnet) för:
     * User Gesture start av AudioContext och säker hantering i mock/nodemiljö.
     * Enkelpilar vid gränslägen (döljning vid 0% och 100%).
     * Adaptiv knappkollaps (ikon vs text + `scale-105`).
     * Permanent synlighet för `SymbolCrown` och ren helskärmsåtergång.
     * AST- och strukturmått.

### Filer att Modifiera
1. `src/features/gemini_live_swarm/session/geminiLiveSession.ts`:
   - Metoder för `activateIntent(intent)` och `deactivateIntent()`.
   - `User Gesture`-koppling: startar eller återupptar `AudioContext` och kopplar mikrofonström.
   - Sänder dvalahändelse på `SwarmEventBus` vid inaktivering (`"🟡 Agenter i dvala"`).
2. `src/features/gemini_live_swarm/ui/SplitPaneCanvas.tsx`:
   - Inbäddade lägesknappar på delningslinjen.
   - Stöd för porträtt/landskap samt dynamiska enkelpilar.
3. `src/features/gemini_live_swarm/ui/AppShell.tsx`:
   - Permanent låsning av `SymbolCrown` i toppzonen.
   - Robust återgång från helskärmsläge till neutralläge (50%).
4. `src/features/gemini_live_swarm/doc/DECISIONS.md`:
   - Dokumentera **ADR-SWARM-015: Intent-Driven Audio Trigger & Adaptive Control Bar**.
5. `scripts/verify-architecture.js`:
   - Registrera godkännandekoden `TCK-020-ADAPTIVE-CONTROL-TOKEN`.
6. `scripts/run-tests.js` & `src/__tests__/suite/e2e_regression.test.ts`:
   - Registrera TCK-020 i regressionssviten.
