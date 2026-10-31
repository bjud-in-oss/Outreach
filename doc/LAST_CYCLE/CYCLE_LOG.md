# BYGGCYKEL LOGG: TCK-034
**Starttid:** 2026-10-31T08:11:00.053Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-034: Minnesindikator i Promptfältet

## MÅL
Integrera och synliggöra hur mycket minne (kontextfönster) som finns kvar för användaren direkt i promptfältets gränssnitt genom en formaterad textindikator.

## DOMÄN
`src/features/gemini_live_swarm/`

## IMPLEMENTATION
- Nyttja funktionen `formatMemoryIndicator` i `promptBarHelper.ts` som beräknar ledig procent baserad på `usageRatio`.
- Rendera `memoryDisplay` i `UnifiedPromptBar.tsx` placerat absolut till vänster ovanför textarean.

## KODBLOCK
```typescript
export function formatMemoryIndicator(usageRatio?: number): string {
  if (usageRatio === undefined) return '[Ledigt --%]';
  const freePercentage = Math.round((1 - Math.min(Math.max(usageRatio, 0), 1)) * 100);
  return `[Ledigt ${freePercentage}%]`;
}
```

```


#### 1a Att följa: Intention & Nytta
Givet att användaren interagerar med gränssnittet, när systemet beräknar återstående minne för kontextfönstret, så ska en textindikator visa den exakta procenten av tillgängligt utrymme.


#### 0a Att vända om: Kontraktsaudit
Kontraktsaudit genomförd. TCK-034 rör endast en FSD-domän, `gemini_live_swarm`, och inkluderar korrekta ändringar i `UnifiedPromptBar.tsx` och `promptBarHelper.ts`. Planeringen fortsätter nu till intention-grinden.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
För att lösa TCK-034 formulerar jag tre ortogonala alternativ för lösning:

Alternativ ett är en kontextstyrd modell, där komponenten UnifiedPromptBar drar användningsratio direkt från den befintliga SwarmContext.

Alternativ två är en händelsestyrd modell, där vi utnyttjar SwarmEventBus för att skicka och konsumera specifika teletryhändelser för kontextuppdateringar.

Alternativ tre är att använda en anpassad krok, `useMemoryIndicator`, som kapslar in all logik kring hämtning och formatering av minnesindikatorn.


#### 2c Att vända om: Resiliensgranskning
Vid en resiliensgranskning av de tre alternativen framstår det tredje alternativet, den anpassade kroken, som det mest resilienta. Den kapslar in all logik och minimerar beroenden, vilket underlättar felhantering och isolering av komponenten.


#### 2d Att förlikas: Mättnad
Med grund i resiliensgranskningen slår jag fast att det tredje alternativet, den anpassade kroken, är det vinnande kontraktet. Det ger bäst isolering och felhantering. MÄTTNAD: JA.


#### 3a Att följa: Testspecifikation



#### 3b Att följa: Källkod



#### 3c Att förlikas: Slutgiltigt Byggkontrakt
För TCK-034 fastställer jag följande byggkontrakt: Vi kommer att uppdatera `promptBarHelper.ts` med funktionen `formatMemoryIndicator` och integrera denna minnesindikator i `UnifiedPromptBar.tsx` för att synliggöra det lediga kontextfönstret.
