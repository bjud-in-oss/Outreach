# Steg 2e: Syntetisera & Verifiering av Mättnad (TCK-017)

## 1. Målkonfliktanalys
- **Konflikt 1**: Hur undviks layout-jitter när aktivitetsbeskrivningar i kronan ändras?
  - **Lösning**: Kronan har fixerad höjd (`h-9`), `overflow-hidden` och `truncate` på aktivitetstexten med flex-grow, så att symbolerna förblir stadigt förankrade.
- **Konflikt 2**: Hur garanteras att användaren uppfattar zonernas syfte när inga rubriker får användas?
  - **Lösning**: Innehållets visuella struktur ger omedelbar intuition – övre fältet visar arbetsdokument/teaterkanvas och nedre fältet visar konversationsinmatning och dialogström. Det behövs inga överflödiga text-rubriker.
- **Konflikt 3**: Kommer dragningen i split-pane att hacka eller tappa musfokus om pekaren rör sig snabbt?
  - **Lösning**: Genom att koppla `pointermove` och `pointerup` till `window` med `pointer-events-none` på iframes och `user-select: none` under drag, blir dragningen helt ryckfri och deterministisk.

## 2. Arkitektonisk Sammanfattning
- Symbol-krona och justerbart Split-Pane uppfyller FSD-principerna och den universella designkonstitutionen.
- Inga pill-badges, inga zonrubriker, 100% ren symbolisk närvaro.
- Alla målkonflikter är utredda och lösta.

MÄTTNAD: JA
