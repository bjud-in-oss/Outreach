AKTIVT UPPDRAG: TCK-032
Titel: Dubbelinmatningssanering, Live-Textlyssnare & Intent-Harmonisering
Domän: src/features/gemini_live_swarm/
Active Skills: gemini-live-api-dev, decomposing-tickets

INSTRUKTION FÖR HELAUTOMATISKT GENOMFÖRANDE (v10.3):
Du är Byggmotorn. Genomför hela denna biljett autonomt från början till slut utan att begära manuella steg från användaren.

ARBETSGÅNG:
1. Fas 1 (Planering):
   - Formulera en fullständig och substantiell arkitekturanalys för samtliga 12 delsteg (1a, 0a, 0b, 1b, 2a, 2b, 2c, 2d, 3a, 3b, 2e, 3c) direkt i `doc/LAST_CYCLE/CYCLE_LOG.md`.
   - Varje steg ska innehålla minst 40 tecken genuin analys (inga boilerplate- eller dummyfraser).
2. Tillståndsupplåsning:
   - Kör `node scripts/run-bygg.js TCK-032`.
   - Skriptet validerar din planering i CYCLE_LOG.md, genererar REQUIRED_TOKEN och låser upp Fas 2 under src/.
3. Fas 2 (TDD Fail First):
   - Skapa `src/__tests__/transient_TCK-032.test.ts` med scenarier för målen nedan.
   - Exekvera testet och bevisa att det fallerar rött (Fail First) innan du rör produktionskoden.
4. Källkodsimplementation:
   - Implementera källkoden under `src/features/gemini_live_swarm/` tills testet passerar grönt.
5. Slutverifiering & Leverans:
   - Kör `npm run verify` och `npm test` (alla tester måste vara gröna).
   - Registrera godkännandet i `doc/TICKETS.md` och ta bort filen under `doc/.TICKETS/`.
   - Committa alla ändringar och pusha grenen till origin.

---

MÅL FÖR TCK-032:
1. Avdubblering av användarinmatning & Idempotens:
   - I `src/features/gemini_live_swarm/ui/promptBarHelper.ts`: Sanera `handleSend` så att användartexten inte emitteras dubbelt över bussen. Avlägsna det redundanta `swarm.session.text_delta`-anropet och låt `sendRealtimeText` (som sänder `swarm.live.stream.text`) vara den enda auktoritativa källan för utgående användartext.
   - I `src/features/gemini_live_swarm/ui/turnContainerHelper.ts`: Säkerställ att `appendStreamChunkToTurns` hanterar idempotens så att samma `clientMessageId` inte konkateneras till sig själv om dubbla händelser skulle inträffa.

2. Skriven textrespons från Gemini Live (`part.text`):
   - I `src/features/gemini_live_swarm/session/geminiLiveSession.ts`: Utöka `handleAgentMessage` så att den inte enbart söker efter `part.inlineData?.data` (ljudchunkiar), utan även extraherar `part.text`.
   - När `part.text` tas emot ska en händelse emitteras till tursfären som `swarm.session.text_delta` med `sourceRole: 'assistant'` och `agentRole: 'Att förlikas'`, så att agentens svar faktiskt renderas i pratbubblan vid skriven chatt.

3. Harmonisering av Mikrofon-Intent ('CONSULT'):
   - I `src/features/gemini_live_swarm/ui/promptBarHelper.ts`: Korrigera `handleMicToggle` så att den anropar `activateIntent('CONSULT')` i stället för den ogiltiga strängen `'forlikas'`.
   - Säkerställ att intent-aktiveringen matchar `SwarmIntent`-kontraktet (`CONSULT` | `REFLECT` | `REMEMBER`) och att mikrofonens ljudström öppnas deterministiskt utan typfel.

4. Destruktiva handlingssteg:
   - Ersätt dubbelemittringen i `promptBarHelper.ts`.
   - Genomför obligatorisk Barrel Audit av `src/features/gemini_live_swarm/index.ts`.