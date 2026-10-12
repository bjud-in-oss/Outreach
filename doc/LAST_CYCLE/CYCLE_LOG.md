# CYCLE LOG: TCK-027

## Steg 1a
Intention & Mänsklig Nytta: Implementera en renodlad och mobilanpassad PromptBar i tumzonen med layout bestående av en flexibel textarea överst (max 3-4 rader med overflow-y: auto) och ikonrad under ([ + ] | [ Reflektion ▾ ] | [ 🎤 ] | [ ➔ ]). Etablera strikt Audio Mutex mellan röst och STT med 150ms debounce-lock på mikrofonknappen och automatisk paus av VAD vid skrivfokus i textarean, där VAD endast återupptas om mikrofonen var unmuted innan fokuseringen (wasLiveUnmutedBeforeFocus). Bygga Sticky TurnContainers med CSS sticky top:0 för 60 FPS utan scroll-jank, fällbar Action History för verktygskörningar och filändringar, samt WAL Restore-knapp som flushar audioWorker och ljudbuffertar deterministiskt. Säkerställa proaktiv start vid WS_CONNECTED och optimistisk text-commit med deduplicering via clientMessageId.

## Steg 0a
Kontraktsaudit: 1. Max 1 FSD-domän: src/features/gemini_live_swarm/ (ui/, session/, bus/, telemetry/). 2. API-skills: @google/genai Live API och standard Web Speech och MediaStreamTrack, CloudEvents 1.0. 3. Saneringskrav: Destruktiv sanering av den gamla enradiga layouten i UnifiedPromptBar.tsx till förmån för tvåradig tumzonslayout (textarea överst, ikonrad under); sanera oskyddad mick-växling utan 150ms debounce och oskyddad VAD-återupptagning vid blur; tillse att TurnContainer implementeras med position: sticky och audioWorker.flush() integration.

## Steg 0b
Vägval & Förlikningsport: Å ena sidan ställer mobil tumzonsergonomi och avancerade interaktionstillstånd höga krav på en precis tillståndsmaskin och ren komponentuppdelning; å andra sidan måste 60 FPS garanteras via ren CSS sticky och snabb testexekvering (< 3s i RAM/Node). TCK-027 respekterar strikt FSD-isolering under src/features/gemini_live_swarm/ utan cross-domain-beroenden. Inga API-brott föreligger. Väg 2 (Godkänd för linjärt planeringssvep). human_decision_required: false.

## Steg 1b
Kartlägg Domän & Systemgränser: Källkodsändringar isoleras till src/features/gemini_live_swarm/: UI-komponenter i ui/UnifiedPromptBar.tsx, ui/promptBarHelper.ts, nya ui/TurnContainer.tsx och ui/AppShell.tsx; sessionshantering i session/audioWorker.ts och session/geminiLiveSession.ts; händelsebuss och scheman i bus/swarmEventBus.ts och telemetry/telemetrySchema.ts; transient test i src/__tests__/transient_TCK-027.test.ts.

## Steg 2a
Avgränsa Tillstånd & Biverkningar: Hantera de 5 interaktionstillstånden och 4 kärnfunktionaliteterna: 1. Live Aktiv (Unmuted): mic unmuted, Audio Mutex spärrar STT, emitterar MUTEX_TOGGLED (LIVE_ACTIVE) och UI_STATE_CHANGED (UNMUTED). 2. Tillfälligt Muted (Zoom-läge): track.enabled false, inga PCM-frames, emitterar MUTEX_TOGGLED (MUTED) och UI_STATE_CHANGED (MUTED). 3. Skrivfokus i Textarea: focus sparar wasLiveUnmutedBeforeFocus och pausar VAD temporärt, blur återupptar VAD ENDAST om wasLiveUnmutedBeforeFocus är true. 4. STT-diktering: vid fokus i textarea + klick på mick spärras Live, kopplas lokal STT, emitterar MUTEX_TOGGLED (STT_DICTATION) och swarm.session.text_delta. 5. WAL Restore: klick på Restore i TurnContainer anropar audioWorker.flush(), rensar buffertar och återställer checkpoint. 6. Proaktiv Start vid WS_CONNECTED. 7. Optimistisk Text-Commit med clientMessageId och deduplicering. 8. Reflektionsväljare uppdaterar thinkingConfig utan att störa ljudströmmen. 9. Verktygspanel och Action History fälls ut rent och TurnContainer har ren CSS position: sticky.

## Steg 2b
Modellera Kontrakt: AudioMutexStateSchema och TurnStateSchema definierar typkontrakt för interaktion: AudioMutexMode ('LIVE_ACTIVE', 'MUTED', 'STT_DICTATION', 'IDLE'), wasLiveUnmutedBeforeFocus (boolean), isTogglingMutex (boolean med 150ms spärr), clientMessageId (string), reflectionMode (ReflectionModeSchema) och actionHistoryOpen (boolean). Validerar att händelser för MUTEX_TOGGLED, UI_STATE_CHANGED och swarm.session.text_delta uppfyller kraven.

## Steg 2c
Utvärdera Resiliens & Felhantering: 150ms debounce-lås skyddar MediaStreamTrack från snabba klick och race conditions. Återaktivering av VAD skyddas strikt av wasLiveUnmutedBeforeFocus för att undvika oväntat mikrofonöppnande. WAL Restore flushar audioWorker direkt så att buffrat ljud aldrig spelas upp över återställd vy. Ren CSS position: sticky eliminerar scroll-jank och layout thrashing i webbläsaren. Modulära komponenter under 125 rader per tsx och under 250 rader per ts.

## Steg 2d
Syntetisk Vägvägning & Mognadskontroll: De 9 testkraven i TCK-027 är helt harmoniserade med domänen och tidigare implementationer. Kraven kan implementeras rent utan arkitekturskuld. human_decision_required: false.

## Steg 3a
Transient Testspecifikation: Skapa src/__tests__/transient_TCK-027.test.ts som verifierar de 9 testkontrakten: 1. Live Aktiv (MUTEX_TOGGLED LIVE_ACTIVE, mic UNMUTED). 2. Tillfälligt Muted (MUTEX_TOGGLED MUTED, track.enabled false). 3. Skrivfokus i Textarea (wasLiveUnmutedBeforeFocus sparas, blur återupptar endast om true). 4. STT-diktering (MUTEX_TOGGLED STT_DICTATION, text strömmas lokalt). 5. WAL Restore (audioWorker.flush(), rensar ljud och återställer checkpoint). 6. Proaktiv Start vid WS_CONNECTED. 7. Optimistisk Commit & Deduplicering via clientMessageId. 8. Reflektionsväljare uppdaterar thinkingConfig utan att störa aktiv ljudström. 9. Verktygspanel fälls ut och TurnContainer har position sticky. Testet exekverar på under 3 sekunder i Node/RAM.

## Steg 3b
Exakt Källkodsspecifikation under src/features/gemini_live_swarm/: 1. ui/UnifiedPromptBar.tsx: Textarea överst (max 3-4 rader, overflow-y auto), ikonrad under med [ + ], [ Reflektion ▾ ], [ 🎤 ], [ ➔ ]. Stöd för 150ms debounce-lock (isTogglingMutex) och wasLiveUnmutedBeforeFocus. 2. ui/promptBarHelper.ts: Integrera Mutex- och fokusstate, wasLiveUnmutedBeforeFocus-logik, clientMessageId-generering och telemetri-event. 3. ui/TurnContainer.tsx: Skapa TurnContainer med ren CSS position sticky top 0, Action History fällbar vy, samt Restore-knapp som anropar audioWorker.flush(). 4. session/audioWorker.ts: Implementera och exportera flush()-metod på AudioWorkerManager och audioWorker-instans. 5. session/geminiLiveSession.ts: Proaktiv start-trigger vid anslutning.

## Steg 2e
Operativt Delta (Destruktiv Sanering): 1. Radera den gamla enradiga layouten med input i UnifiedPromptBar.tsx och ersätt helt med tvåradig mobilanpassad layout (textarea överst, ikonrad under). 2. Radera direktanrop mot mikrofontoggle utan 150ms mutex-spärr. 3. Radera oskyddad VAD-återaktivering vid blur. 4. Ersätt statiska turn-block i chatten med nya Sticky TurnContainer-komponenten med position: sticky. 5. Sanera föråldrade transienta tester från tidigare cykler om de inte längre behövs.

## Steg 3c
Slutgiltigt Byggkontrakt: Samtliga steg i Fas 1 är fullbordade och HMAC-kedjan i STATE.json är intakt. human_decision_required: false. Token genereras i doc/LAST_CYCLE/REQUIRED_TOKEN.txt.

