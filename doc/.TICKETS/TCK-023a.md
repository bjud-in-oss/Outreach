# TCK-023a: Spatial UI & Reflektions-Reglage (Harmonization)

## 1. MÅLDOMÄN OCH AVGRÄNSNING
- **FSD-Måldomän:** `src/features/gemini_live_swarm/ui/`
- **Syfte:** Harmonisera den rumsliga layouten (SplitPaneCanvas, SymbolCrown) och införa ett typsäkert Reflektions-reglage i den nedre rotraden för att styra agenternas autonoma oscillationsdjup.

## 2. KRAVSPECIFIKATION

### 2.1 Zod-Kontrakt & State (reflectionStateHelper)
- Skapa filen `src/features/gemini_live_swarm/ui/reflectionStateHelper.ts`.
- Exportera ett Zod-schema: `ReflectionModeSchema = z.enum(['normal', 'mikro', 'makro', 'meta'])`.
- Exportera typen `ReflectionMode` infererad från schemat.

### 2.2 Reflektions-Reglage (ReflectionModeSelector)
- Skapa komponenten `src/features/gemini_live_swarm/ui/ReflectionModeSelector.tsx`.
- Komponenten ska formges som en ren, horisontell knapprad (Segmented Control) med de fyra lägena: `normal | mikro | makro | meta`.
- Den ska integreras i appens nedre rotrad (t.ex. `ControlBar.tsx` eller svävande docka i botten av `AppShell.tsx`).
- Det valda tillståndet ska valideras mot `ReflectionModeSchema` och göras tillgängligt för prenumeration från överordnade komponenter (eller via appens befintliga `SwarmContext`/EventBus).

### 2.3 Symbol Crown & Split Pane (Harmonisering)
- **Symbol Crown:** Uppdatera `SymbolCrown.tsx` så att dess visuella tillstånd (animation/färg) speglar Orchestrator-agentens status, med Zod-validering i `crownStateHelper.ts`. Subtil visuell feedback ska visas när användaren byter läge på reglaget.
- **Split Pane:** Säkerställ att `SplitPaneCanvas.tsx` hanterar mjuka touch-gester och en responsiv tre-stegs-delning utan layout-krascher.

## 3. DESTRUKTIVA HANDLINGSSTEG (SANERING AV GAMLA TCK-023)
Byggmotorn SKA radera följande föråldrade element under denna FSD-domän:
- Radera eventuella hårdkodade layout-konstanter i `AppShell.tsx` som krockar med den nya flexibla `SplitPaneCanvas`.
- Radera oanvända/döda CSS-klasser eller föråldrade händelselyssnare i `TouchOverlayMenu.tsx`.
- Sanera döda UI-mockar (mock-komponenter för UI-tillstånd) som nu ersätts av skarp logik.