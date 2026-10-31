# BYGGCYKEL LOGG: TCK-034
**Starttid:** 2026-10-31T07:40:31.982Z
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
Givet att användaren interagerar med promptfältet, och att systemet har beräknat användningsgraden av kontextfönstret, när gränssnittet uppdateras, så ska en textindikator visa den procentuella mängden ledigt minne direkt ovanför textarean.


#### 0a Att vända om: Kontraktsaudit
Kontraktsaudit för TCK-034 slutförd och godkänd. Uppdraget omfattar enbart domänen gemini live swarm och följer fastställda gränssnittskontrakt enligt Feature-Sliced Design. Inga destruktiva ändringar upptäckta. Vi fortsätter enligt plan.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
Här är tre ortogonala alternativ för att integrera minnesindikatorn i `UnifiedPromptBar.tsx`:

Det första alternativet är händelsebaserad uppdatering, där `SwarmEventBus` används för att driva in nya värden för minnesanvändning.

Det andra alternativet är kontextbaserad avläsning, där komponenten prenumererar på det aktuella tillståndet direkt via `SwarmContext`.

Det tredje alternativet är en lokal uppdateringslogik, där en anpassad krok kapslar in logiken för att övervaka och beräkna minnesvärden specifikt för promptfältet.


#### 2c Att vända om: Resiliensgranskning
För att säkerställa maximal stabilitet och resiliens granskar vi nu de tre alternativen baserat på riskanalys.

Det första alternativet, händelsebaserad uppdatering via SwarmEventBus, ger hög frikoppling men medför en risk för att missa det initiala tillståndet och kräver rigorös hantering av prenumerationer för att undvika minnesläckor.

Det andra alternativet, kontextbaserad avläsning via SwarmContext, garanterar synkronisering men riskerar att orsaka onödiga omrenderingar och skapar en starkare bindning till den globala Providerns livscykel.

Det tredje alternativet, lokal uppdateringslogik, erbjuder högsta isolering och kapslar in funktionaliteten specifikt för promptfältet, vilket minimerar beroenden men kan leda till redundans om mätvärdena behövs på andra platser.


#### 2d Att förlikas: Mättnad
Vi väger samman spänningsfältet och finner att det andra alternativet, kontextbaserad avläsning via SwarmContext, ger den mest stabila grunden för synkroniserad data. Vi deklarerar härmed MÄTTNAD: JA.


#### 3a Att följa: Testspecifikation



#### 3b Att följa: Källkod



#### 3c Att förlikas: Slutgiltigt Byggkontrakt
Filer som ska skapas och uppdateras är `src/features/gemini_live_swarm/ui/promptBarHelper.ts` för att lägga till funktionen `formatMemoryIndicator`, samt `src/features/gemini_live_swarm/ui/UnifiedPromptBar.tsx` för att integrera och rendera minnesindikatorn. `index.ts` kommer att bevaras och säkerställa att alla befintliga exports finns kvar. Vi skapar även ett transient test för `UnifiedPromptBar`.
