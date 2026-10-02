# Steg 1b: Kartlägga & Komponentinventering (TCK-020b)

## 1. Inventering av Filer att Modifiera och Skapa

### 1. `src/features/gemini_live_swarm/session/sessionIntentAudio.ts`
- **Nuvarande status**: Hanterar basala intents och AudioContext-start.
- **Förändring**:
  - Implementera `BidiGenerateContentSetup`-generator och sändning över WebSocket (`connectLive`).
  - Skapa PCM16 mono 16kHz-omvandlare (`floatTo16BitPCM`) från ScriptProcessor/AudioWorklet.
  - Sänd realtimeInput kontinuerligt under aktiv ljudström.
  - Publicera `swarm.live.audio.talking` och `swarm.live.audio.thinking`.

### 2. `src/features/gemini_live_swarm/ui/splitPaneHelper.ts`
- **Nuvarande status**: Hanterar beräkning av pilar och knappklasser.
- **Förändring**:
  - Definiera `SplitSnapState = 0 | 50 | 100`.
  - Implementera `stepSnapState(current: SplitSnapState, direction: 'prev' | 'next'): SplitSnapState`.
  - Implementera `handleKeyboardNavigation(key: string, orientation: SplitOrientation, current: SplitSnapState): SplitSnapState`.
  - Implementera `handleSwipeGesture(deltaX: number, deltaY: number, orientation: SplitOrientation, current: SplitSnapState): SplitSnapState`.
  - Justera `computeSplitArrows`:
    * Vid `100`: Enbart `firstIcon` (`[ ⇧ ]` i Portrait, `[ ⇐ ]` i Landscape).
    * Vid `50`: Båda `[ ⇧ ][ ⇩ ]` / `[ ⇐ ][ ⇒ ]`.
    * Vid `0`: Enbart `secondIcon` (`[ ⇩ ]` i Portrait, `[ ⇒ ]` i Landscape).

### 3. `src/features/gemini_live_swarm/ui/SplitPaneCanvas.tsx`
- **Nuvarande status**: Stödjer dragning och kontinuerliga värden.
- **Förändring**:
  - Lås till de 3 fasta lägena (0, 50, 100).
  - Lägg till tangentbordslyssnare för piltangenter (`ArrowUp`/`ArrowDown` i Portrait, `ArrowLeft`/`ArrowRight` i Landscape).
  - Lägg till touch event handlers (`onTouchStart`, `onTouchEnd`) för svepgester.
  - Behåll linjeantal <= 125 och förgreningsantal <= 5.

### 4. `src/features/gemini_live_swarm/ui/AppShell.tsx`
- **Nuvarande status**: Renderar både `SplitPaneCanvas` och `TouchOverlayMenu`.
- **Förändring**:
  - Radera import och rendering av `TouchOverlayMenu`.
  - Lägg till dynamisk orienteringsdetektering via `window.matchMedia('(orientation: landscape)')`.
  - Behåll permanent `SymbolCrown` i toppzonen.

### 5. `src/features/gemini_live_swarm/doc/DECISIONS.md`
- **Förändring**: Dokumentera `ADR-SWARM-016: Live Audio Handshake, 3-State SplitPane & Gesture Navigation`.

### 6. `src/__tests__/transient_TCK-020.test.ts`
- **Förändring**: Uppdatera för att verifiera samtliga 5 delmål i TCK-020b.
