# BYGGCYKEL LOGG: TCK-034
**Starttid:** 2026-10-31T11:09:44.409Z
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
Syftet är att ge användaren transparens och trygghet genom att synliggöra det kvarvarande kontextfönstret i realtid. Detta möjliggör mer kontrollerade och förutsägbara interaktioner.


#### 0a Att vända om: Kontraktsaudit
Kontraktsaudit slutförd. Uppdraget berör endast en FSD-domän, `gemini_live_swarm`, och håller sig strikt till givna API-kontrakt. Inga avvikelser i strukturen har identifierats.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
För att lösa TCK-034 formulerar jag tre ortogonala alternativ:

Alternativ 1: Direkt Context Injection via SwarmContext. Vi förlänger SwarmContext för att inkludera `usageRatio` och skickar detta direkt ned till `UnifiedPromptBar`. Detta är enkelt att implementera, men skapar en strikt koppling mellan kontext och komponent.

Alternativ 2: Händelsedriven Push-modell via SwarmEventBus. `UnifiedPromptBar` prenumererar på telemetrievent via `SwarmEventBus` för att hämta aktuell `usageRatio`. Detta avkopplar komponenterna maximalt och drar nytta av befintlig bussinfrastruktur.

Alternativ 3: Telemetry Hook Integrera via `useSwarmTelemetry`. Vi skapar en specificerad telemetrikrok i `UnifiedPromptBar` som direkt läser av minnesutnyttjandet från telemetriströmmen. Det håller telemetrilogik isolerad nära källan.


#### 2c Att vända om: Resiliensgranskning
Resiliensgranskningen visar att Alternativ 2, den händelsedrivna Push-modellen via SwarmEventBus, är mest resilient. Genom att avkoppla telemetrilogik från UI-komponenterna undviker vi strikta beroenden och säkerställer att komponenten förblir intakt även vid förändringar i kontextmodellen.


#### 2d Att förlikas: Mättnad
Jag har vägt spänningsfältet och förlikat de olika perspektiven. Alternativ 2, den händelsedrivna Push-modellen via SwarmEventBus, vinner kontraktet för att säkerställa maximal resiliens i arkitekturen. MÄTTNAD: JA.


#### 3a Att följa: Testspecifikation



#### 3b Att följa: Källkod



#### 3c Att förlikas: Slutgiltigt Byggkontrakt
För TCK-034 fastställer jag följande byggkontrakt: vi uppdaterar `promptBarHelper.ts` med funktionen `formatMemoryIndicator`, integrerar den i `UnifiedPromptBar.tsx` för visning, och bibehåller nuvarande exportstruktur i `index.ts`. Inga nya filer behöver skapas.
