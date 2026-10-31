# BYGGCYKEL LOGG: TCK-034
**Starttid:** 2026-10-31T09:02:01.378Z
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
Målet med denna implementering är att ge användaren en direkt transparens om hur mycket kontextutrymme som finns kvar i sessionen. Genom att visualisera detta främjar vi trygghet och kontroll i samtalet med systemet. Jag skapar nu beteendekontraktet i en feature-fil.


#### 0a Att vända om: Kontraktsaudit
Jag har auditerat TCK-034: Kontraktet omfattar enbart en FSD-domän (`gemini_live_swarm`) och följer de tekniska riktlinjerna. Jag bekräftar att uppdraget är redo för nästa steg i Fas 0.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
Här är tre ortogonala alternativ för lösning:

Alternativ 1: Direkt kontextinjektion. `UnifiedPromptBar` använder den befintliga kroken för swarm-kontext och läser av `usageRatio` direkt i komponenten via en ny lokal state.

Alternativ 2: Händelsedriven uppdatering. Komponenterna prenumererar på telemetri-event via globala `SwarmEventBus` och uppdaterar minnesindikatorn först när ny data publiceras.

Alternativ 3: Observatörsmönster via specifik mät-krok. Vi skapar en dedikerad krok som isolerar hämtningen av telemetri från övrig kontext och returnerar formaterat värde redo för rendering.


#### 2c Att vända om: Resiliensgranskning
Granskning av alternativen visar att Alternativ 3 är mest resilient. Det isolerar telemetrihämtningen i en specifik krok, vilket minskar risken för sidoeffekter vid kontextändringar och skyddar FSD-gränserna bäst mot framtida nätverkskrascher eller latenta fel i kontextmodellen.


#### 2d Att förlikas: Mättnad
Baserat på granskningen av spänningsfältet och resiliensanalysen står det klart att Alternativ 3 är det vinnande kontraktet. Det isolerar telemetrihämtningen i en krok som skyddar FSD-gränserna bäst. MÄTTNAD: JA.


#### 3a Att följa: Testspecifikation



#### 3b Att följa: Källkod



#### 3c Att förlikas: Slutgiltigt Byggkontrakt
Baserat på TCK-034 fastställer jag att följande filer ska modifieras och bevaras: `src/features/gemini_live_swarm/ui/promptBarHelper.ts` för att inkludera `formatMemoryIndicator`, och `src/features/gemini_live_swarm/ui/UnifiedPromptBar.tsx` för integrering av minnesindikatorn.
