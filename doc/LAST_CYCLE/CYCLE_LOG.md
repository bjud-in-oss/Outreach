# CYCLE LOG: TCK-026

## Steg 1a
Intention & UX-Sanering: Åtgärda tystnaden vid sidladdning genom att tillämpa passivt startläge där mikrofonbehörighet och Gemini Live WebSocket-anslutning kräver explicit User Gesture (klick på Live-knappen). Smalna av mittdelaren till en ultra-tunn linje (< 4px, 3px) utan mekaniska pilknappar. Ersätta den 4-knappars reflektionslisten i botten med en kompakt Dropdown ([ Reflektion: Normal ∨ ]) integrerad i en enhetlig prompt-bar. Separera STT-diktering (mikrofon-ikon för textinmatning utan WebSocket) från realtids Live-Agent (Live-knapp).

## Steg 0a
Kontraktsaudit: 1. Max 1 FSD-domän: src/features/gemini_live_swarm/ (ui/ och session/). 2. API-skills: @google/genai Live API och standard Web Speech / MediaStreams. 3. Saneringskrav: Destruktiv sanering av de mekaniska pilknapparna på SplitPaneCanvas-delaren och borttagning av den horisontella 4-knappars ReflectionModeSelector-listen från footern till förmån för en integrerad dropdown i prompt-baren.

## Steg 0b
Vägval & Förlikningsport: Att kräva explicit User Gesture förhindrar webbläsarblockering av AudioContext och onödiga WebSocket-anslutningar. Den ultra-tunna delaren (< 4px) renodlar vyerna och den enhetliga prompt-baren maximerar arbetsytan. Kontrakten hålls fullständigt inom 1 FSD-domän. Väg 2 (Godkänd för linjärt svep).

## Steg 1b
Kartlägg Domän & Systemgränser: Källkodsändringar isolerade till src/features/gemini_live_swarm/ui/ (SplitPaneCanvas.tsx, AppShell.tsx, splitPaneHelper.ts, ReflectionModeSelector.tsx) och session/ (geminiLiveSession.ts). BDD-låsning i doc/features/unified_chat_input.feature och src/__tests__/bdd/unified_chat_input.test.ts. Telemetri och SwarmContext synkroniseras via SwarmEventBus.

## Steg 2a
Avgränsa Tillstånd & Biverkningar: Starttillstånd är strikt PASSIVT (isLiveConnected=false, AudioContext suspended/stängd, ingen mikrofonaktivitet). Klick på Live-knapp triggar User Gesture som anropar getUserMedia, resume AudioContext och initierar WebSocket. Dropdown styr ReflectionMode (normal, mikro, makro, meta) via SwarmContext utan att koppla från. STT-knapp dikterar text till meddelandefältet utan att öppna Live WebSocket.

## Steg 2b
Modellera Zod-kontrakt: UnifiedChatInputStateSchema definierar lägen (isLiveActive: boolean, isListeningSTT: boolean, reflectionMode: ReflectionModeSchema, inputText: string). Verifierar typ- och tillståndskontrakt.

## Steg 2c
Utvärdera Resiliens & Felhantering: Fail-Fast vid avvisad mikrofonbehörighet med mjuk felindikering i SymbolCrown. Ren hantering av klick under pågående session (Start/Paus växlar läge deterministiskt utan att krascha). Strikt efterlevnad av AST-mått (< 250 rader per .ts, < 125 rader per .tsx, indenteringsdjup <= 4, förgreningar <= 5 i .tsx, noll produktionsmockar).

## Steg 2d
Syntetisk Vägvägning & Mognadskontroll: Kraven i TCK-026 är fullt harmoniserade med SI v10.2 och BDD-specifikationen i unified_chat_input.feature. Ingen mänsklig fråga krävs för vägvalet. human_decision_required: false.

## Steg 3a
Transient & BDD Testspecifikation: 1. doc/features/unified_chat_input.feature definierar 5 BDD-scenarier: Passiv laddning, Live-knapp User Gesture, Reflektionsdropdown, STT-diktering och Tunn mittdelare (< 4px). 2. src/__tests__/bdd/unified_chat_input.test.ts exekverar scenarierna programmatiskt. 3. src/__tests__/transient_TCK-026.test.ts verifierar delarens dimensioner (< 4px, noll pilar), prompt-bar integration och passiv sessionsstart.

## Steg 3b
Exakt Källkodsspecifikation under src/features/gemini_live_swarm/: 1. ui/SplitPaneCanvas.tsx: Minska delarens bredd till 3px (w-[3px] i landscape, h-[3px] i portrait), radera alla pilknappar och behåll endast drag-avgränsaren. 2. ui/AppShell.tsx: Bygg en enhetlig prompt-bar med reflektionsdropdown, STT-knapp, Live-knapp och textinmatning. 3. ui/splitPaneHelper.ts: Uppdatera getDividerContainerClass till ultratunn styling utan knappar. 4. session/geminiLiveSession.ts: Tillhandahåll explicit start()/stop() och säkerställ passiv standardstatus vid konstruktion.

## Steg 2e
Operativt Delta (Destruktiv Sanering): 1. Radera mekaniska pil-knappar på delaren i SplitPaneCanvas.tsx (snap-toggle-button och relaterad pil-rendering). 2. Radera fristående 4-knappars reflektionslist från footern i AppShell.tsx och ersätt med dropdown. 3. Radera automatisk start/mikrofonöppning vid sidladdning.

## Steg 3c
Slutgiltigt Byggkontrakt: Samtliga steg i Fas 1 är fullbordade och HMAC-kedjan är intakt. human_decision_required: false. Byggtoken genereras i doc/LAST_CYCLE/REQUIRED_TOKEN.txt.

