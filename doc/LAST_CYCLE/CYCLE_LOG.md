# BYGGCYKEL LOGG: TCK-034
**Starttid:** 2026-10-31T10:05:13.617Z
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
Givet att användaren interagerar med promptfältet
När systemet beräknar den aktuella minneskvoten
Så ska textindikatorn för det lediga utrymmet visas ovanför textarean till vänster


#### 0a Att vända om: Kontraktsaudit
TCK-034 är godkänd. Uppdraget håller sig till en domän under `src/features/gemini_live_swarm/` och API-kontraktet för minnesindikatorn är korrekt validerat enligt instruktionerna.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
För att uppfylla TCK-034 och synliggöra minnesindikatorn formulerar jag följande tre ortogonala alternativ för lösning:

Alternativ ett: Lokal hookbaserad avläsning i komponenten. Vi skapar en intern hook i `UnifiedPromptBar.tsx` som hämtar `usageRatio` direkt från `SwarmContext` och låter komponenten formatera och rendera texten lokalt vid varje uppdatering.

Alternativ två: Händelsedriven uppdatering via SwarmEventBus. En ny telemetry-händelse publiceras på eventbussen när minnesstatusen ändras. `UnifiedPromptBar` prenumererar på denna händelse och reagerar genom att trigga en lokal omladdning av indikatorns värde.

Alternativ tre: Central spridning genom kontextutökning. Vi utökar den befintliga `SwarmCoreContext` så att minnesinformationen ingår i kärnkontexten. Därefter injiceras värdet direkt till komponenten utan behov av ytterligare prenumerationer eller interna hooks.


#### 2c Att vända om: Resiliensgranskning
Vid en resiliensgranskning står Alternativ två ut som mest resilient. Den händelsedrivna uppdateringen via SwarmEventBus isolerar komponenten från kärnkontextens livscykel och förhindrar kaskadfel.


#### 2d Att förlikas: Mättnad
Jag har vägt spänningsfältet och fastställer härmed att Alternativ två är det vinnande kontraktet. Arkitekturen med SwarmEventBus ger den resiliens som krävs. MÄTTNAD: JA.


#### 3a Att följa: Testspecifikation



#### 3b Att följa: Källkod



#### 3c Att förlikas: Slutgiltigt Byggkontrakt
Det slutgiltiga byggkontraktet för TCK-034 fastställer att uppdateringar ska ske i `promptBarHelper.ts` för integrering av `formatMemoryIndicator`, samt i `UnifiedPromptBar.tsx` för att rendera minnesindikatorn absolut till vänster ovanför textytan. Vi bevarar existerande strukturer i `index.ts` för bibehållen modularitet.
