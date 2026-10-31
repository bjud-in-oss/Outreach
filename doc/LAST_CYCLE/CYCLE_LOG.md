# BYGGCYKEL LOGG: TCK-034
**Starttid:** 2026-10-31T11:56:45.604Z
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
Feature: Minnesindikator i promptfältet
  Som användare vill jag kunna se hur mycket minne jag har kvar i sessionen, så att jag kan hantera mina prompter effektivt.

Scenario: Visa återstående minne Givet en aktiv session i UnifiedPromptBar När gränssnittet renderas Så ska en minnesindikator visas absolut placerat till vänster ovanför textarean och formateras som "[Ledigt XX%]" baserat på tillgänglig kapacitet.


#### 0a Att vända om: Kontraktsaudit
Kontraktsaudit för TCK-034 godkänd. Domänbegränsningen hålls till `gemini_live_swarm` och inga externa API-beroenden aktiveras. Vi kan gå vidare mot Fas 1.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
Givet målet att integrera minnesindikatorn presenteras här tre ortogonala alternativ för lösning.

Alternativ ett: Direkt tillståndshantering via befintlig kontext där UnifiedPromptBar använder useSwarmContext för att direkt hämta usageRatio och beräkna indikatorn lokalt.

Alternativ två: Händelsedriven uppdatering via SwarmEventBus där en dedikerad telemetry-modul sänder minnesstatistik och komponenten reagerar på specifika event.

Alternativ tre: Anpassad hook där en ny useMemoryIndicator-hook skapas för att kapsla in logiken för minnesavläsning och formatering.


#### 2c Att vända om: Resiliensgranskning
Vid en resiliensgranskning faller alternativ ett på grund av för tight koppling till kontexten, vilket skapar sårbarhet om kontexten sviktar. Alternativ två ger bäst frikoppling och resiliens via EventBussen, men kräver robust hantering av inledande tillstånd. Alternativ tre, den anpassade hooken, erbjuder bäst förutsättningar för isolerad felhantering och enhetstester utan att påverka källkoden negativt.


#### 2d Att förlikas: Mättnad
Efter en noggrann avvägning av spänningsfältet mellan resiliens, frikoppling och testbarhet, slår jag fast att alternativ tre, den anpassade hooken, är det vinnande kontraktet. Den ger oss de bästa förutsättningarna för isolerad felhantering. MÄTTNAD: JA.


#### 3a Att följa: Testspecifikation



#### 3b Att följa: Källkod



#### 3c Att förlikas: Slutgiltigt Byggkontrakt
För att uppfylla TCK-034 fastställer jag följande byggkontrakt: vi utökar `promptBarHelper.ts` med funktionen `formatMemoryIndicator` och integrerar den i `UnifiedPromptBar.tsx` för att rendera minnesdisplayen. Vi behåller befintliga exportinvarianter i `index.ts`.
