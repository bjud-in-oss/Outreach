# TCK-023a: Spatial UI & Reflektions-Reglage (Harmonization)

## 1. MÅLDOMÄN OCH AVGRÄNSNING
- **FSD-Måldomän:** `src/features/gemini_live_swarm/ui/`
- **Syfte:** Harmonisera den rumsliga layouten (SplitPaneCanvas, SymbolCrown) och införa ett typsäkert Reflektions-reglage i den nedre rotraden. Reglagets tillstånd ska exporteras via `swarmEventBus` så att orkestratorn (i nästa TCK) kan läsa det utan cykliska komponentberoenden.

## 2. KRAVSPECIFIKATION

### 2.1 Zod-Kontrakt (reflectionStateHelper)
- Skapa filen `src/features/gemini_live_swarm/ui/reflectionStateHelper.ts`.
- Exportera Zod-schemat: `export const ReflectionModeSchema = z.enum(['normal', 'mikro', 'makro', 'meta']).default('normal');`
- Exportera typen: `export type ReflectionMode = z.infer<typeof ReflectionModeSchema>;`

### 2.2 Reflektions-Reglage & EventBus-integration
- Skapa komponenten `src/features/gemini_live_swarm/ui/ReflectionModeSelector.tsx`.
- Formge den som en horisontell knapprad (Segmented Control) i nedre rotraden med lägena: `normal | mikro | makro | meta`.
- **Kritisk State-Export:** När användaren klickar på ett läge ska komponenten inte bara uppdatera sitt lokala UI-state, utan även publicera en strängtyp-säker händelse till `swarmEventBus` (t.ex. `bus.emit('UI_REFLECTION_MODE_CHANGED', { mode })`). Detta är bron för orkestratorn.

### 2.3 Symbol Crown & Split Pane (Harmonisering)
- **Symbol Crown:** Uppdatera `SymbolCrown.tsx` så att dess visuella tillstånd (animation/färg) speglar Orchestrator-agentens status, med Zod-validering i `crownStateHelper.ts`. Subtil visuell feedback ska visas när användaren byter läge på reglaget.
- **Split Pane:** Säkerställ att `SplitPaneCanvas.tsx` hanterar mjuka touch-gester och en responsiv tre-stegs-delning utan layout-krascher.

## 3. DESTRUKTIVA HANDLINGSSTEG (SANERING AV GAMLA TCK-023)
Byggmotorn SKA radera följande föråldrade element under denna FSD-domän:
- Radera eventuella hårdkodade layout-konstanter i `AppShell.tsx` som krockar med den nya flexibla `SplitPaneCanvas`.
- Radera oanvända/döda CSS-klasser eller föråldrade händelselyssnare i `TouchOverlayMenu.tsx`.
- Sanera döda UI-mockar (mock-komponenter för UI-tillstånd) som nu ersätts av skarp logik.