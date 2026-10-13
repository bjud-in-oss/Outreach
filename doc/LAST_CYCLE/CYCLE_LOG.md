# CYCLE LOG: TCK-028

## Steg 1a
Intention & Mänsklig Nytta: Implementera en asynkron turtagningspendel (Lyssna/Prata) och semantisk överlämning för att eliminera stress och avbrott i röstinteraktionen. Agenten förblir som standard tyst i LISTEN-läge där den ackumulerar kontext och lyssnar aktivt. Övergång till TALK-läge sker kontrollerat och explicit antingen vid en fullständig och avslutad fråga (semantisk turn boundary) eller när användaren trycker på skicka-knappen [ ➔ ] (vilket sänder ett commit-event med clientMessageId). Detta ger människan full kontroll över när samtalet övergår till svar och förhindrar att agenten avbryter halvfärdiga tankar.

## Steg 0a
Kontraktsaudit: 1. Max 1 FSD-domän: src/features/gemini_live_swarm/ (session/, telemetry/, bus/, ui/). 2. API-skills: @google/genai Live API och Web Speech / VAD händelseströmmar via SwarmEventBus. 3. Saneringskrav: Destruktiv sanering av direkt, oskärmad auto-generering av röstsvar vid ofullständiga transkriptionsdeltan; sanera frånvaro av watchdog-fallback så att systemet inte kan hamna i permanent deadlock i TALK-läge om Bidi-kabeln tystnar; isolera pendel- och turn boundary-logiken i modulära, testbara filer under 125 rader per fil.

## Steg 0b
Vägval & Förlikningsport: Å ena sidan krävs låg latens vid verkliga frågor och omedelbar respons när användaren klickar [ ➔ ]; å andra sidan måste falska triggningar elimineras genom att strikt filtrera bort partiella transkript (isFinal: false) och garantera deadlock-skydd via en 8–10 sekunders watchdog. TCK-028 isoleras helt inom src/features/gemini_live_swarm/ utan korsdomänberoenden. Inga API-brott föreligger. Väg 2 (Godkänd för linjärt planeringssvep). human_decision_required: false.

## Steg 1b
Kartlägg Domän & Systemgränser: Källkodsändringar isoleras till src/features/gemini_live_swarm/: Skapa session/pendulumStore.ts för tillståndshantering (LISTEN vs TALK, SwarmEventBus-prenumeration, commit-lyssning), skapa session/turnBoundaryDetector.ts för semantisk gränsanalys (guardrail isFinal: true, frågedetektering), integrera Watchdog-timer (8s fallback till LISTEN) och audio mutex (inaktivera VAD vid TALK) i pendulumStore och audioWorker/geminiLiveSession, samt skapa transient test i src/__tests__/transient_TCK-028.test.ts.

## Steg 2a
Avgränsa Tillstånd & Biverkningar: Hantera pendelns tillstånd och biverkningar: 1. Pendeltillstånd: PendulumState ('LISTEN' | 'TALK'). Default är 'LISTEN'. 2. Partiella deltan (isFinal: false): Förblir i LISTEN, uppdaterar kontextbuffert utan att trigga switch. 3. Slutgiltigt transkript (isFinal: true): Semantisk analys avgör om texten är en avslutad fråga (t.ex. slutar med frågetecken eller frågeordsmönster); om ja -> övergång till TALK. 4. Manuell commit via [ ➔ ]: Emitterar USER_COMMIT med clientMessageId, tvingar omedelbart över pendeln till TALK. 5. Watchdog Deadlock-skydd: Vid övergång till TALK startas en 8s timer; om inget Bidi-svar eller ljud erhålls återställs pendeln till LISTEN och sänder event. 6. Audio Mutex: När pendeln är i TALK inaktiveras VAD (setVadPaused true) för att förhindra akustisk rundgång från agentens eget ljud.

## Steg 2b
Modellera Kontrakt: Definiera Zod-kontrakt och typer i telemetry/voiceFlowSchema.ts eller session/pendulumStore.ts: PendulumModeSchema = z.enum(['LISTEN', 'TALK']), TurnBoundaryEventSchema med isFinal (boolean), text (string), clientMessageId (string.optional()), timestamp (string), samt PendulumEventSchema för PENDULUM_STATE_CHANGED med mode, reason ('USER_COMMIT' | 'SEMANTIC_QUESTION' | 'WATCHDOG_TIMEOUT' | 'AGENT_COMPLETED' | 'MANUAL_RESET') och timestamp.

## Steg 2c
Utvärdera Resiliens & Felhantering: Watchdog-timern (8s) skyddar mot hängda WebSocket-anslutningar, tysta Gemini Live-sessioner och nätverksavbrott genom att garantera deterministisk återgång till LISTEN. Strikt isFinal: true guardrail eliminerar flimmer och prematura avbrott vid ofullständiga yttranden. Audio Mutex förhindrar feedback-loopar där agentens eget tal återmatas till VAD. Modulär design med max 125 rader per fil och kraschsäker Zod-validering.

## Steg 2d
Syntetisk Vägvägning & Mognadskontroll: De 4 testkraven i TCK-028 harmonierar fullt ut med befintlig arkitektur (SwarmEventBus, audioWorker, UnifiedPromptBar). Lösningen införs som rena, reaktiva enheter utan att bryta bakåtkompatibilitet eller introducera teknisk skuld. human_decision_required: false.

## Steg 3a
Transient Testspecifikation: Skapa src/__tests__/transient_TCK-028.test.ts som verifierar de 4 kärnkontrakten: Test 1: Partiella deltan (isFinal: false) lämnar pendeln kvar i LISTEN. Test 2: Slutgiltigt transkript (isFinal: true) med avslutande fråga ställer om pendeln till TALK. Test 3: Tryck på [ ➔ ] (USER_COMMIT med clientMessageId) tvingar omedelbart över pendeln till TALK. Test 4 (Watchdog): Timeout efter 8 sekunder utan Bidi-svar återställer pendeln från TALK till LISTEN. Testet exekveras deterministiskt på under 3 sekunder i Node/RAM med fejkade timers/WAL-händelser.

## Steg 3b
Exakt Källkodsspecifikation under src/features/gemini_live_swarm/: 1. session/pendulumStore.ts: Skapa PendulumStore-klass med getMode(), setMode(), subscribe(), hantering av USER_COMMIT och 8s watchdog. 2. session/turnBoundaryDetector.ts: Skapa analyzeTurnBoundary-funktion med guardrail för isFinal: true och semantisk frågedetektering. 3. session/geminiLiveSession.ts & session/audioWorker.ts: Koppla ihop Audio Mutex så att VAD pausas när pendeln är i TALK och återupptas vid LISTEN. 4. index.ts: Exportera PendulumStore och turnBoundaryDetector.

## Steg 2e
Operativt Delta (Destruktiv Sanering): 1. Sanera oskyddad direktkoppling där ofullständiga transkript kunde trigga sändning. 2. Radera avsaknaden av watchdog-skydd i samtalsflödet och ersätt med deterministisk 8s timeout. 3. Sanera avsaknad av Audio Mutex-koppling mellan agent-tal och VAD-lyssnande. 4. Behålla SwarmEventBus, UnifiedPromptBar och Sticky TurnContainer intakta.

## Steg 3c
Slutgiltigt Byggkontrakt: Samtliga steg i Fas 1 är fullbordade och HMAC-kedjan i STATE.json är intakt. Inga mänskliga frågor krävs (human_decision_required: false). Token genereras i doc/LAST_CYCLE/REQUIRED_TOKEN.txt.

