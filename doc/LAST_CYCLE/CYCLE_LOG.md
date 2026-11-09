# BYGGCYKEL LOGG: TCK-042
**Starttid:** 2026-11-09T13:55:07.923Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-042: Fasspecifik Promptkompilator och Typlåsning (Path Domain)

## 1. MÅL
Etablera fasspecifik JIT-promptkompilering i `src/features/path/engine/promptCompiler.ts` och fullständig typlåsning via Zod (`z.infer`) i `src/features/path/contracts/pathSchema.ts` enligt ADR-029/030. Kompilatorn ska deterministiskt generera distinkta, fokuserade instruktioner för Fas 0–3 utan monolitiska textmassor och utan blockerande token-hinder.

## 2. KÄLLKODSSPECIFIKATION FÖR DOMÄNEN
Måldomän: `src/features/path/` (Max 250 rader per logikfil enligt SI v10.5).

1. `src/features/path/contracts/pathSchema.ts`:
   - Deklarera och exportera Zod-scheman:
     * `PathPhaseSchema`: `z.enum(['avsikt', 'provning', 'konstruktion', 'besiktning'])`
     * `PromptCompileInputSchema`: `z.object({ fas: PathPhaseSchema, stegId: z.string(), ticketId: z.string(), malDoman: z.string(), uppdrag: z.string(), biljettText: z.string().optional(), kontextMinne: z.record(z.unknown()).optional() })`
     * `CompiledPromptSchema`: `z.object({ systemInstruction: z.string(), userPrompt: z.string(), beraknadeTokensUngefar: z.number() })`
   - Härled och exportera typerna med `z.infer`:
     * `export type PathPhase = z.infer<typeof PathPhaseSchema>;`
     * `export type PromptCompileInput = z.infer<typeof PromptCompileInputSchema>;`
     * `export type CompiledPrompt = z.infer<typeof CompiledPromptSchema>;`

2. `src/features/path/model/types.ts`:
   - Säkerställ att typerna `PathPhase`, `PromptCompileInput` och `CompiledPrompt` är synkade mot kontrakten i `pathSchema.ts` så att inga duplicerade eller motstridiga definitioner skapas.

3. `src/features/path/engine/promptCompiler.ts`:
   - Implementera fasspecifika instruktionsbyggare för Fas 0–3:
     * `avsikt` (Fas 0): Fokuserar på mänsklig avsikt, intention och att formulera korta Gherkin-scenarier.
     * `provning` (Fas 1): Fokuserar på 3 ortogonala alternativ (reverse-direction), resiliensgranskning (check-alignment) och epistemisk rannsakan.
     * `konstruktion` (Fas 2): Fokuserar på TDD-loop, isolerad kodmodifiering och kvalitetsgrindar.
     * `besiktning` (Fas 3): Fokuserar på reflekterande debriefing, programutvärdering och processlärdomar.
   - `beraknadeTokensUngefar` ska beräknas och returneras som passiv telemetri (inga undantag kastas och inga hårda tak appliceras).

4. `src/features/path/index.ts`:
   - Re-exportera de nya schemana och härledda typerna.

## 3. ACCEPTANSKRITERIER (Hermetisk TDD och Gate 3a)
1. Skapa transient test `src/__tests__/transient_TCK-042.test.ts`:
   - Testfall 1: Verifiera att `kompileraPrompt` genererar distinkta, fasspecifika systeminstruktioner för samtliga fyra faser ('avsikt', 'provning', 'konstruktion', 'besiktning').
   - Testfall 2: Verifiera att `PromptCompileInputSchema` och `CompiledPromptSchema` validerar korrekta dataobjekt och avvisar ogiltiga faser.
   - Testfall 3: Verifiera att `beraknadeTokensUngefar` beräknas deterministiskt utan att kasta blockerande fel.
2. Hela verifieringssviten (`pnpm verify`) ska passera 100 % grön.

```


#### 1a Att följa: Intention & Nytta
Givet en begäran om att etablera fasspecifik JIT-promptkompilering och typlåsning i Path-domänen,
När kompilatorn genererar instruktioner för Fas 0 till 3,
Så ska systemet deterministiskt producera distinkta och fasspecifika instruktioner som uppfyller alla Zod-kontrakt för typlåsning.


#### 0a Att vända om: Kontraktsaudit
Kontraktsaudit genomförd. TCK-042 berör enbart FSD-domänen path. Alla Zod-scheman och typer följer föreskrivna krav och gränser. Byggkontraktet är nu fastställt.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
För TCK-042 formulerar vi följande tre ortogonala alternativ för lösning:

Alternativ 1 är direkt implementation med en centraliserad switch-case-struktur i `promptCompiler.ts`. Det är enkelt, förutsägbart och har låg kognitiv komplexitet, vilket gör det lätt att underhålla inom radgränserna.

Alternativ 2 är mönstret för strategidelegering. Vi skapar separata strategiklasser eller fabriker för varje fas. Detta ökar modulariteten och isolerar instruktionslogiken helt, vilket är fördelaktigt för framtida extensioner av nya faser.

Alternativ 3 är en rent funktionell avbildning. Vi mappar fasnamn mot rena kompositet-mallar via en statisk tabell eller ett objekt, vilket håller koden mycket deklarativ och underlättar mätning av tokens genom att undvika komplex tillståndshantering.


#### 2c Att vända om: Resiliensgranskning
Efter resiliensgranskning av de tre alternativen ser vi att Alternativ 3 med funktionell avbildning ger högst resiliens. Den frikopplar tillstånd från data, minskar risken för sidobiverkningar vid felhantering, och tillåter deterministisk tokenberäkning utan dolda exekveringsstigar. Kontraktet är därmed låst för Fas 1.


#### 2d Att förlikas: Mättnad
Jag bekräftar härmed att Alternativ 3, med sin funktionella avbildning och separation av tillstånd, har valts som det vinnande kontraktet. Spänningsfältet är därmed upplöst och kursen är satt. MÄTTNAD: JA.


#### 3a Att följa: Testspecifikation



#### 3b Att följa: Källkod



#### 3c Att förlikas: Slutgiltigt Byggkontrakt
Det slutgiltiga byggkontraktet fastställer följande filer att skapa, uppdatera och bevara: `src/features/path/contracts/pathSchema.ts` för Zod-scheman och typlåsning, `src/features/path/model/types.ts` för typdefinitioner, `src/features/path/engine/promptCompiler.ts` för fasspecifik promptkompilering, `src/features/path/index.ts` för re-export, samt testfilen `src/__tests__/transient_TCK-042.test.ts` för verifiering.
