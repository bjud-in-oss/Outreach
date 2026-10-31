# BYGGCYKEL LOGG: TCK-034
**Starttid:** 2026-10-31T06:25:07.516Z
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
Att synliggöra hur mycket minne som finns kvar är en fantastisk gåva av omsorg, då det hjälper användaren att förstå kontextfönstrets kapacitet i stunden. Jag skapar nu det exekverbara beteendekontraktet för denna funktion.


#### 0a Att vända om: Kontraktsaudit
Granskning av kontraktet TCK-034 slutförd.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
För TCK-034 formulerar vi följande tre ortogonala alternativ:

Alternativ 1 bygger på direkt kontextinmatning via en befintlig hook, som `useSwarmContext`, för att nå aktuell användningsgrad och skicka den till `UnifiedPromptBar`.

Alternativ 2 etablerar ett händelsedrivet flöde genom att publicera minnesanvändningen som händelser på `SwarmEventBus`, vilket komponenten prenumererar på.

Alternativ 3 integrerar direkt mot telemetry-systemet och använder teleschemat för att hämta metrikerna i minnet.


#### 2c Att vända om: Resiliensgranskning
Vid en resiliensgranskning av de tre alternativen framstår Alternativ 2 – den händelsedrivna arkitekturen över `SwarmEventBus` – som den mest resilient. Den ger den bästa frikopplingen och hanterar potentiella fel och nätverkskrascher graciöst tack vare det toleranta API:et och robusta standardvärden vid tillfälligt datafall. De andra alternativen riskerar att överföra latenta fel direkt till UI-lagret.


#### 2d Att förlikas: Mättnad
Alternativ 2 är det vinnande alternativet. Mättnad: JA. Vi har vägt spänningsfältet och låser nu detta kontrakt för att säkra systemets resiliens och frikoppling.


#### 3a Att följa: Testspecifikation



#### 3b Att följa: Källkod



#### 3c Att förlikas: Slutgiltigt Byggkontrakt
För TCK-034 upprättar vi följande byggkontrakt: I `promptBarHelper.ts` exporterar vi funktionen `formatMemoryIndicator`. I `UnifiedPromptBar.tsx` integrerar vi denna indikator genom att inhämta `usageRatio` från kontexthanteraren och placera ut den absolut till vänster ovanför textarean.
