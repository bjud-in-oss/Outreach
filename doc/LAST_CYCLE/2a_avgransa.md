# Steg 2a: Avgränsa & Systemkontrakt (TCK-018)

## 1. Vad som SKA göras i TCK-018
- **Integrerad Symbol-Krona**: Ta bort separat LED-prick och applicera färgklasser direkt på `⇑`, `⇐`, `●`. Gör kronan klickbar för fällbar telemetridetalj.
- **Fullskärmschatt & Enkeltryck-Snap**: Stöd 0%–100% split-ratio och klick på `[ ⇕ ]` för att växla mellan 100% fullskärmschatt och delat läge.
- **Immersiv Touch-Overlay**: Kantswipe / touch fäller ut krona och bottenmeny i flytande skikt och döljer dem efter 3 sekunder.
- **User Activity Lock**: Klick, scroll eller tangentinmatning låser kanvasen i 5 sekunder mot autonoma vybyten.
- **Exekveringskort**: Rendera fällbara kort i chatten med skapade filer och sammanfattningar.
- **Multi-skikts Transient E2E**: `transient_TCK-018.test.ts` (< 3s i minnet).

## 2. Vad som INTE ska göras i TCK-018
- Skapa inga monolitiska dashboards eller återinföra raderade FSD-komponenter.
- Skriv inga textnamn på agenterna i kronan eller rubriker i split-panelen.
- Överskrid inte radgränser (125 för .tsx) eller förgreningsgrad (> 5).
