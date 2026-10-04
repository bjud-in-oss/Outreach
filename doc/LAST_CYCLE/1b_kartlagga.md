# Steg 1b: Kartlägga Beroenden & Aktiva Vektorer (TCK-022d)

## 1. Aktiva Vektorer & Skills
- **active_vectors**: `gemini_live_swarm`, `parallel_3_agent_live`, `thinking_config_schema_fix`, `bidi_multichannel_sessions`
- **active_skill**: `gemini-api`

## 2. Beroendekarta
- `src/features/gemini_live_swarm/session/geminiLiveSession.ts`:
  - `connectLive`: Parallell uppkoppling via `Promise.all` för `forlikas`, `folja`, `vanda_om`.
  - `thinkingConfig`: `{ thinkingLevel: 'high' }`.
  - `this.agentSessions`: Map med alla tre aktiva Bidi-sessioner.
- `src/features/gemini_live_swarm/session/liveAudioPlayback.ts`: DSPRingBufferMixer för spatial stereouppspelning.
- `src/features/gemini_live_swarm/session/floorController.ts`: Prioriterad golvkontroll.
- `src/__tests__/transient_TCK-022d.test.ts`: Transienta tester för TCK-022d.

## 3. Destruktiva Handlingssteg
- I `src/features/gemini_live_swarm/session/geminiLiveSession.ts`:
  - Radera `{ thinking_level: 'high', thinkingLevel: 'HIGH' }` och ersätt med `{ thinkingLevel: 'high' }`.
  - Radera singel-agent `connect`-anropet för enbart `'forlikas'` och ersätt med parallell `Promise.all`-uppkoppling för alla tre kanaler.
  - Spara och synkronisera alla tre sessioner i `this.agentSessions`.
