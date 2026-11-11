# TCK-MAINT-033: Aktivera Tailwind i Vite, Harmonisera SwarmEventBus och Montera A2UI i App

**Måldomän:** `scripts` & `src/shared/bus/` & rotfiler (`vite.config.ts`, `src/App.tsx`)
**Mekanisk Acceptans:** Ett transient test eller lokal verifiering bevisar att `vite.config.ts` inkluderar Tailwind-pluginet, att `src/shared/bus/swarmEventBus.ts` implementerar `publishLiveEvent` och `publishSerialMetric`, samt att `src/App.tsx` komponerar `RenderA2UI` och `AppShell` utan att regressionssviten eller FSD-granskningen fallerar (exit 0).

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **Aktivera Tailwind v4 i Vite:**
   - I `vite.config.ts` MÅSTE `@tailwindcss/vite` importeras och läggas till i `plugins: [react(), tailwindcss()]`.
2. **Metodharmonisering i SwarmEventBus:**
   - I `src/shared/bus/swarmEventBus.ts` MÅSTE `SwarmEventBus` kompletteras med:
     * `publishLiveEvent(type: SwarmEventType, payload: any): void` som delegerar till `this.emit(type, payload)`.
     * `publishSerialMetric(metric: any): void` som delegerar till `this.emit('swarm.serial.metric', metric)`.
3. **A2UI-komposition i App:**
   - I `src/App.tsx` MÅSTE `RenderA2UI` från `src/features/a2ui/` importeras och monteras i layouten tillsammans med `AppShell` under `SwarmProvider`.
   - Befintlig FSD-isolering förblir intakt (App.tsx äger kompositionen mellan a2ui och gemini_live_swarm).

---

## Scenariotriad (Den relationella och systemiska avsikten)

**Scenario: ATT FÖLJA – Gränssnittet kläs i färg och form**
  Givet att Vite startas mot webbläsaren
  När `vite.config.ts` laddar Tailwind-pluginet och `src/App.tsx` renderar A2UI-korten
  Så ska stilmallen appliceras korrekt med mörk bakgrund och formgivna kort
  Och människan möts av en lugn och inbjudande visuell rymd.

**Scenario: ATT VÄNDA OM – Händelsebussen skyddar mot körtidskrasch**
  Givet att `GeminiLiveSession` anropar `publishLiveEvent` vid start
  När händelsen skickas till bussen
  Så ska metoden finnas tillgänglig och vidarebefordra händelsen utan undantag
  Och webbläsaren drabbas inte av vita skärmar eller metodfel.

**Scenario: ATT FÖRLIKAS – Autonom integration fullbordas**
  Givet att alla tre filerna uppdateras autonomt av Byggmotorn
  När `pnpm verify` körs
  Så ska samtliga enhetstester, skriptkontroller och arkitekturregler lysa 100 % gröna
  Och systemet är redo för skarp körning via `pnpm dev`.
