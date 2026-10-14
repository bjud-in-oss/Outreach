# TCK-030a: Runtime Injackning & Bidi Cable TurnComplete

## 🎯 Intention (Linjering med AGENTS.md)
Väcka liv i systemets tålamod (PendulumStore) och diagnostikminne (WalUiTelemetryListener) i den levande appen. Knyta samman pendelns TALK-övergång direkt med Gemini Live Sessions `sendTurnComplete()` för att eliminera starttystnad och säkerställa att modellen börjar tala när människan lämnar över ordet.

## 📐 Kravspecifikation & Ingrepp (FSD: gemini_live_swarm)

1. Injackning i SwarmContext (`src/features/gemini_live_swarm/context/SwarmContext.tsx`):
   - Instansiera och håll `PendulumStore` och `WalUiTelemetryListener` i appens levande körtid.
   - Exponera instanserna via `SwarmCoreContextValue` så att komponenter kan nå dem.
   - Koppla upp lyssnarna mot `busRef.current` och städa upp (`dispose`) vid unmount.

2. Livslinjen i Gemini Live Session (`src/features/gemini_live_swarm/session/geminiLiveSession.ts`):
   - Prenumerera på `PENDULUM_STATE_CHANGED` på `this.eventBus`.
   - När `data.mode === 'TALK'` och `data.reason` är `USER_COMMIT` eller `SEMANTIC_QUESTION`:
     Exekvera omedelbart `this.sendTurnComplete()`.
   - Säkerställ att eventuell aktiv röstspärr släpps så att agenten tillåts tala.

## 🧪 Verifiering (Försoningsdriven 90% WAL Replay)

`pnpm verify` kör BDD-scenarier i `src/__tests__/transient_TCK-030a.test.ts`:
- **Scenario 1: Runtime-injackning och Telemetri:**
  - *Given:* SwarmProvider initialiseras med aktiv EventBus.
  - *When:* Händelserna `UI_STATE_CHANGED` och `MUTEX_TOGGLED` emitteras.
  - *Then:* Bekräfta att `WalUiTelemetryListener` fångar och lagrar posterna i sin ringbuffert.
- **Scenario 2: Vaket Svar på Överlämning (TurnComplete över Bidi):**
  - *Given:* En GeminiLiveSession och en PendulumStore är kopplade till samma EventBus.
  - *When:* Ett `USER_COMMIT`-event (klick på [ ➔ ]) eller en semantisk fråga triggar pendeln till `TALK`.
  - *Then:* Bekräfta att `geminiLiveSession.sendTurnComplete()` anropas inom < 50 ms och skickar `{ realtimeInput: { turnComplete: true } }`.