# BYGGCYKEL LOGG: TCK-051
**Starttid:** 2026-11-12T11:47:06.917Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-051: Skarp Mikrofonströmning, Live-transkribering och Agentstyrd A2UI-brygga

**Måldomän:** `gemini_live_swarm` (`src/features/gemini_live_swarm/`)
**Målfiler:** `src/features/gemini_live_swarm/session/liveBridgeHelper.ts`, `src/features/gemini_live_swarm/session/geminiLiveSession.ts`
**Mekanisk Acceptans:** Ett transient test bevisar (Fail-First mot körtidsankare utan `vi.fn()`-spioner) att:
1. PCM-ljud som emitteras på `SwarmEventBus` (`'swarm.live.stream.audio'`) vidarebefordras till den aktiva WebSocket-sessionens `sendRealtimeInput` med formatet `{ audio: { data, mimeType } }`.
2. När `SessionIntentManager.activateIntent('CONSULT')` eller händelsen `'swarm.live.intent.activated'` körs publiceras `'a2ui:render'` med `{ componentId: 'ListeningCard', dataModel: { intent: 'Att förlikas' } }`, och vid `'swarm.live.intent.deactivated'` publiceras `'a2ui:clear'`.
3. Verktygsanrop (`toolCall.functionCalls`) för `render_a2ui` och `clear_a2ui` i `handleAgentMessage` vidarebefordras till `SwarmEventBus` och besvaras via `sendToolResponse`.
Samtliga tester, AST-kontroller (Gate 2c), radgränser (<250 rader i `.ts`) och FSD-arkitekturkontroller passerar med exit 0.

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **Modulär brygga i `src/features/gemini_live_swarm/session/liveBridgeHelper.ts` (< 130 rader):**
   - Skriv över filen med `save_code` och exportera:
     * `A2UI_TOOL_DECLARATIONS` (`render_a2ui` och `clear_a2ui`).
     * `packBidiAudioChunk(data: string, mimeType = 'audio/pcm;rate=16000')` som returnerar `{ audio: { data, mimeType } }`.
     * `bindLiveSwarmBridge(bus: SwarmEventBus, getSession: () => any, isConnected: () => boolean, onDisconnect: () => void)` som prenumererar på `'swarm.live.stream.audio'` (läser `audioChunkBase64` eller `data`), `'swarm.live.intent.activated'` (emitterar `'a2ui:render'` med `ListeningCard`) och `'swarm.live.intent.deactivated'` (emitterar `'a2ui:clear'`).
     * `handleLiveToolCalls(functionCalls: any[], bus: SwarmEventBus, sendToolResponse: (responses: any[]) => void)` som hanterar `render_a2ui` och `clear_a2ui` och anropar `sendToolResponse([{ id, name, response: { ok: true } }])`.
     * `processLiveServerTranscripts(message: any, bus: SwarmEventBus)` som emitterar `outputTranscription?.text` och `inputTranscription?.text` som `'swarm.session.text_delta'`.
2. **Komplett uppdatering av `src/features/gemini_live_swarm/session/geminiLiveSession.ts` (< 250 rader):**
   - **Obligatorisk Gate 2c-städning:** Ersätt de två befintliga tomma `catch {}`-blocken i `disconnectLive` och `notifyListeners` med `catch (err) { console.warn('[GeminiLiveSession]', err); }` så att Gate 2c godkänner filen på första försöket.
   - **Anslutningskontroll & SDK-koppling:** Uppdatera `isLiveConnected()` till `return this.liveStatus === 'STREAMING' || this.liveStatus === 'CONNECTING' || Boolean(this.activeSdkSession);` och exponera `public attachSdkSession(sdkSession: any): void { this.activeSdkSession = sdkSession; this.liveStatus = 'STREAMING'; }`.
   - **Delegering till bryggan:** Låt `packRealtimeAudioChunk` och `subscribeToMicPiping` anropa `packBidiAudioChunk` och `bindLiveSwarmBridge`.
   - **Live-konfiguration i `connectLive`:** Lägg till `inputAudioTranscription: {}`, `outputAudioTranscription: {}` och `tools: [{ functionDeclarations: A2UI_TOOL_DECLARATIONS }]` i `makeAgentConfig`.
   - **Polymorf `handleAgentMessage`:** Gör `handleAgentMessage(channelOrMsg: SwarmAudioChannel | any, maybeMessage?: any): void` bakåtkompatibel genom `const channel = typeof channelOrMsg === 'string' ? channelOrMsg : 'forlikas'; const message = typeof channelOrMsg === 'string' ? maybeMessage : channelOrMsg;` och anropa `processLiveServerTranscripts(message, this.eventBus)` samt `handleLiveToolCalls(message.toolCall.functionCalls, this.eventBus, (r) => this.sendToolResponse(r))` när `message?.toolCall?.functionCalls` finns.
3. **Exakta signaturer i tester och FSD-isolering:**
   - Instansiera sessionen med `new GeminiLiveSession('test-api-key', eventBus)` och använd `intentManager.activateIntent('CONSULT')`.
   - Inga importer från `src/features/a2ui/` och inga tomma `catch {}`-block. Använd standard Vitest-assertions (`toBeDefined()`, `toEqual()`).

---

## Scenariotriad (Den relationella och systemiska avsikten)

**Scenario: ATT FÖLJA – Rösten bär fram till agenten och väcker det generativa gränssnittet**
  Givet att användaren aktiverar mikrofonen i chattfältet
  När PCM-ljudströmmen och intent-händelser sänds över `SwarmEventBus`
  Så ska ljudpaketen nå Gemini Live WebSocket utan att tappas bort, `ListeningCard` tändas automatiskt och agenten kunna styra A2UI-kort via `render_a2ui`
  Och användaren upplever ett levande, multimodalt samtal.

**Scenario: ATT VÄNDA OM – Avvisande av felaktiga ljudkuvert och tysta catch-block**
  Givet att Gemini Live SDK kräver `{ audio: { data, mimeType } }` och Gate 2c förbjuder tomma `catch {}`
  När `GeminiLiveSession` delegerar till `liveBridgeHelper.ts` och hanterar undantag
  Så är varje felkanal dokumenterad och källkoden slank under 250 rader
  Så att bygget och strömningen fungerar utan avbrott.

**Scenario: ATT FÖRLIKAS – En ren och modulär brygga**
  Givet att källkod och tester är skapade under `src/features/gemini_live_swarm/`
  När `pnpm verify` körs
  Så ska samtliga domäntester och FSD-arkitekturkontroller passera med exit 0.

```


#### 1a Att följa: Intention & Nytta
Jag förstår att syftet med det här uppdraget är att skapa en mycket mer levande och sömlös upplevelse i era möten med agenten. Genom att brygga mikrofonströmningen direkt till Gemini Live och låta agenten styra gränssnittet i realtid, får vi ett multimodalt och lyhört samtal. Ska vi sätta igång med planeringsfasen?


#### 0a Att vända om: Kontraktsaudit
Jag har granskat kontraktet för TCK-051 och bekräftar att alla krav på FSD-isolering, radgränser och destruktiv hälsohantering är uppfyllda. Vi är redo att gå vidare med planeringsfasen.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
De tre alternativen för lösningen är: Alternativ ett är en centraliserad brygga direkt i GeminiLiveSession där all hantering och EventBus-lyssning sker i en och samma klass. Alternativ två är en renodlad EventBus-avkoppling via en dedikerad liveBridgeHelper som agerar oberoende mellan sessionen och bussen. Alternativ tre är en proxybaserad sessionsadapter som skapar abstraktionslager för både ljudströmning och funktionsanrop.


#### 2c Att vända om: Resiliensgranskning
Alternativ ett skapar en monolitisk klass med för tätt kopplat tillstånd, vilket ökar risken för dolda fel. Alternativ tre med proxy bygger in abstraktioner som försvårar direkt felspårning. Alternativ två vinner resiliensgranskningen då den isolerar ansvarsområden via `liveBridgeHelper`, vilket ger ren felpropagering och håller källkoden inom satta gränser.


#### 2d Att förlikas: Mättnad
Medan spänningsfältet mellan de tre alternativen har belysts tydligt, står det klart att Alternativ två vinner resiliensgranskningen. Genom att isolera ansvarsområden via `liveBridgeHelper` säkerställer vi ren felpropagering och håller källkoden inom satta gränser. MÄTTNAD: JA.


#### 3a Att följa: Testspecifikation



#### 3b Att följa: Källkod



#### 3c Att förlikas: Slutgiltigt Byggkontrakt
Byggkontraktet för TCK-051 är nu spikat. Vi skapar modulen `liveBridgeHelper.ts` för bryggfunktionen och uppdaterar `geminiLiveSession.ts` med obligatorisk felhantering och direktkoppling till SwarmEventBus.
