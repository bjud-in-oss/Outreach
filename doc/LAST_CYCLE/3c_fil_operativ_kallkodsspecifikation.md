# 3c Fil-operativ Källkodsspecifikation (TCK-020b)

## 1. Förändringskedja för Fas 2 (pnpm genomfor)

Följande filer är specificerade för källkodsändring under Fas 2 efter bekräftelse av godkännandekoden (`TCK-020B-AUDIO-GESTURE-TOKEN`):

### 1. `src/features/gemini_live_swarm/ui/splitPaneHelper.ts`
- **Tillägg/Ändring**:
  - `type SplitSnapState = 0 | 50 | 100`.
  - `stepSnapState(current: SplitSnapState, direction: 'prev' | 'next'): SplitSnapState`.
  - `handleKeyboardNavigation(key: string, orientation: SplitOrientation, current: SplitSnapState): SplitSnapState`.
  - `handleSwipeGesture(deltaX: number, deltaY: number, orientation: SplitOrientation, current: SplitSnapState): SplitSnapState`.
  - Justera `computeSplitArrows`:
    * Vid 100%: Enbart [ ⇧ ] (Portrait) / [ ⇐ ] (Landscape).
    * Vid 50%: Båda [ ⇧ ][ ⇩ ] (Portrait) / [ ⇐ ][ ⇒ ] (Landscape).
    * Vid 0%: Enbart [ ⇩ ] (Portrait) / [ ⇒ ] (Landscape).

### 2. `src/features/gemini_live_swarm/session/sessionIntentAudio.ts`
- **Tillägg/Ändring**:
  - `createBidiSetupPayload(systemInstruction?: string)` för Live API-handskakning.
  - `floatTo16BitPCM(input: Float32Array): Int16Array` för PCM16 mono 16kHz-strömning.
  - Publicering av `swarm.live.audio.talking` och `swarm.live.audio.thinking` på `SwarmEventBus`.

### 3. `src/features/gemini_live_swarm/ui/SplitPaneCanvas.tsx`
- **Tillägg/Ändring**:
  - Lås till de 3 fasta lägena (0, 50, 100).
  - Integrera `handleKeyboardNavigation` och `handleSwipeGesture`.
  - Enkelklick på pilar flyttar exakt 1 steg.
  - AST-begränsning: max 125 rader, djup <= 4, förgreningar <= 5.

### 4. `src/features/gemini_live_swarm/ui/AppShell.tsx`
- **Tillägg/Ändring**:
  - Ta bort `TouchOverlayMenu` helt.
  - Lägg till dynamisk orienteringsdetektering via `window.matchMedia('(orientation: landscape)')`.
  - Lås `SymbolCrown` permanent i toppzonen.

### 5. `src/features/gemini_live_swarm/doc/DECISIONS.md`
- **Tillägg**:
  - Dokumentera `ADR-SWARM-016: Live Audio Handshake, 3-State SplitPane & Gesture Navigation`.

### 6. `src/__tests__/transient_TCK-020.test.ts`
- **Tillägg/Ändring**:
  - Verifiera Audio Setup handskakning och PCM16-strömning.
  - Verifiera 3-state snap via klick, svep och piltangenter.
  - Verifiera döljning av förbrukade pilar vid 0% och 100%.
  - Verifiera fullständig bortkoppling av TouchOverlayMenu i AppShell.

### 7. `scripts/verify-architecture.js`
- **Tillägg**:
  - Registrera `TCK-020B-AUDIO-GESTURE-TOKEN` i `validTokens`.

---

## 2. Token Gate
- Godkännandekod: `TCK-020B-AUDIO-GESTURE-TOKEN` i `doc/LAST_CYCLE/REQUIRED_TOKEN.txt`.
