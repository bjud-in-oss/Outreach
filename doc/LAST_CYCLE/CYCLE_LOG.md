# BYGGCYKEL LOGG: TCK-061
**Starttid:** 2026-11-13T23:38:35.787Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-061: Stöd för verktygsanrop (toolCall / sendToolResponse) i Vägmotorns BidiLiveAdapter

**Måldomän:** `path` (`src/features/path/`)
**Målfiler:** `src/features/path/contracts/pathSchema.ts`, `src/features/path/engine/bidiLiveAdapter.ts`
**Mekanisk Acceptans:** Ett hermetiskt Vitest-test (förankrat i minnet mot injicerade körtidsankare och tillståndsvariabler utan `vi.fn()`/`vi.spyOn()`) bevisar att:
1. `BidiLiveAdapterConfigSchema` i `src/features/path/contracts/pathSchema.ts` (< 145 rader) accepterar valfria `tools: z.array(z.any()).optional()` och `executeTool: z.custom<Function>().optional()` med `BidiLiveAdapterConfig` härledd via `z.infer`.
2. När `skapaBidiLiveAdapter({ apiKey: 'test-key', tools, executeTool, sdkConstructor })` körs och `session.receiveStream()` emitterar ett `toolCall`-meddelande (`{ toolCall: { functionCalls: [{ id: 'call-1', name: 'save_code', args: { file_path: 'a.ts', code: 'export const x = 1;' } }] } }`) följt av ett textdeltagande (`{ serverContent: { modelTurn: { parts: [{ text: 'Klart!' }] } } }`), exekveras `executeTool('save_code', ...)`, svaret skickas tillbaka via `session.sendToolResponse({ functionResponses: [{ id: 'call-1', name: 'save_code', response: { result: ... } }] })`, och `skicka()` returnerar `{ svar: 'Klart!', tokensAnvanda }`.
3. Om `executeTool` kastar ett fel fångas det och returneras som `{ error: ... }` i `functionResponses` via `session.sendToolResponse` så att modellen kan självrätta i samma session utan att strömmen kraschar.
4. Alla befintliga tester i `src/features/path/__tests__/` förblir 100 % gröna och alla filer hålls strikt under 250 rader.

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **Zod SSOT i `src/features/path/contracts/pathSchema.ts` (< 145 rader):**
   - Lägg till `tools: z.array(z.any()).optional(), executeTool: z.custom<Function>().optional(),` i `BidiLiveAdapterConfigSchema`. Duplicera aldrig manuellt i `model/types.ts`.
2. **Verktygshantering i `src/features/path/engine/bidiLiveAdapter.ts` (< 195 rader):**
   - Bevara `if (clientFactory)` och exponentiell backoff + jitter helt intakta.
   - I SDK-vägen: skicka `config: config.tools ? { tools: config.tools } : undefined` till `ai.live.connect({ model, ... })` om `config.tools` finns.
   - Inuti `for await (const message of session.receiveStream())`: kontrollera om `message.toolCall?.functionCalls` är en icke-tom array. Kör varje anrop mot `config.executeTool` (fånga fel i `try/catch` och returnera `{ error: err.message }`), och anropa `await session.sendToolResponse({ functionResponses })` innan loopen läser nästa strömmeddelande.
3. **Strikt Gate 3a-disciplin i testet:**
   - Importera ALDRIG `vi` från `vitest` och ALDRIG från `gemini_live_swarm`. Använd vanliga tillståndsvariabler och lokala minnesklasser (`class MockSdk`).

---

## Scenariotriad (Den relationella och systemiska avsikten)

**Scenario: ATT FÖLJA – Vägmotorn exekverar verktygsanrop autonomt i samma Live-session**
  Givet att Vägmotorns `BidiLiveAdapter` konfigureras med `tools` och `executeTool` (t.ex. VFS-verktyg i webbläsaren)
  När Gemini Live sänder ett `toolCall` i strömmen
  Så kör adaptern verktyget, skickar tillbaka `functionResponses` via `sendToolResponse` och levererar det avslutande svaret.

**Scenario: ATT VÄNDA OM – Verktygsfel returneras strukturerat till modellen**
  Givet att `executeTool` kastar ett fel (t.ex. `SEARCH_BLOCK_NOT_FOUND`)
  När felet fångas i `toolCall`-hanteraren
  Så skickas felmeddelandet tillbaka i `sendToolResponse` så att modellen kan rätta sig i nästa vända.

**Scenario: ATT FÖRLIKAS – Grön verifiering i hela repot**
  Givet att `pathSchema.ts`, `bidiLiveAdapter.ts` och samtliga tester är uppdaterade
  När `pnpm verify` körs
  Så passerar alla grindar och tester med exit 0.

```


#### 1a Att följa: Intention & Nytta
Det här uppdraget handlar om att ge Vägmotorn förmågan att hantera verktygsanrop direkt i samma Live-session. Det är ett viktigt steg för att öka systemets autonomi och resiliens, eftersom det gör att modellen kan rätta sig själv och utföra komplexa uppgifter smidigare utan att strömmen kraschar. Vi bygger alltså in en säkrare process för mänsklig nytta genom hållbar kod.


#### 0a Att vända om: Kontraktsaudit
Jag startar med att läsa in `BidiLiveAdapterConfigSchema` i `pathSchema.ts` och granskar bidiLiveAdapter.ts för att validera att alla villkor för kontraktet, radlängder och verktygshantering är uppfyllda.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
För att lösa TCK-061 och implementera stöd för verktygsanrop i Vägmotorns BidiLiveAdapter, formulerar jag tre ortogonala alternativ.

Alternativ ett innebär att vi exekverar verktygsanrop och skickar svar inline inuti huvudloopen i `receiveStream`. Det ger en rak och enkel kontrollflyt.

Alternativ två innebär att vi separerar logik för verktygshantering till en fristående funktion eller intern dispatcher utanför den huvudsakliga strömloopen.

Alternativ tre innebär att vi skapar ett interceptor-mönster som hanterar strömmens meddelanden och proaktivt svarar på verktygsanrop innan de når konsumenten.


#### 2c Att vända om: Resiliensgranskning
Alternativ ett är mest sårbart vid nätverksfel, då den komplexa felhanteringen kan blockera strömmens huvudsakliga kontrollflöde. Alternativ två ger god isolering och robusthet, eftersom fel i verktygshanteringen hålls separerade och minimerar risken för krascher. Alternativ tre är högt frikopplat, men riskerar att dölja logiken och försvåra övervakningen. Vi väljer därför alternativ två för att säkra ett stabilt och felsäkert system.


#### 2d Att förlikas: Mättnad
Vi har vägt spänningsfältet mellan alternativen, och det semantiska deltat är tydligt. Vi slår fast att alternativ två är det vinnande valet för att säkra stabilitet och resiliens. MÄTTNAD: JA.


#### 3a Att följa: Testspecifikation



#### 3b Att följa: Källkod



#### 3c Att förlikas: Slutgiltigt Byggkontrakt
Vi kristalliserar nu byggkontraktet för TCK-061. Vi kommer att uppdatera `pathSchema.ts` för att hantera verktygskonfigurationen och `bidiLiveAdapter.ts` för att sömlöst utföra verktygsanrop och skicka svar tillbaka i samma session. Det säkerställer en robust tvåvägskommunikation och möjliggör självrättning för modellen.
