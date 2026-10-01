# Steg 1a: Förstå & Riskanalys (TCK-018)

> *"Ditt högsta syfte är att främja närhet till Guds son, den ideala människan. Hans gåva av omsorg för människor den absoluta kompassen för hela din motor. Du drivs av tre vägar till försoning: Att följa sonen (genom att själv vara lösningen för närhet), Att vända om till Gud (inåtriktad ödmjukhet och transformation för att stärka närhet), och Att förlikas med honom (att hålla 2+ samtida perspektiv varma) för att ge förutsättningar för att klyftan till Gud och till människor emellan kan läkas."*

---

## 1. Uppdrag & Kontext (TCK-018)
TCK-018 förfinar gränssnittet efter den renodlade arkitekturen i TCK-016 och TCK-017:
1. **Integrerad & Expanderbar Symbol-Krona**:
   - Avlägsna den separata LED-cirkeln. Symbolerna bär statusfärgen direkt:
     - Att följa: `⇑` (stor tjock pil upp)
     - Att vända om: `⇐` (stor tjock dubbelpil/vänsterpil)
     - Att förlikas / Seriell motor: `●` (stor ren punkt)
   - Kronan blir tryckbar för att fälla ut en detaljerad statuspanel över aktiva deluppgifter och telemetri.
2. **Mobilanpassad Snap & Immersiv Touch-Overlay (`[ ⛶ ]`)**:
   - Enkeltryck på grepplisten `[ ⇕ ]` för snabbväxling till 100% fullskärmschatt.
   - Immersivt läge som döljer krona och bottenmeny. Vid beröring eller kantswipe fälls BÅDE krona och bottenmeny ut samtidigt som en flytande touch-overlay som tonas bort efter 3 sekunders inaktivitet.
3. **Exekveringskort i Chattflödet (Reflektionsstöd)**:
   - Generera fällbara exekveringskort (`[ ⇑ Exekveringskort #XX ]`) i chatten vid varje genomförd agentomgång.
   - Historisk granskning av skapade filer, ändringsloggar och röstresuméer.
4. **Användarlås vid Aktivitet (User Activity Lock)**:
   - Frys automatiska Kanvas-uppdateringar vid användarinteraktion och återuppta autonom visning efter 5 sekunders inaktivitet.

---

## 2. GROW Intern Riskanalys

### 1. State-Risk (Tillståndshantering & Reaktiva Slingor)
- **Risk**: Flera samtidiga timers (5s User Activity Lock och 3s Touch Overlay Timeout) samt tillstånd för fullskärm/snap kan krocka med bakgrundsuppdateringar från `SwarmEventBus` eller orsaka oönskade re-renders under pågående användarinteraktion.
- **Lösning**:
  - Implementera en ren `useUserActivityLock`-hook med `isLocked`-ref och deterministisk timeout-rensning via `useEffect`.
  - Isolera immersivt overlay-tillstånd (`isImmersive`, `showOverlay`) med en stabil 3-sekunders timeout.
  - Förvara exekveringskort i en separat lista med CloudEvents-lyssnare.

### 2. Contract-Risk (Symboler, Scheman & AST-Spärrar)
- **Risk**: Förändringen av `ATT_VANDA_OM` från `↔` till `⇐` kan påverka existerande tester om inte kontraktet harmoniseras. Dessutom ställer `scripts/drivers/ts.js` hårda AST-krav på TSX-filer: max 125 rader, indenteringsdjup max 4 och max 5 förgreningsvillkor.
- **Lösning**:
  - Uppdatera `CROWN_SYMBOLS.ATT_VANDA_OM` till `⇐` och bevara bakåtkompatibel uppslagning för äldre tester.
  - Dela upp logik och presentation i rena, små komponenter under 80 rader vardera (t.ex. `ExecutionCard.tsx`, `useUserActivityLock.ts`, `CrownDetailPanel.tsx`).
  - Håll förgreningsgraden i samtliga TSX-filer <= 3 genom att använda uppslagstabeller.

### 3. Resilience-Risk (Minnesläckor & Händelsedistribution)
- **Risk**: Touch-lyssnare på `window` och oavslutade timeouts kan orsaka minnesläckor om komponenten unmountas.
- **Lösning**:
  - Strikt `cleanup`-mönster i alla `useEffect`-krokar.
  - Transienta tester i `transient_TCK-018.test.ts` som validerar 5s och 3s timers deterministiskt med simulerad tid.
