# BYGGCYKEL LOGG: TCK-034
**Starttid:** 2026-10-31T13:19:07.079Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-034: Visning av kontextminne

## DOMÄN
`src/features/gemini_live_swarm/`

## Beskrivning
Användaren vill kunna se hur mycket kontextminne som används direkt i gränssnittet, placerat alldeles framför "👤 Du:"-etiketten.

## Teknisk specifikation
Implementera en funktion för att hämta och formatera kontextminnesanvändningen.

```typescript
import { ContextUsageMetric } from 'src/features/gemini_live_swarm/telemetry/contextUsageMetricSchema';

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
Givet att en Gemini Live-session är aktiv och kontextminne används, när jag interagerar med systemet, så ska den aktuella minnesanvändningen visas alldeles framför "👤 Du:"-etiketten.


#### 0a Att vända om: Kontraktsaudit
Granskningen är genomförd och godkänd. Uppdraget omfattar endast FSD-domänen `gemini_live_swarm` och håller sig strikt till API-kontraktet. Vi går vidare till vägval och förlikningsporten.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
Här är tre ortogonala alternativ för att lösa TCK-034 och visa kontextminnet.

Alternativ ett: Direkt kontextkoppling. Vi integrerar minnesmätet i `SwarmContext` eller `useSwarmTelemetry`, och låter UI-komponenterna prenumerera direkt på uppdateringarna för att ritas om.

Alternativ två: Händelsedriven ström. Vi publicerar minnesmätetalen via `SwarmEventBus` och skapar en dedikerad hook som lyssnar på specifika telemetrievenemang för realtidsuppdatering direkt i komponenten.

Alternativ tre: Observerbaserad lokal butik. Vi etablerar en separat observabel lagring för minnesstatistik som uppdateras av telemetrimotorn, där UI-ytan sedan observerar butiken för ändringar.


#### 2c Att vända om: Resiliensgranskning
Ur ett resiliensperspektiv och utifrån våra FSD-principer är alternativ två bäst. Det isolerar minnesstatistiken från det centrala tillståndet via SwarmEventBus, vilket minskar risken för onödiga omritningar och stoppar fel från att propagera.


#### 2d Att förlikas: Mättnad
Alternativ två är härmed fastställt som det vinnande kontraktet. Vi uppnår maximal isolering och resiliens genom att låta minnesstatistiken kommunicera uteslutande via SwarmEventBus. Mättnad: JA.


#### 3a Att följa: Testspecifikation



#### 3b Att följa: Källkod



#### 3c Att förlikas: Slutgiltigt Byggkontrakt
För att genomföra TCK-034 skapar vi en ny hjälpfunktion i `src/features/gemini_live_swarm/ui/promptBarHelper.ts` som förvaltar formatet för minnesindikatorn. Sedan bevarar och uppdaterar vi `src/features/gemini_live_swarm/ui/UnifiedPromptBar.tsx` för att integrera denna indikator och koppla den till telemetridatan för realtidsuppdatering.
