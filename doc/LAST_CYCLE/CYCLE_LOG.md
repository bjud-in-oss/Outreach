# BYGGCYKEL LOGG: TCK-034
**Starttid:** 2026-10-31T11:43:08.687Z
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
Givet att jag befinner mig i en interaktiv session och systemet spårar minnesanvändningen, när minneskvoten ändras, så ska jag se en formaterad textindikator för minnesstatus visas absolut placerad till vänster ovanför promptfältets textarea.


#### 0a Att vända om: Kontraktsaudit
Granskningen är genomförd. Förändringen påverkar enbart domänen `gemini_live_swarm` och är helt i linje med våra FSD-kontrakt. Inga historiska tester påverkas negativt.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
För att lösa TCK-034 och integrera minnesindikatorn i UnifiedPromptBar, formulerar jag tre olika metodiska alternativ.

Det första alternativet är direkt kontextkonsumtion, där vi drar usageRatio direkt från svärmens existerande kontext-hook.

Det andra alternativet är eventdriven dataströmning, där komponenten prenumererar på telemetri-event via SwarmEventBus för asynkrona uppdateringar.

Det tredje alternativet är en frikopplad custom-hook, som abstraherar all logik och formatering till en separat enhet som komponenten sedan använder.


#### 2c Att vända om: Resiliensgranskning
Givet resiliensgranskningen av alternativen är alternativet med en frikopplad custom-hook det mest resilienta. Genom att kapsla in tillståndshantering och säkra anrop mot ett definierat kontrakt isoleras eventuella fel och latenta nätverksproblem, vilket skyddar gränssnittet från att propagera fel och säkerställer en stabil renderering genom gracefull degradation.


#### 2d Att förlikas: Mättnad
Det vinnande alternativet är den frikopplade custom-hooken. Genom att kapsla in tillståndshantering och gränssnittskommunikation enligt ett strikt kontrakt uppnår vi maximal resiliens. Fel isoleras effektivt, vilket möjliggör en stabil och förutsägbar renderering. MÄTTNAD: JA.


#### 3a Att följa: Testspecifikation



#### 3b Att följa: Källkod



#### 3c Att förlikas: Slutgiltigt Byggkontrakt
För TCK-034 fastställer jag följande byggkontrakt: vi uppdaterar ui/promptBarHelper.ts med funktionen formatMemoryIndicator, och integrerar denna i ui/UnifiedPromptBar.tsx för att rendera minnesindikatorn visuellt. Inga ändringar krävs i index.ts.
