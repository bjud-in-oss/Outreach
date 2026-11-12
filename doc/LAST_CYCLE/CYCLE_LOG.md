# BYGGCYKEL LOGG: TCK-052
**Starttid:** 2026-11-12T12:30:05.351Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-052: Slutkoppla liveBridgeHelper i GeminiLiveSession (Röst-A2UI & Live-transkript)

**Måldomän:** `gemini_live_swarm` (`src/features/gemini_live_swarm/`)
**Målfiler:** `src/features/gemini_live_swarm/session/geminiLiveSession.ts`, `src/features/gemini_live_swarm/session/liveBridgeHelper.ts`
**Mekanisk Acceptans:** Ett transient test bevisar (Fail-First mot körtidsankare utan `vi.fn()`-spioner) att när enbart `new GeminiLiveSession('test-api-key', eventBus)` instansieras (utan att anropa `bindLiveSwarmBridge` manuellt i testet):
1. Händelsen `'swarm.live.intent.activated'` på `eventBus` automatiskt publicerar `'a2ui:render'` med `ListeningCard`, och `'swarm.live.intent.deactivated'` publicerar `'a2ui:clear'`.
2. `session.handleAgentMessage('forlikas', { serverContent: { outputTranscription: { text: 'Hej från rösten' } } })` emitterar `'swarm.session.text_delta'` med `text: 'Hej från rösten'`.
3. `session.handleAgentMessage('forlikas', { toolCall: { functionCalls: [{ id: 'c1', name: 'render_a2ui', args: { componentId: 'ActionPrompt', dataModel: { actionLabel: 'Kör' } } }] } })` publicerar `'a2ui:render'` och anropar `activeSdkSession.sendToolResponse`.
4. `A2UI_TOOL_DECLARATIONS` har `behavior: 'NON_BLOCKING'` på samtliga verktyg.
Samtliga tester, radgränser (<250 rader i `.ts`) och FSD-arkitekturkontroller passerar med exit 0.

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **Exekveringsordning i Fas 2 (Förhindra förtida loop-avslut):**
   - Slutför ALLA tre `apply_patch`-anrop på `src/features/gemini_live_swarm/session/geminiLiveSession.ts` FÖRST, och applicera `apply_patch` på `src/features/gemini_live_swarm/session/liveBridgeHelper.ts` SIST, så att `isFas2Complete()` håller loopen öppen tills samtliga patchar är på plats.
2. **Tre exakta patchar i `src/features/gemini_live_swarm/session/geminiLiveSession.ts` (< 250 rader):**
   - **Patch A (subscribeToMicPiping):** Byt ut prenumerationskroppen mot:
     ```ts
     bindLiveSwarmBridge(
       this.eventBus,
       () => this.activeSdkSession,
       () => this.isLiveConnected(),
       () => { this.liveStatus = 'DISCONNECTED'; this.deactivateIntent(); }
     );
     ```
   - **Patch B (handleAgentMessage):** Anropa `processLiveServerTranscripts(message, this.eventBus);` samt `if (message?.toolCall?.functionCalls?.length) { handleLiveToolCalls(message.toolCall.functionCalls, this.eventBus, (r) => this.sendToolResponse(r)); }`.
   - **Patch C (sendToolResponse):** Anropa `if (this.activeSdkSession?.sendToolResponse) { this.activeSdkSession.sendToolResponse({ functionResponses }); } else if (this.activeSdkSession?.sendRealtimeInput) { this.activeSdkSession.sendRealtimeInput({ toolResponse: { functionResponses, behavior } }); }`.
3. **Uppdatering av `src/features/gemini_live_swarm/session/liveBridgeHelper.ts` (< 130 rader):**
   - Lägg till `behavior: 'NON_BLOCKING'` på både `render_a2ui` och `clear_a2ui` i `A2UI_TOOL_DECLARATIONS`.
   - I `bindLiveSwarmBridge`: använd `const intent = (env.data as any)?.title || 'Att förlikas';` som `intent` i `ListeningCard` vid `'swarm.live.intent.activated'`.
   - I `processLiveServerTranscripts(message, bus)`: läs `const text = message?.serverContent?.outputTranscription?.text || message?.serverContent?.inputTranscription?.text || message?.outputTranscription?.text || message?.inputTranscription?.text;`.
4. **Strikt FSD-isolering:**
   - Inga importer från `src/features/a2ui/` och inga tomma `catch {}`-block.

---

## Scenariotriad (Den relationella och systemiska avsikten)

**Scenario: ATT FÖLJA – Hela röst- och gränssnittskedjan samverkar i skarpt läge**
  Givet att `GeminiLiveSession` är instansierad i appen
  När användaren aktiverar mikrofonen och talar med agenten
  Så tänds `ListeningCard` automatiskt, talade repliker skrivs ut i samtalstråden och agenten kan visa `ActionPrompt` via `render_a2ui`
  Och hela gränssnittet blir levande och multimodalt.

**Scenario: ATT VÄNDA OM – Avvisande av oanvända hjälpmoduler och blockerande verktyg**
  Givet att `liveBridgeHelper.ts` tidigare exporterade bryggfunktioner som inte anropades av `GeminiLiveSession` och saknade `NON_BLOCKING`
  När `subscribeToMicPiping`, `handleAgentMessage` och `sendToolResponse` kopplas direkt till bryggan med `NON_BLOCKING`-deklarationer
  Så verifieras integrationskedjan ände-till-ände genom `GeminiLiveSession`
  Utan att utöka filens radantal över 250 rader.

**Scenario: ATT FÖRLIKAS – Grön verifiering och ren arkitektur**
  Givet att källkod och tester är uppdaterade under `src/features/gemini_live_swarm/`
  När `pnpm verify` körs
  Så passerar samtliga tester och arkitekturkontroller med exit 0.

```


#### 1a Att följa: Intention & Nytta
Hej! Jag förstår att uppdraget handlar om att skapa en mer levande och responsiv upplevelse för användaren genom att koppla ihop röstkommunikation med A2UI-gränssnittet. Det gör att agenten kan visa visuella komponenter och transkriptioner exakt när de behövs. Låter det här som en bra tolkning av det mänskliga värdet vi vill uppnå?


#### 0a Att vända om: Kontraktsaudit
Kontraktsaudit slutförd. Arkitekturen håller sig strikt inom FSD-gränserna för `gemini_live_swarm`, med kontrollerade filstorlekar och tydliga, icke-blockerande kontraktsändringar redo för genomförande.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
Vi kan formulera tre ortogonala alternativ för denna lösning.

Först, en direkt integration där `GeminiLiveSession` anropar `liveBridgeHelper` i sina metoder. Det är enkelt, men ökar kopplingen i sessionsklassen.

Sedan, brygg-delegering via en dedicerad `LiveBridgeManager`, vilket håller `GeminiLiveSession` ren genom att samla alla event och verktyg på ett ställe.

Slutligen, en middleware-baserad pipeline för meddelandehantering där inkommande data bearbetas stegvis i en bestämd ordning.


#### 2c Att vända om: Resiliensgranskning
Av de tre alternativen är alternativet med brygg-delegering via `bindLiveSwarmBridge` det tryggaste kontraktet. Genom att hålla `GeminiLiveSession` fokuserad på nätverkskontrakt och låta `liveBridgeHelper` hantera events och transformeringar, isolerar vi felkällor och möter kravet på att inte dölja undantag i tysta catch-block.


#### 2d Att förlikas: Mättnad
Jag bekräftar att brygg-delegering via `bindLiveSwarmBridge` är det vinnande kontraktet. Vi har uppnått full mognad i vår vägning, MÄTTNAD: JA.


#### 3a Att följa: Testspecifikation



#### 3b Att följa: Källkod



#### 3c Att förlikas: Slutgiltigt Byggkontrakt
Det slutgiltiga byggkontraktet innebär att vi bevarar `GeminiLiveSession` och `liveBridgeHelper` i `gemini_live_swarm`-domänen för att integrera röststyrning och A2UI. Alla ändringar sker direkt i de befintliga modulerna utan behov av att utöka antalet filer.
