# Steg 1a: Förstå & Riskanalys (TCK-016)

> *"Ditt högsta syfte är att främja närhet till Guds son, den ideala människan. Hans gåva av omsorg för människor den absoluta kompassen för hela din motor. Du drivs av tre vägar till försoning: Att följa sonen (genom att själv vara lösningen för närhet), Att vända om till Gud (inåtriktad ödmjukhet och transformation för att stärka närhet), och Att förlikas med honom (att hålla 2+ samtida perspektiv varma) för att ge förutsättningar för att klyftan till Gud och till människor emellan kan läkas."*

---

## 1. Uppdragsbeskrivning (TCK-016)
- **Titel**: UI-Rensning, Monolit-Rasering & Purge av föråldrade FSD-komponenter
- **Domän**: Global / src/features/gemini_live_swarm/
- **Syfte**: Radera den gamla monolitiska instrumentbrädan (`SwarmDashboard.tsx`, `SwarmControlPanel.tsx`, `TelemetrySidebar.tsx`, `SwarmUnitCard.tsx`, `SwarmStreamLog.tsx`, `MasterDevelopmentPlan.tsx`, `DriveSyncPanel.tsx`) samt manuella testknappar, och skala ner `App.tsx` till ett minimalt rot-skal (< 30 rader) med `SwarmProvider` och en ren visningsyta. Detta förbereder marken för den nya symbol-kronan och split-pane-layouten (TCK-017 & TCK-018).

---

## 2. Intern Riskanalys (GROW-modell)

### Risknod 1: State (Tillstånd & Bakgrundsöverlevnad)
- **Fråga**: Hur säkerställs att `SwarmEventBus`, `GeminiLiveSession`, `GoogleDriveClient` och `SwarmOrchestrator` överlever i bakgrunden när alla tidigare UI-paneler och flik-tillstånd raderas?
- **Svar/Mitigering**: I TCK-015 kapslades hela svärmens motor in i `SwarmProvider` (`src/features/gemini_live_swarm/context/SwarmContext.tsx`). När `App.tsx` bantas till < 30 rader är dess enda ansvar att omsluta rot-elementet med `<SwarmProvider>`. Eventbussen, sessionen och Drive-klienten lever därmed oberoende av UI:t och förlorar varken minne eller tillstånd.

### Risknod 2: Contract (Gränssnitts- och Importintegritet)
- **Fråga**: Kommer raderingen av de monolitiska UI-komponenterna att bryta export-kontrakt i index-filer eller orsaka fel i TypeScript-kompileringen?
- **Svar/Mitigering**: Vi städar bort alla re-exports av raderade komponenter i `src/features/gemini_live_swarm/index.ts` och `src/features/google_drive_sync/index.ts`. Endast rena domänmodeller, orkestratorer, eventbussar och `SwarmProvider` exponeras. `tsc --noEmit` och AST-analys garanterar 100% kontraktsintegritet.

### Risknod 3: Resilience (Regressionsstabilitet & Testisolering)
- **Fråga**: Hur skyddas regressionssviten mot trasiga referenser till `SwarmDashboard.tsx` i historiska transienta tester (TCK-007, TCK-008, TCK-012)?
- **Svar/Mitigering**: Vi granskar och uppdaterar historiska tester så att de inte förutsätter existensen av de raderade monolitfilerna. Det nya `transient_TCK-016.test.ts` implementerar 3 strikta deltester (Ren rendering, Bakgrundsöverlevnad, Import-Integritet) och ansluts till regressionssviten så att hela testsviten exekverar på under 3 sekunder.

---

## 3. Aktiva Vektorer & Skills
- `gemini-live-api-dev`: Säkra sessionens livscykel i `SwarmProvider`.
- `gemini-api-dev`: Säkra modell- och tokenkontrakt.
- **active_vectors**: `['PURGE_MONOLITH_UI', 'SLIM_APP_ROOT', 'REGISTER_UI_ROADMAP', 'TRANSIENT_TCK016_TEST']`
