# Steg 3c: Filoperativ Källkodsspecifikation (TCK-023)

## 1. GROW Specifikation
- **Goal (Mål)**: Harmonisera användargränssnittet under `src/features/gemini_live_swarm/ui/` med den spatiala 3-kanals stereosvärmen:
  1. Panelnamn: "Dialog" (vänster) och "Verktyg" (höger).
  2. Ikoner: Compass (`#38bdf8`), Försoningsfamnen/Two Joined Rays (`#facc15`), RotateCcw (`#a855f7`), och sanering av onödiga gula statusprickar.
  3. Drag- och svepgester över hela delningsskenans yta (`touch-action: none`, `onPointerDown`/`onPointerMove`).
  4. Sammanhängande prosaströmning utan avhuggna rader via tur-ackumulering.
- **Reality (Nuläge)**: Gränssnittet använder fortfarande äldre termer ("Agentchatt & Dialog", "Exekveringskanvas"), visar gula statusprickar, begränsar svep-hitboxen till enskilda knappar och delar upp inkommande text i hackiga block per paket.
- **Options (Alternativ)**: Partiella CSS-fixar vs full harmonisering i FSD UI-skiktet med dedikerade helpers. Vi väljer ren FSD-harmonisering med modulära hjälpfunktioner i `splitPaneHelper.ts` och renodlade komponenter.
- **Will (Plan & Åtagande)**: Uppdatera `splitPaneHelper.ts`, `SplitPaneCanvas.tsx`, `SymbolCrown.tsx` och `ExecutionCard.tsx`, samt skapa transient testsvit `src/__tests__/transient_TCK-023.test.ts`.

## 2. Operativt Delta (Bevara vs Sanera)
- **Bevara**:
  - Integrationen mot `SwarmEventBus` och `useOptionalSwarmContext`.
  - Piltangentnavigering och bas-snapping (0, 50, 100).
- **Sanera / Ersätta**:
  - Ersätt gamla rubriker med "Dialog" och "Verktyg".
  - Ersätt fragmenterad textrendering med ackumulerade prosastycken.
  - Ersätt gamla emoji-ikoner och gula dvalaprickar med Lucide Compass, Försoningsfamnen SVG och Lucide RotateCcw.
  - Ersätt den smala knapp-hitboxen med hela skenans yta.

## 3. Zod- och Typkontrakt
```typescript
export interface AccumulatedTurn {
  id: string;
  agentRole: string;
  forceTitle: string;
  text: string;
  isComplete: boolean;
  timestamp: string;
}
```

## 4. Testkriterier (Transient Mikro-E2E)
- `src/__tests__/transient_TCK-023.test.ts`:
  1. Verifiera att `appendStreamChunkToTurns` ackumulerar textkonkatenering för pågående tur och skapar nytt block vid ny talare eller efter `turnComplete`.
  2. Verifiera att `computeSplitFromPointer` och `calculateRatioFromPointer` beräknar korrekta procentuella förhållanden för både horisontell och vertikal orientering.
  3. Verifiera att panelnamn "Dialog" och "Verktyg" samt de tre ikonerna är definierade.
  4. AST-kontroll: Samtliga berörda UI-filer håller sig under 250 rader och har noll produktionsmockar.
