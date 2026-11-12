# TCK-MAINT-039: Standardisera CloudEvent- och nyttolastleverans i SwarmEventBus

**Måldomän:** `scripts` & `src/shared/bus/swarmEventBus.ts`
**Mekanisk Acceptans:** `SwarmEventBus.emit()` i `src/shared/bus/swarmEventBus.ts` levererar det fullständiga `cloudEvent`-kuvertet till wildcard-lyssnare (`'*'`) och säkerställer att namngivna kanaler levererar den uppackade nyttolasten med en icke-uppräkningsbar `.data`-referens vid behov, så att både kuvertläsare (`env.data`) och direktläsare (`payload.componentId`) fungerar utan att bryta `toEqual`-assertions. Samtliga tester och FSD-kontroller passerar med exit 0.

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **Wildcard-leverans (`'*'`) med fullständigt CloudEvent:**
   - I `src/shared/bus/swarmEventBus.ts` MÅSTE `emit()` anropa alla lyssnare registrerade på `'*'` med det kompletta `cloudEvent`-objektet (`{ id, source, specversion, type, datacontenttype, time, data }`), så att `AppShell`, `SymbolCrown` och `PendulumStore` kan läsa `env.type` och `env.data`.
2. **Bakåtkompatibel nyttolastleverans på namngivna kanaler:**
   - För lyssnare registrerade på specifik `type` (ej `'*'`) beräknas `dataToSend` genom att packa upp `payload.data` om `payload` är ett kuvert med `'data' in payload`.
   - Om `dataToSend` är ett vanligt objekt (inte `null`, inte array) och saknar egen egenskap `'data'`, definiera en icke-uppräkningsbar egenskap via `Object.defineProperty(dataToSend, 'data', { value: dataToSend, enumerable: false, configurable: true })`.
   - Eftersom egenskapen är `enumerable: false` förblir `expect(received).toEqual(expected)` i befintliga tester 100 % intakt samtidigt som `env.data` aldrig blir `undefined`.
3. **Bevara FSD- och skriptinvarianter:**
   - Ändringen berör uteslutande `src/shared/bus/swarmEventBus.ts`.

---

## Scenariotriad (Den relationella och systemiska avsikten)

**Scenario: ATT FÖLJA – Samtalstråd, krona och händelselyssnare mottar rätt struktur**
  Givet att en händelse emitteras på `SwarmEventBus`
  När wildcard-lyssnare (`'*'`) och specifika lyssnare anropas
  Så ska wildcard-lyssnare få hela `cloudEvent`-kuvertet och specifika lyssnare få en nyttolast som stödjer både direkt åtkomst och `.data`
  Och hela gränssnittet reagerar i realtid.

**Scenario: ATT VÄNDA OM – Avvisande av tyst borttappad nyttolast**
  Givet att en lyssnare på en namngiven kanal läser `env.data` på ett vanligt objekt
  När händelsen levereras
  Så ska `.data` peka på nyttolasten i stället för att returnera `undefined`
  Utan att förorena objektets uppräkningsbara nycklar.

**Scenario: ATT FÖRLIKAS – Samtliga 23 testsviter och FSD-gränser består**
  Givet att `src/shared/bus/swarmEventBus.ts` uppdateras
  När `pnpm verify` körs
  Så ska samtliga befintliga och nya tester passera med exit 0.
