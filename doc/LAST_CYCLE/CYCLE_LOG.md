# BYGGCYKEL LOGG: TCK-054
**Starttid:** 2026-11-13T21:07:37.049Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-054: Skarp Gemini Live SDK-fabrik i BidiLiveAdapter för Vägmotorn

**Måldomän:** `path` (`src/features/path/`)
**Målfiler:** `src/features/path/engine/bidiLiveAdapter.ts`
**Mekanisk Acceptans:** Ett transient test bevisar (Fail-First mot körtidsankare utan `vi.fn()`/`vi.spyOn()`) att standardfabriken mot `@google/genai` fungerar när `clientFactory` utelämnas, samtidigt som samtliga befintliga tester i `src/features/path/__tests__/` (`bidiLiveAdapter.test.ts`, `tck-046.test.ts`, `tck-047.test.ts`) förblir 100 % gröna och `bidiLiveAdapter.ts` hålls under 130 rader.

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **Två helt åtskilda grenar i `skapaBidiLiveAdapter` (`src/features/path/engine/bidiLiveAdapter.ts`, < 130 rader):**
   - Behåll signaturen `skapaBidiLiveAdapter(config: Partial<BidiLiveAdapterConfig> & { clientFactory?: any; sdkConstructor?: any }, explicitClientFactory?: any): SessionAdapter`.
   - **Gren A (`if (clientFactory)` — BEVARA 100 % OFÖRÄNDRAD):** När `clientFactory` finns, kör exakt befintlig polyglott klienthantering (`await client.connect()`, `client.send` / `client.sendPrompt`, `client.stream` / `client.receiveStream()`, `client.close()` i `finally`) utan att kräva `apiKey` och utan att anropa `sendClientContent`.
   - **Gren B (`else` — NY `@google/genai` SDK-FABRIK):** När `clientFactory` INTE finns:
     * Läs `const apiKey = config.apiKey !== undefined ? config.apiKey : (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined);`.
     * Om `!apiKey`, kasta `new Error('API-nyckel saknas för Gemini Live SDK')`.
     * Instansiera `const SdkClass = config.sdkConstructor || GoogleGenAI;` med `new SdkClass({ apiKey, apiVersion: 'v1alpha' })`.
     * Anslut via `const session = await ai.live.connect({ model: config.model || 'gemini-3.8-live' })`, skicka `{ turns: [{ role: 'user', parts: [{ text: content }] }], turnComplete: true }` via `session.sendClientContent`, samla text från `serverContent.modelTurn.parts` (via async-iteration över `session` eller `session.receiveStream()`) och anropa `await session.close()` i `finally`.
2. **Felpropagering & Gate 2c:**
   - Fånga fel i `try/catch`, anropa `eventBus?.emit('error', err)` och kasta alltid om felet (`throw err`). Inga tomma `catch {}`-block.

---

## Scenariotriad (Den relationella och systemiska avsikten)

**Scenario: ATT FÖLJA – Vägmotorn talar skarpt med Gemini Live SDK utan att bryta äldre portkontrakt**
  Givet att `skapaBidiLiveAdapter` konfigureras med en API-nyckel utan `clientFactory`
  När `adapter.skicka(compiledPrompt)` exekveras
  Så ansluter SDK-grenen till `v1alpha` Live API, sänder prompten och returnerar det strömmade svaret
  Samtidigt som `clientFactory`-grenen i `TCK-045`–`047` fungerar oförändrat.

**Scenario: ATT VÄNDA OM – Avvisande av tom API-nyckel och läckande sockets**
  Givet att `apiKey` saknas eller är tom sträng `''`
  När `skicka` körs utan `clientFactory`
  Så propageras `'API-nyckel saknas för Gemini Live SDK'` omedelbart utan att falla tillbaka på `.env`.

**Scenario: ATT FÖRLIKAS – Grön verifiering i hela repot**
  Givet att `bidiLiveAdapter.ts` och samtliga domäntester i `path` passerar
  När `pnpm verify` körs
  Så passerar samtliga tester och radgränskontroller med exit 0.

```


#### 1a Att följa: Intention & Nytta
Syftet med det här uppdraget är att bygga in en säker och sömlös standardfabrik i Vägmotorn. Genom att låta oss ansluta direkt via det officiella SDK:t när ingen anpassad fabrik finns, gör vi systemet mer modulärt och lättillgängligt, samtidigt som vi bevarar alla tidigare kontrakt och stabilitet. Hur låter den här planen för dig?


#### 0a Att vända om: Kontraktsaudit
Det här ser ut som en solid och tydlig plan. Kontraktsaudit är slutförd och jag kan bekräfta att modulen förblir strikt isolerad och att uppdelningen i två grenar följer våra invarianter. Handlingsutrymmet är begränsat till den specifika domänen vilket minimerar risken för följdfel i systemet.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
De tre ortogonala alternativen för att lösa TCK-054 är följande:

Alternativ 1: Användning av asynkron iteration direkt på `session.receiveStream()` för att samla in textdelar från `modelTurn.parts` under asynkron iteration.

Alternativ 2: Sekventiell läsning i en `while`-loop genom att anropa `session.receive()` och granska inkommande meddelanden efter `serverContent` tills turnComplete flaggan detekteras.

Alternativ 3: Event-baserad insamling genom att lyssna på specifika unit-events internt i sessionen för att bygga upp svaret utan att exponera eventbussen för andra domäner eller beroenden.


#### 2c Att vända om: Resiliensgranskning
Resiliensgranskningen visar att Alternativ 1, asynkron iteration direkt på receiveStream, är mest resilient. Den följer SDK:ns naturliga strömningsmönster och möjliggör direkt felpropagering i varje steg. Alternativ 2 och 3 introducerar onödig komplexitet i tillståndshanteringen, vilket ökar risken för hängande sockets vid oväntade fel.


#### 2d Att förlikas: Mättnad
Utvärderingen är fullständig. Alternativ 1 vinner vägvalet och bekräftas som vårt stabilaste kontrakt. Spänningsfältet har vägts och därmed deklareras MÄTTNAD: JA.


#### 3a Att följa: Testspecifikation



#### 3b Att följa: Källkod



#### 3c Att förlikas: Slutgiltigt Byggkontrakt
Det slutgiltiga byggkontraktet för TCK-054 fastställer att vi skapar ett nytt test, `src/features/path/__tests__/bidiLiveAdapter.test.ts`, som verifierar att standardfabriken fungerar. Vi kommer även att bevara källkoden i `src/features/path/engine/bidiLiveAdapter.ts` enligt de nya kraven, och säkerställa att alla exporter finns med i `src/features/path/index.ts`.
