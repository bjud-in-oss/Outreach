# BYGGCYKEL LOGG: TCK-MAINT-039
**Starttid:** 2026-11-12T09:32:03.547Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
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

```


#### 1a Att följa: Intention & Nytta
Avsikten med det här uppdraget är att se till att vår händelsebuss hanterar data på ett mer pålitligt och förutsägbart sätt i alla led. Genom att skicka hela kuvertet till wildcard-lyssnare och samtidigt gömma en referens till `.data` på ett icke-uppräkningsbart vis för specifika kanaler, säkerställer vi att både kronan och applikationsskalet får rätt information samtidigt som vi bevarar våra befintliga tester och gränser intakta.


#### 0a Att vända om: Kontraktsaudit
Jag har genomfört kontraktsauditen för TCK-MAINT-039 och bekräftar att kraven är fullt förstådda. Vi kommer uteslutande att fokusera förändringen till `src/shared/bus/swarmEventBus.ts`. Jag ställer in systemet på att säkerställa att wildcard-lyssnare får hela CloudEvent-kuvertet, och att namngivna kanaler får en bakåtkompatibel nyttolast med en icke-uppräkningsbar referens till `.data`.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
Här är de tre ortogonala alternativen för att lösa standardiseringen av SwarmEventBus:

Alternativ ett innebär explicit grupputskick där vi separerar hanterare för specifik typ från jokertecken, och tillämpar icke-uppräkningsbara data-fält enbart på namngivna kanaler.

Alternativ två bygger på en enhetlig utskickslogik med kontextuell uppackning, där vi applicerar datatransformation i en intern loop baserat på målgrupp.

Slutligen fokuserar alternativ tre på defensiv immutabilitet och kuvertfabriker, där vi bygger upp ett komplett cloudEvent och transformerar payloaden innan leverans sker.


#### 2c Att vända om: Resiliensgranskning
Alternativ tre är det mest resilienta för att det säkerställer immutabilitet och korrekt kuvertleverans. Genom att bygga upp ett komplett CloudEvent och transformera payloaden innan leverans undviker vi tillståndsåverkan och skyddar våra testinvarianter. Status: Godkänd.


#### 2d Att förlikas: Mättnad
Jag bekräftar härmed att Alternativ tre är det vinnande kontraktet. Resiliensen genom immutabilitet och korrekt kuvertleverans ger bäst skydd för våra systeminvarianter. Deklarerar MÄTTNAD: JA.
