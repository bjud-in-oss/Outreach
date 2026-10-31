# BYGGCYKEL LOGG: TCK-034
**Starttid:** 2026-10-31T13:03:32.284Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-034: Visning av kontextminne

## Beskrivning
Användaren vill kunna se hur mycket kontextminne som används direkt i gränssnittet, placerat alldeles framför "👤 Du:"-etiketten.

## Teknisk specifikation
Implementera en funktion för att hämta och formatera kontextminnesanvändningen.

```typescript
import { ContextUsageMetric } from '../features/gemini_live_swarm/telemetry/contextUsageMetricSchema';

export function formatMemoryIndicator(metric: ContextUsageMetric): string {
  // Formaterar kontextminnesanvändningen för visning i UI
  return `${metric.usedTokens} / ${metric.maxTokens} tokens`;
}
```

## Godkännandekriterier
- [ ] En indikator för minnesanvändning visas i UI.
- [ ] Indikatorn är placerad precis före "👤 Du:"-texten.
- [ ] Informationen uppdateras i realtid under sessionen.

```


#### 1a Att följa: Intention & Nytta
Givet att en pågående Gemini Live-session är etablerad, när systemet tar emot en uppdatering av kontextminnesanvändningen, så ska minnesindikatorn visas och uppdateras i realtid, placerad precis framför "👤 Du:"-etiketten.


#### 0a Att vända om: Kontraktsaudit
Vi har påbörjat kontraktet för TCK-034 och bekräftar att uppdraget berör max en domän, `gemini_live_swarm`, i linje med våra regler.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
För att lösa TCK-034 och visa kontextminnet i gränssnittet finns det tre olika arkitektoniska tillvägagångssätt.

Det första alternativet är att bygga en händelsedriven lösning som använder SwarmEventBus. Vi låter telemetridata strömma genom bussen och prenumererar direkt i komponenten, vilket gör lösningen helt frikopplad.

Det andra alternativet är att utöka SwarmContext och använda en custom hook. Det innebär att minnesdatan blir en naturlig del av reaktets tillståndsträd och ger en mycket ren och reaktiv komponentmodell.

Det tredje alternativet är att integrera källan direkt i en dedikerad mätarstore, liknande pendulumStore. Man polerar eller prenumererar på den specifika metrikmodulen, och får på så sätt full kontroll över telemetristyrningen.


#### 2c Att vända om: Resiliensgranskning
Resiliensgranskningen visar att alternativ ett, den händelsedrivna lösningen via SwarmEventBus, ger bäst isolation och minskar risken för kaskadfel. Alternativ två medför för hög koppling till det centrala tillståndsträdet, medan alternativ tre ökar komplexiteten i onödan för just detta krav. Vi bör fokusera på stark validering för högsta resiliens.


#### 2d Att förlikas: Mättnad
Jag fastställer att alternativ ett, den händelsedrivna lösningen via SwarmEventBus, är det vinnande alternativet. Detta val ger bäst isolation och minimerar risken för kaskadfel. Mättnad: JA.


#### 3a Att följa: Testspecifikation



#### 3b Att följa: Källkod



#### 3c Att förlikas: Slutgiltigt Byggkontrakt
För att uppfylla TCK-034 kommer vi att skapa en ny fil, `telemetryUtils.ts`, för att hantera formateringen av minnesindikatorn. Vi kommer även att uppdatera `index.ts` i telemetry-domänen för att exportera denna funktion.
