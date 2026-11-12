# BYGGCYKEL LOGG: TCK-050
**Starttid:** 2026-11-12T08:00:05.179Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-050: Händelsestyrd A2UI-brygga för Autonom Komponentstyrning

**Måldomän:** `a2ui` (`src/features/a2ui/`)
**Mekanisk Acceptans:** Ett transient TSX-test bevisar (Fail-First via @testing-library/react) att lyssnarkomponenten (`A2UIContainer`) förblir dold (return null) vid start, men automatiskt renderar ett `ListeningCard` när eventet `a2ui:render` publiceras på `SwarmEventBus` med `{ componentId: 'ListeningCard', dataModel: { intent: '...' } }`. Vid `a2ui:clear` ska komponenten återgå till dolt läge (null). Alla FSD- och arkitekturkontroller ska passera med exit code 0.

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **Dold som standard (Tomt-tillstånds-skydd i renderer.tsx):**
   - I `src/features/a2ui/engine/renderer.tsx` MÅSTE `RenderA2UI` returnera `null` om `payload` eller `payload.componentId` saknas eller är en tom sträng.
   - Bevara kompatibilitet så att `RenderA2UI` fungerar både som funktionsanrop `RenderA2UI(payload)` (för befintliga tester i `a2uiSchema.test.ts`) och som JSX-komponent `<RenderA2UI componentId={...} dataModel={...} />`.
   - `FallbackComponent` ska enbart visas om `componentId` är en icke-tom sträng som inte finns i katalogen.
2. **Händelselyssnare (A2UIContainer.tsx):**
   - Skapa `A2UIContainer` i `src/features/a2ui/engine/A2UIContainer.tsx` med `save_code`. Den ska ta emot `bus: SwarmEventBus` som prop.
   - Den ska prenumerera via `bus.subscribe('a2ui:render', (data) => ...)` och `bus.subscribe('a2ui:clear', () => ...)` och uppdatera state som skickas till `RenderA2UI`.
   - Lyssnaren ska städa upp sina prenumerationer i `useEffect`-avregistreringen via returnerad unbind-funktion.
3. **Exakt katalogkontrakt (Inga gissningar):**
   - Befintlig `ListeningCard` i `src/features/a2ui/catalog/ListeningCard.tsx` matchar `componentId: 'ListeningCard'` och tar emot prop `intent?: string` (inte `prompt`).
4. **Strikt FSD-isolering (SSOT):**
   - `A2UIContainer` och dess test MÅSTE importera `SwarmEventBus` uteslutande från `src/shared/bus/swarmEventBus.ts` (t.ex. `../../../shared/bus/swarmEventBus` eller `@/shared/bus/swarmEventBus`).
   - Det är strikt förbjudet att importera från `src/features/gemini_live_swarm/`.
5. **Exportera komponenten:**
   - `A2UIContainer` ska exporteras via `src/features/a2ui/index.ts`.

---

## Scenariotriad (Den relationella och systemiska avsikten)

**Scenario: ATT FÖLJA – Agentens avsikt tar form på skärmen**
  Givet att `A2UIContainer` är monterad med tillgång till `SwarmEventBus`
  När händelsen `a2ui:render` publiceras med `{ componentId: 'ListeningCard', dataModel: { intent: 'Lyssnar på användaren' } }`
  Så ska komponenten uppdatera sitt React-tillstånd och rendera `ListeningCard`
  Och användaren möts av ett responsivt gränssnitt.

**Scenario: ATT VÄNDA OM – Avvisande av felaktiga varningar i viloläge**
  Givet att ingen A2UI-händelse har tagits emot
  När `A2UIContainer` eller `RenderA2UI` exekverar
  Så ska komponenten förbli tyst och returnera null
  Utan att visa gula varningsrutor om saknade komponenter.

**Scenario: ATT FÖRLIKAS – En stabil händelsebrygga**
  Givet att implementationen fullbordas
  När `pnpm verify` körs
  Så ska alla tester i testsviten passera grönt och arkitekturgranskaren godkänna FSD-gränserna
  Och komponenten är redo att monteras i rotapplikationen.

```


#### 1a Att följa: Intention & Nytta
Jag förstår precis. Målet med TCK-050 är att bygga en stabil händelsebrygga så att agentens avsikt faktiskt visas visuellt för användaren, som med ListeningCard, när händelsen så kräver. På så sätt skapar vi ett mer responsivt och begripligt gränssnitt.

Ska vi sätta igång med planeringssvepet för att förverkliga det här?


#### 0a Att vända om: Kontraktsaudit
Kontraktsaudit för TCK-050 slutförd. Arbetet begränsas strikt till domänen a2ui utan otillåtna importer, och systemiska invarianter i renderer.tsx är säkrade.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
Alternativ 1 innebär en direkt implementation via `useState` och `useEffect` i `A2UIContainer`, vilket håller komponenten enkel och fokuserad.

Alternativ 2 flyttar prenumerationslogiken till en separat custom hook, vilket separerar concerns och underlättar testning.

Alternativ 3 använder en Higher-Order Component för att sprida A2UI-staten till komponenten, vilket ger en mer modulär återanvändbarhet.


#### 2c Att vända om: Resiliensgranskning
Alternativ 2 är det mest resilienta valet eftersom det separerar prenumerationslogiken och händelsehanteringen i en egen hook. Det skyddar komponenten från onödig komplexitet och gör den lättare att testa isolerat, vilket minimerar risken för haverier. Vi väljer Alternativ 2.


#### 2d Att förlikas: Mättnad
Jag bekräftar att Alternativ 2 är det vinnande kontraktet tack vare sin resilienta struktur. Jag deklarerar härmed MÄTTNAD: JA för steg 2d.


#### 3a Att följa: Testspecifikation



#### 3b Att följa: Källkod



#### 3c Att förlikas: Slutgiltigt Byggkontrakt
Det slutgiltiga byggkontraktet för TCK-050 fastställs nu. Vi skapar `src/features/a2ui/engine/A2UIContainer.tsx` för händelselyssning, uppdaterar `src/features/a2ui/index.ts` med export, och exekverar verifiering via testet i `src/__tests__/transient_TCK-050.test.tsx`. Processen fortsätter nu.
