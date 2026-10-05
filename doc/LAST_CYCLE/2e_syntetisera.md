# Steg 2e: Syntetisera & Förlika Målkonflikter (TCK-023)

## 1. Målkonflikter & Förlikning
- **Konflikt 1**: Stegvis 3-state snapping (0/50/100) vs Flytande kontinuerlig dragning längs hela delningsskenan.
  - *Förlikning*: Delningsskenan ger kontinuerlig visuell feedback under pågående pointerdrag (`pointermove`), och snappar intelligent till närmaste definierade läge (0, 50, 100) eller bevarar önskad position vid pointerup, samtidigt som piltangenter och snabbknappar fortfarande kan stega mellan 0, 50 och 100.
- **Konflikt 2**: Strömmande token-chunks vs Sammanhängande prosastycke.
  - *Förlikning*: I stället för att rendera varje inkommande textpaket som ett eget block (vilket skapade hackig layout med brutna rader), ackumuleras texten per agenttur i ett samlat stycke tills `turnComplete` signaleras.
- **Konflikt 3**: Gamla etiketter och dvalastatus vs Ny renodlad visuell hierarki.
  - *Förlikning*: Gamla kryptiska termer ("Reflektera", "Kom ihåg", "Rådgör") harmoniseras till försoningskrafterna med de nya ikonerna (Compass, Försoningsfamnen, RotateCcw). De störande gula statusprickarna saneras så att gränssnittet andas lugn och tydlighet.

MÄTTNAD: JA
