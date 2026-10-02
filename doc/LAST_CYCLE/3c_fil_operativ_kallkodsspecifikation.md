# 3c Fil-operativ Källkodsspecifikation (TCK-020)

## 1. Förändringskedja för Fas 2 (pnpm genomfor)

Följande filer är specificerade för källkodsändring under Fas 2 efter bekräftelse av godkännandekoden (`TCK-020-ADAPTIVE-CONTROL-TOKEN`):

### 1. `src/features/gemini_live_swarm/ui/splitPaneHelper.ts` (Ny fil)
- **Funktioner**:
  - `computeSplitArrows(orientation: 'portrait' | 'landscape', ratio: number): SplitArrowConfig`
    * Porträtt: Dölj nedåtpil vid botten (0%), visa enbart `[ ⇧ ]`; dölj uppåtpil vid topp (100%), visa enbart `[ ⇩ ]`.
    * Landskap: Dölj vänsterpil vid vänster gräns (0%), visa enbart `[ ⇒ ]`; dölj högerpil vid höger gräns (100%), visa enbart `[ ⇐ ]`.
  - `getIntentButtonClass(intent: SwarmIntent, activeIntent: SwarmIntent | null): string`
    * Formaterar aktiv knapp med förstorad layout (`scale-105 shadow-md`) och inaktiv knapp med adaptiv textdöljning på mobil.
  - `getOrientationClass(orientation: 'portrait' | 'landscape'): string`

### 2. `src/features/gemini_live_swarm/session/geminiLiveSession.ts`
- **Tillägg**:
  - `activeIntent: SwarmIntent | null = null`.
  - `activateIntent(intent: SwarmIntent): Promise<void>`
    * Växlar aktivt läge. Om samma knapp trycks anropas `deactivateIntent()`.
    * User Gesture: Initierar Web Audio (`AudioContext`) och begär mikrofon.
    * Publicerar `swarm.live.intent.activated`.
  - `deactivateIntent(): void`
    * Frigör mikrofonströmmar och sätter `activeIntent = null`.
    * Publicerar `swarm.live.intent.deactivated` med `activityText: "🟡 Agenter i dvala"`.

### 3. `src/features/gemini_live_swarm/ui/SplitPaneCanvas.tsx`
- **Förändring**:
  - Flytta in lägesknapparna i mitten av delningslinjen (`split-pane-divider`).
  - Använd `computeSplitArrows` och `getIntentButtonClass` för att bevara låg förgreningsgrad (max 5) och linjeantal under 120 rader.
  - Hantera orienteringsväxling och enkelpilsklick för direkt återställning till neutralläge (50%).

### 4. `src/features/gemini_live_swarm/ui/AppShell.tsx`
- **Förändring**:
  - Gör `SymbolCrown` permanent synlig i toppzonen oavsett immersivt tillstånd.
  - Koppla intent-anrop till `GeminiLiveSession`.

### 5. `src/features/gemini_live_swarm/doc/DECISIONS.md`
- **Tillägg**:
  - Dokumentera **ADR-SWARM-015: Intent-Driven Audio Trigger & Adaptive Control Bar**.

### 6. `src/__tests__/transient_TCK-020.test.ts` (Ny fil)
- **Verifieringar**:
  - Test 1: User Gesture-aktivering av röstström och intent-växling.
  - Test 2: Inaktivering av röstsession och status `"🟡 Agenter i dvala"`.
  - Test 3: Enkelpilar vid gränslägen (döljning vid 0% och 100%) i porträtt och landskap.
  - Test 4: Adaptiv knappkollaps (ikon vs text + scale-105).
  - Test 5: Permanent SymbolCrown och helskärmsåtergång.
  - Test 6: AST- och strukturmått (max 125 rader, djup <= 4, förgreningar <= 5 i TSX).

### 7. `scripts/verify-architecture.js`
- **Tillägg**:
  - Registrera `TCK-020-ADAPTIVE-CONTROL-TOKEN` i `validTokens`.

### 8. `scripts/run-tests.js` & `src/__tests__/suite/e2e_regression.test.ts`
- **Tillägg**:
  - Registrera TCK-020.

---

## 2. Token Gate
- Godkännandekod: `TCK-020-ADAPTIVE-CONTROL-TOKEN` i `doc/LAST_CYCLE/REQUIRED_TOKEN.txt`.
