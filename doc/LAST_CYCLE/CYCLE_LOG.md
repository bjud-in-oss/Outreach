# BYGGCYKEL LOGG: TCK-034
**Starttid:** 2026-10-31T08:38:35.627Z
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
Givet att användaren interagerar med swarm-sessionen, när den aktuella kontextanvändningen uppdateras, så ska en formaterad textindikator visas till vänster ovanför textarean som visar hur många procent av minnet som finns kvar.


#### 0a Att vända om: Kontraktsaudit
[Kontraktsaudit Godkänd: TCK-034 berör enbart domänen gemini live swarm. Gherkin-scenario är formulerat och inväntar avsiktsgrinden.]


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
För att lösa TCK-034 har vi tre ortogonala alternativ.

Alternativ 1 innebär direkt state-bindning via UnifiedPromptBars befintliga hake för att utöka tillståndshämtningen.

Alternativ 2 bygger på händelsedriven uppdatering genom att lyssna på telemetri- eller kontext-händelser via SwarmEventBus för maximal frikoppling.

Alternativ 3 skapar en dedikerad sub-komponent och en isolerad custom hook för att hålla minnesindikatorns logik helt inkapslad.


#### 2c Att vända om: Resiliensgranskning
Resiliensgranskningen visar att Alternativ 2 ger bäst felhantering och frikoppling eftersom komponenten lyssnar på händelsebussen och är robust mot avbrott i tillståndshanteringen, till skillnad från direkt state-bindning. Detta stödjer också snabb felpropagering.


#### 2d Att förlikas: Mättnad
Resiliensgranskningen visar att Alternativ 2 ger bäst felhantering och frikoppling eftersom komponenten lyssnar på händelsebussen och är robust mot avbrott i tillståndshanteringen. Vi slår fast detta som vinnande alternativ och deklarerar därmed MÄTTNAD: JA.


#### 3a Att följa: Testspecifikation



#### 3b Att följa: Källkod



#### 3c Att förlikas: Slutgiltigt Byggkontrakt
Det slutgiltiga byggkontraktet för TCK-034 fastställer att vi skapar eller modifierar två filer inom domänen `gemini_live_swarm`.

Vi ska först uppdatera `promptBarHelper.ts` med funktionen för att formatera minnesindikatorn. Därefter integrerar vi indikatorn i komponenten `UnifiedPromptBar.tsx` för att rendera värdet placerat absolut till vänster ovanför textarean. Alla ändringar sker inom den angivna domänen.
