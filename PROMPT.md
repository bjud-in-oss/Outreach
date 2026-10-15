AKTIVT UPPDRAG: TCK-031
Titel: Tursfär & Negativ Telemetrifiltrering (Härdning mot Interna Eventbussläckor)
Domän: src/features/gemini_live_swarm/
Active Skills: gemini-live-api-dev, decomposing-tickets

Mål för TCK-031:
1. Härdning av `extractTurnEventData` i `src/features/gemini_live_swarm/ui/turnContainerHelper.ts`:
   - Filtrera bort alla interna kontrollhändelser och klockor (`WATCHDOG_TIMEOUT`, `USER_COMMIT`, `PENDULUM_STATE_CHANGED`, `UI_STATE_CHANGED`, `SWARM_TRANSCRIPT_MATCH`).
   - Extrahera enbart genuint talade yttranden och faktiska användarmeddelanden så att systemkoder inte läcker in i användarens pratbubbla.
2. Frigörande av Audio-Mutex och Pendel:
   - Säkerställ att PendulumStore inte låser sig i evigt TALK-läge vid interna händelser, så att mikrofonen och VAD förblir öppna för tal.
3. Negativ WAL Replay E2E-verifiering (90 % regeln):
   - Skapa `src/__tests__/transient_TCK-031.test.ts`.
   - Testa med en negativ EventBus-ström innehållande WATCHDOG_TIMEOUT och USER_COMMIT, och bevisa att tursfären förblir 100 % ren från systembrus.
4. Destruktiva handlingssteg:
   - Ersätt den permissiva regex/fallback-logiken i `extractTurnEventData`.
   - Genomför obligatorisk Barrel Audit av `src/features/gemini_live_swarm/index.ts`.