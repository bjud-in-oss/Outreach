# TCK-MAINT-038: Montera händelsestyrd A2UIContainer i applikationsroten

**Måldomän:** Rotkomposition (`src/App.tsx`)
**Mekanisk Acceptans:** `src/App.tsx` byter ut den statiska `RenderA2UI` mot `A2UIContainer` kopplad till `useSwarmContext().eventBus` inne i `SwarmProvider`, positionerad som ett svävande överlägg ovanför promptfältet i `AppShell`. Samtliga tester och FSD-arkitekturkontroller passerar med exit 0.

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **Rotkomposition i src/App.tsx:**
   - Importera `useSwarmContext` från `./features/gemini_live_swarm/index.ts` och `A2UIContainer` från `./features/a2ui/index.ts`.
   - Skapa en inre kompositionskomponent innanför `SwarmProvider` som hämtar `const { eventBus } = useSwarmContext();` och renderar `<AppShell />` samt `<A2UIContainer bus={eventBus} />`.
2. **Visuell placering utan layoutkollision:**
   - Eftersom `AppShell` upptar full vyhöjd (`h-screen w-screen overflow-hidden`), MÅSTE `<A2UIContainer bus={eventBus} />` omslutas av en fast positionerad behållare ovanför promptfältet (`className="fixed bottom-28 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4"`) så att generativa kort syns tydligt utan att klippas bort.
3. **Exponera bussen i webbläsaren för live-verifiering:**
   - I `useEffect` i rotkompositionen ska `(window as any).__SWARM_BUS__ = eventBus;` sättas så att händelser kan verifieras direkt i webbläsarens utvecklarkonsol.

---

## Scenariotriad (Den relationella och systemiska avsikten)

**Scenario: ATT FÖLJA – A2UI-bryggan blir levande i huvudvyn**
  Givet att applikationen laddas i webbläsaren under `SwarmProvider`
  När en händelse `a2ui:render` publiceras på den delade händelsebussen
  Så ska `A2UIContainer` fånga händelsen och rendera kortet ovanför promptfältet
  Och vid `a2ui:clear` ska kortet försvinna mjukt.

**Scenario: ATT VÄNDA OM – Ingen statisk eller död renderare i roten**
  Givet att `A2UIContainer` nu äger renderingen av A2UI-nyttolaster
  När `src/App.tsx` granskas
  Så ska den gamla oanslutna `RenderA2UI`-taggen vara borttagen
  Så att ingen dubblett eller tom rendering ligger kvar.

**Scenario: ATT FÖRLIKAS – Hela kedjan från buss till pixlar är sluten**
  Givet att `src/App.tsx` är uppdaterad
  När `pnpm verify` körs
  Så ska samtliga 23 testsviter och FSD-arkitekturkontrollen passera med exit 0.
