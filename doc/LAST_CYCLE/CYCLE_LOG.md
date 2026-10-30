# BYGGCYKEL LOGG: TCK-TEST-001
**Starttid:** 2026-10-30T12:20:06.270Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-TEST-001: Verifiera v10.4 Livscykeln

## 🎯 Intention & Nytta
Verifiera Outreach Coordination Engines v10.4 livscykel deterministiskt från Fas 0 till Fas 3 Teatern enligt specifikationen i `doc/features/telemetry.feature`.
Skapa en minimal, robust "Ping"-funktion under FSD-domänen `src/features/telemetry/`.
Funktionen sänder en typad `PingEvent` via EventBus när den anropas och valideras med ett tillhörande Zod-schema.

## 🔒 Invariant Ytterkontrakt (Oföränderligt i Fas 1)
```typescript
import { z } from 'zod';

export const PingEventSchema = z.object({
  type: z.literal('telemetry:ping'),
  timestamp: z.number(),
});

export type PingEvent = z.infer<typeof PingEventSchema>;

export interface PingResult {
  success: boolean;
  event: PingEvent;
}

export function emitPing(): PingResult;
```

## 🏛️ Domängränser (FSD)
- Domän: `src/features/telemetry/`
- Tillåtna externa importer: Enbart `src/shared/` och externa paket (`zod`). Inga korsvisa feature-importer.
- Exportyta via domänbarrel: `src/features/telemetry/index.ts` måste exportera `emitPing`, `PingEventSchema` och tillhörande typer.

## 📋 Acceptanskriterier
1. `src/__tests__/transient_TCK-TEST-001.test.ts` MÅSTE genereras autonomt i Steg 3a via `save_code` och innehålla `eventBus.subscribe` och `eventBus.emit` som Körtidsankare (steel-thread).
2. Testet MÅSTE falla med exit-kod 1 i Gate 3a innan källkod skrivs i Fas 2.
3. Inga korsvisa FSD-importer eller skrivningar utanför `src/features/telemetry/`.
4. Hela cykeln ska passera med grönt test och verifieras av `verify-architecture.js`.

```


#### 1a Att följa: Intention & Nytta
Jag har förstått intentionen. Målet är att deterministiskt verifiera v10.4-livscykeln i Outreach Coordination Engine genom att skapa och testa en typad "Ping"-funktion i domänen `src/features/telemetry/`. Jag kommer nu att formulera och spara beteendekontraktet som en Gherkin-feature.


#### 0a Att vända om: Kontraktsaudit
Kontraktsaudit är utförd. Domän och begränsningar i `src/features/telemetry/` är i full överensstämmelse med arkitekturens riktlinjer och invarianserna. Vi är redo att formalisera beteendekontraktet.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
För att uppfylla kraven formulerar jag nu tre ortogonala alternativ för arkitektonisk design i domänen telemetry:

Alternativ 1 är den statiska singleton-modellen, där emitPing anropar getGlobalSwarmEventBus direkt och sänder händelsen synkront.

Alternativ 2 är den injicerbara fabriksmodellen, där vi introducerar en kontexthanterare för att skicka eventbussen, vilket möjliggör bättre testbarhet utan globala beroenden.

Alternativ 3 är action-creator-modellen, där emitPing validerar och paketerar payloaden i ett oföränderligt resultatobjekt som i ett separat steg propageras ut på bussen.


#### 2c Att vända om: Resiliensgranskning
Alternativ 3 ger bäst resiliens och felhantering. Genom att separera validering och initiering av händelsen från själva publiceringen, minimerar vi risken för korrupta tillstånd och möjliggör strikt Zod-kontroll innan trafik når bussen.


#### 2d Att förlikas: Mättnad
Jag instämmer. Alternativ 3


#### 3a Att följa: Testspecifikation



#### 3b Att följa: Källkod



#### 3c Att förlikas: Slutgiltigt Byggkontrakt
Jag ser att startankaret är tomt och att det saknas information om uppdraget eller TCK-numret. Vänligen ange vilket ärende eller domän vi ska fokusera på för att kunna slutföra byggkontraktet.
