# Steg 1b: Kartlägga Beroenden & Aktiva Vektorer (TCK-023)

## 1. Aktiva Vektorer & Skills
- **active_vectors**: `gemini_live_swarm`, `spatial_ui_harmonization`, `fluid_dock_gestures`, `stream_concatenation`, `two_joined_rays`
- **active_skill**: `gemini-api`

## 2. Beroendekarta
- `src/features/gemini_live_swarm/ui/`:
  - `SplitPaneCanvas.tsx`: Huvudkomponent för 2-panelsvy, delningsskena och realtidsvisning.
  - `splitPaneHelper.ts`: Beräkning av delningsförhållande, gest- och piltangenthantering, avrundning, ikon- och stilhelpers.
  - `SymbolCrown.tsx`: Översta statusraden med symboler och aktivitetstext.
  - `ExecutionCard.tsx`: Visning av verktygskörning och bakgrundsarbete under "Verktyg".
- `lucide-react`: `Compass`, `RotateCcw`.
- `src/__tests__/transient_TCK-023.test.ts`: Transienta tester för TCK-023.

## 3. Destruktiva Handlingssteg
- I `SplitPaneCanvas.tsx`:
  - Ersätt rubrikerna "Agentchatt & Dialog" och "Exekveringskanvas" med "Dialog" respektive "Verktyg".
  - Ersätt den begränsade knapp-hitboxen med en full-yta pek- och svephitbox (`onPointerDown`, `touch-action: none`) över hela delningsskenan.
  - Ersätt radbrytande text-renderingslogik med kontinuerlig ackumulering av delmeddelanden till ett sammanhängande stycke.
- I `SymbolCrown.tsx` och `splitPaneHelper.ts`:
  - Sanera extra statusprickar/LED-indikatorer vid dvala och viloläge.
  - Integrera de nya försoningsikonerna: Compass (`#38bdf8`), Försoningsfamnen/Two Joined Rays (`#facc15`) och RotateCcw (`#a855f7`).
