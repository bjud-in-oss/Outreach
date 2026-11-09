# BYGGCYKEL LOGG: TCK-041
**Starttid:** 2026-11-09T09:33:32.170Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-041: Promptkompilator och Körtidsadaptrar för Vägmotorn

## 1. MÅL
Implementera en typad, fasspecifik promptkompilator (`promptCompiler.ts`) och körtidsadapter (`runtimeAdapter.ts`) under `src/features/path/` enligt ADR-029/030. Modulen ansvarar för att deterministiskt bygga magra startankare (< 2000 tokens) och tillhandahålla en abstraktion över sessionsexekvering, så att recepten kan drivas både hermetiskt i minnestester och mot Bidi Live WebSockets.

## 2. KÄLLKODSSPECIFIKATION FÖR DOMÄNEN
Måldomän: `src/features/path/` (Max 250 rader per fil enligt SI v10.5).

1. `src/features/path/model/types.ts`:
   - Exportera gränssnitt för kompilator och adapter:
     ```typescript
     export type PathPhase = 'avsikt' | 'provning' | 'konstruktion' | 'besiktning';

     export interface PromptCompileInput {
       fas: PathPhase;
       stegId: string;
       ticketId: string;
       malDoman: string;
       uppdrag: string;
       biljettText?: string;
       kontextMinne?: Record<string, unknown>;
     }

     export interface CompiledPrompt {
       systemInstruction: string;
       userPrompt: string;
       beraknadeTokensUngefar: number;
     }

     export interface SessionAdapter {
       skicka: (prompt: CompiledPrompt) => Promise<{ svar: string; tokensAnvanda?: number }>;
     }
     ```

2. `src/features/path/engine/promptCompiler.ts`:
   - Exportera funktionen `kompileraPrompt(input: PromptCompileInput): CompiledPrompt`.
   - Skall anpassa systeminstruktion och användarprompt utifrån `fas`:
     * `avsikt`: Fokuserar på mänsklig nytta, intention och Gherkin.
     * `provning`: Kräver 3 ortogonala alternativ, resiliensgranskning och epistemisk rannsakan.
     * `konstruktion`: Fokuserar på TDD, hermetisk isolering och kvalitetsgrindar.
     * `besiktning`: Fokuserar på debriefing och lärdomar.
   - Beräknar uppskattade tokens (`Math.ceil((systemInstruction.length + userPrompt.length) / 4)`) och garanterar att den genererade prompten är mager (< 2000 tokens).

3. `src/features/path/engine/runtimeAdapter.ts`:
   - Exportera funktionen `skapaMockSessionAdapter(svarstabell?: Record<string, string>): SessionAdapter` för hermetiska tester.
   - Exportera funktionen `skapaStegExekverare(adapter: SessionAdapter, malDoman: string): (stegId: string, kontext: any) => Promise<{ success: boolean; data?: unknown }>`.
   - Om adaptern returnerar ett svar som indikerar avbrott eller kastar fel, returnerar exekveraren `{ success: false }`. Vid normalt svar returneras `{ success: true, data: res.svar }`.

4. `src/features/path/contracts/pathSchema.ts`:
   - Exportera `PromptCompileInputSchema` och `CompiledPromptSchema` för Zod-validering.

5. `src/features/path/index.ts`:
   - Exportera de nya funktionerna och typerna.

## 3. ACCEPTANSKRITERIER (Hermetisk TDD och Gate 3a)
1. Skapa transient test `src/__tests__/transient_TCK-041.test.ts`:
   - Använd rena asynkrona funktioner och instansiera `kompileraPrompt` samt `skapaStegExekverare` direkt i minnet (inga externa I/O- eller nätverksanrop).
   - Testfall 1: Verifiera att `kompileraPrompt` genererar distinkta instruktioner för faserna 'avsikt' och 'provning', samt att `beraknadeTokensUngefar` är < 2000.
   - Testfall 2: Verifiera att `skapaStegExekverare` med `skapaMockSessionAdapter` exekverar ett givet steg framgångsrikt och returnerar `{ success: true }`.
   - Testfall 3: Verifiera att `skapaStegExekverare` hanterar fel från adaptern och returnerar `{ success: false }`.
2. Hela verifieringssviten (`pnpm verify`) ska passera 100 % grön.

```


#### 1a Att följa: Intention & Nytta
Givet att en fasspecifik promptkompilator och körtidsadapter skall implementeras under 'path'-domänen, När användaren initierar processen, Så kommer systemet generera instruktioner fokuserade på mänsklig nytta och intention enligt Gherkin-modellen, samtidigt som beräknade tokens garanteras ligga under 2000.


#### 0a Att vända om: Kontraktsaudit
Kontraktsaudit för TCK-041 godkänd. Uppdraget berör enbart domänen `src/features/path` och följer avtalade gränssnitt och Zod-scheman. Jag har nu genererat `.feature`-filen och är redo för avsiktsgrinden.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
Här är tre ortogonala alternativ för lösning av TCK-041:

Alternativ 1: Statiskt mallregister. Vi fokuserar på förkompilerade strikta textmallar för varje fas och minimerar den dynamiska körningslogiken.

Alternativ 2: Fabriksbaserad funktionell komposition. Vi använder fabriksfunktioner för att dynamiskt bygga kompilatorlogiken för specifika faser så att kontexten kan injiceras.

Alternativ 3: Schemadriven konfigurationsmodell. Vi förlitar oss tungt på Zod-scheman vid varje gräns och använder en konfigurationsdriven metod för att driva adaptern.


#### 2c Att vända om: Resiliensgranskning
Resiliensgranskningen visar att Alternativ 2, fabriksbaserad funktionell komposition, är mest robust eftersom den tillåter strikt isolering och felhantering per fas, vilket förhindrar att fel sprids. Alternativ 1 riskerar stelhet, och Alternativ 3 ger stark typvalidering men saknar dynamisk flexibilitet för logiken.


#### 2d Att förlikas: Mättnad
Jag har vägt spänningsfältet mellan alternativen. Då Alternativ 2 ger bäst förutsättningar för strikt isolering och robust felhantering utan att förlora flexibilitet, låser jag det som det vinnande kontraktet. MÄTTNAD: JA.


#### 3a Att följa: Testspecifikation



#### 3b Att följa: Källkod



#### 3c Att förlikas: Slutgiltigt Byggkontrakt
Det slutgiltiga byggkontraktet fastställer att vi skapar fem nya filer i domänen `path`. Dessa är `model/types.ts`, `engine/promptCompiler.ts`, `engine/runtimeAdapter.ts`, `contracts/pathSchema.ts` och indexfilen i roten. Utöver dessa skapar vi testfilen `src/__tests__/transient_TCK-041.test.ts`. Vi låser exporten i index.ts till alla nyskapade tjänster, typer och scheman från de nämnda filerna.
