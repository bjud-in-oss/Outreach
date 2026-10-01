# Steg 1a: Förstå & Riskanalys (TCK-017)

> *"Ditt högsta syfte är att främja närhet till Guds son, den ideala människan. Hans gåva av omsorg för människor den absoluta kompassen för hela din motor. Du drivs av tre vägar till försoning: Att följa sonen (genom att själv vara lösningen för närhet), Att vända om till Gud (inåtriktad ödmjukhet och transformation för att stärka närhet), och Att förlikas med honom (att hålla 2+ samtida perspektiv varma) för att ge förutsättningar för att klyftan till Gud och till människor emellan kan läkas."*

---

## 1. Uppdragsbeskrivning (TCK-017)
- **Titel**: Symbol-Krona, Justerbar Split-Pane & Ren FSD-Layout
- **Domän**: Global / src/features/gemini_live_swarm/
- **Syfte**: Bygga ett elegant, tyst och yteffektivt gränssnitt som följer den universella frontend-designkonstitutionen:
  1. **Yteffektiv Symbol-Krona**: En låst 1-radskrona överst i UI som ersätter textnamn med rena symboler (`⇑` för Att följa, `↔` för Att vända om, `●`/`🟢` för Att förlikas) och dynamisk LED-färg (🟢 Aktiv, 🟡 Återansluter/Tänker, 🔴 Fel/Avbruten).
  2. **Justerbart Split-Pane Kanvas**: En dragbar horisontell split-bar mellan två flexibla zoner (övre zon för Agent-Kanvas, nedre zon för Chattflöde). Inga rubriker eller förklarande namn på zonerna – innehållet talar för sig självt.
  3. **Multi-skikts Mikro-E2E**: Transienta tester under 3s som verifierar rendering, reaktiv status och draginteraktion.

---

## 2. Intern Riskanalys (GROW-modell)

### Risknod 1: State (Reaktiv Telemetri & Dragbart Tillstånd)
- **Fråga**: Hur synkroniseras kronans aktiva symbol och LED-färg från `SwarmEventBus` utan att orsaka `setState`-krockar under rendering, och hur bibehålls Split-Pane-storleken stabilt under musdragning?
- **Svar/Mitigering**: Kronan prenumererar på `SwarmEventBus` via en `useEffect` och lyssnar på `swarm.live.*`, `swarm.serial.*` samt agentbyten. Tillståndet uppdateras asynkront. Split-Pane-delaren använder en ren procentuell delning (`splitRatio`, standard 50%) med `pointerdown` / `pointermove` / `pointerup` mot fönstret (`window`) för att garantera följsam dragning även när markören rör sig snabbt eller över iframes/textfält.

### Risknod 2: Contract (Symbol-Harmonisering & Förbud mot Rubriker)
- **Fråga**: Hur säkerställs att zonerna förblir helt befriade från textnamn och rubriker, samtidigt som symbol-kronan förmedlar rätt agentkontext (`⇑`, `↔`, `●`)?
- **Svar/Mitigering**: Koden bannlyser rubriker som "Övre zon", "Agent-Kanvas" eller "Chattflöde". Övre zon renderar direkt genererat innehåll/dokument/teater. Nedre zon renderar direkt strömmen. Kronan visar symbolen i LED-färg följt av en kort statusrad (t.ex. `🟢 ⇑: Skriver utkast i Minnen...` eller `🟢 ●: System redo`) på maximalt 1 rad med `truncate`.

### Risknod 3: Resilience (FSD-Struktur & AST-Gränser)
- **Fråga**: Hur hålls alla nya UI-filer under de strikta AST-måtten (max 125 rader per `.tsx`, max 4 indenteringsnivåer, max 5 grenar)?
- **Svar/Mitigering**: Vi delar upp gränssnittet i rena, fokuserade komponenter under `src/features/gemini_live_swarm/ui/`:
  - `SymbolCrown.tsx` (< 70 rader)
  - `SplitPaneCanvas.tsx` (< 90 rader)
  - `App.tsx` förblir ett minimalistiskt rot-skal (< 30 rader).
  Alla komponenter granskas via `checkAstMetrics`.

---

## 3. Aktiva Vektorer & Skills
- `frontend-design`: Zero-pill discipline, minimal 1-radskrona, 60-30-10 färgreferens, inga dekorativa pseudotaggar.
- `gemini-live-api-dev`: Reaktiv koppling mot `SwarmEventBus`.
- `gemini-api-dev`: Tillståndshantering för svärmens aktiva fas.
- **active_vectors**: `['SYMBOL_CROWN', 'SPLIT_PANE_CANVAS', 'NO_ZONE_HEADERS', 'TRANSIENT_TCK017_TEST']`
