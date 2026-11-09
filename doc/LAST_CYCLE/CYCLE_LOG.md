# BYGGCYKEL LOGG: TCK-045
**Starttid:** 2026-11-09T21:38:06.136Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-045: Bidi Live Multimodal SessionAdapter (Path Domain)

## 1. MÅL
Implementera en produktionsklar WebSocket-adapter (`src/features/path/engine/bidiLiveAdapter.ts`) som implementerar `SessionAdapter`-kontraktet för Vägmotorn. Adaptern ska ta emot en `CompiledPrompt`, skicka den över en Bidi Live WebSocket till modellen och returnera ett strukturerat svar med förbrukade tokens och felresiliens.

## 2. KÄLLKODSSPECIFIKATION FÖR DOMÄNEN
Måldomän: `src/features/path/` (Max 250 rader per logikfil enligt SI v10.5).

1. `src/features/path/contracts/pathSchema.ts`:
   - Deklarera och exportera Zod-schemat `BidiLiveAdapterConfigSchema`:
     ```typescript
     export const BidiLiveAdapterConfigSchema = z.object({
       apiKey: z.string().optional(),
       model: z.string().default('gemini-3.8-live'),
       systemInstruction: z.string().optional(),
       modality: z.enum(['AUDIO', 'TEXT']).default('AUDIO'),
       maxReconnectAttempts: z.number().default(3)
     });
     export type BidiLiveAdapterConfig = z.infer<typeof BidiLiveAdapterConfigSchema>;
     ```

2. `src/features/path/model/types.ts`:
   - Re-exportera `BidiLiveAdapterConfig` och `BidiLiveAdapterConfigSchema` från `../contracts/pathSchema` enligt SSOT-regeln.

3. `src/features/path/engine/bidiLiveAdapter.ts`:
   - Exportera funktionen `skapaBidiLiveAdapter(config?: Partial<BidiLiveAdapterConfig>, liveClientFactory?: any): SessionAdapter`.
   - Implementera metoden `skicka(prompt: CompiledPrompt): Promise<{ svar: string; tokensAnvanda?: number }>`.
   - Hantera felkoder och timeout kontrollerat. Om en extern `liveClientFactory` injiceras ska den användas för hermetisk testbarhet (in-memory mock vid tester).

4. `src/features/path/index.ts`:
   - Re-exportera `skapaBidiLiveAdapter`, `BidiLiveAdapterConfigSchema` och `BidiLiveAdapterConfig`.

## 3. ACCEPTANSKRITERIER (Hermetisk TDD och Gate 3a)
1. Det transienta testet `src/__tests__/transient_TCK-045.test.ts` ska instansiera `skapaBidiLiveAdapter` med en syntetisk klient-fabrik och verifiera att:
   - Adaptern skickar kompilerade prompt-delar korrekt.
   - Svar ackumuleras och returneras med `svar` och `tokensAnvanda`.
2. Testet måste fallera rött mot repots befintliga kod (Fail-First) innan källkoden skapas.
3. Efter implementation ska samtliga tester i `pnpm verify` passera gröna.

```


#### 1a Att följa: Intention & Nytta
Givet en BidiLiveAdapter är initierad med en mockad live klient-fabrik
När en CompiledPrompt skickas över Bidi Live WebSocket
Och modellen strömmar tillbaka ett svar med tokenanvändning
Så ska adaptern returnera ett strukturerat svar innehållande det ackumulerade svaret och tokenantalet.


#### 0a Att vända om: Kontraktsaudit
Status för kontraktsaudit: Godkänd. Uppdraget berör enbart FSD-domänen Path, följer rådande API-kontrakt och har en tydlig avsiktsförklaring redo för Intent Gate.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
Här är tre ortogonala alternativ för att lösa implementationen av Bidi Live WebSocket-adaptern:

Alternativ ett är en tillståndslös modell där en ny WebSocket etableras för varje enskild förfrågan, och stängs direkt efter att svaret mottagits. Detta är enklast att hantera men ger längre latens på grund av anslutningskostnader.

Alternativ två använder en persistent anslutning via en injicerad fabrik, där adaptern återanvänder samma session för flera förfrågningar och hanterar eventuella återanslutningar vid fel. Detta ger bäst prestanda för interaktiva flöden.

Det tredje alternativet bygger på en köbaserad modell där meddelanden korreleras asynkront och matchas med svar från strömmen, vilket maximerar resursutnyttjande vid hög belastning.


#### 2c Att vända om: Resiliensgranskning
Vid en resiliensgranskning framgår det att alternativ två erbjuder den bästa resiliensen för det tänkta bidi live-flödet. Genom att återanvända sessionen och hantera återanslutningar kan vi upprätthålla prestanda, samtidigt som vi minskar latens. Alternativ ett är för långsamt och alternativ tre introducerar för komplexitet i korrelationen.


#### 2d Att förlikas: Mättnad
Efter en noggrann avvägning av de föreslagna alternativen står det klart att alternativ två är det vinnande kontraktet. Genom att prioritera sessionens livslängd och hantera återanslutningar säkrar vi den bästa resiliensen och den lägsta latensen för vårt bidi live-flöde. Därmed har vi funnit den balans som krävs, och jag deklarerar MÄTTNAD: JA.


#### 3a Att följa: Testspecifikation



#### 3b Att följa: Källkod



#### 3c Att förlikas: Slutgiltigt Byggkontrakt
Filer att skapa och uppdatera för TCK-045 är: pathSchema.ts, types.ts, bidiLiveAdapter.ts, index.ts och testfilen i __tests__. Jag säkerställer att bidiLiveAdapter.ts exporterar funktionen skapaBidiLiveAdapter som implementerar SessionAdapter enligt kravspecifikationen i kontraktet.
