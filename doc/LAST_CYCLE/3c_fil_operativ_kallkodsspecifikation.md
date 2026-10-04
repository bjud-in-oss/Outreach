# Steg 3c: Filoperativ Källkodsspecifikation (TCK-022d)

## 1. GROW Specifikation
- **Goal (Mål)**: Åtgärda Bidi WebSocket Handshake-felet genom att sanera `thinkingConfig` till strikt `{ thinkingLevel: 'high' }` samt ansluta alla tre försoningskrafter (`forlikas`, `folja`, `vanda_om`) parallellt via `Promise.all` så att hela stereosvärmen är vaken och redo för samtidig interaktion.
- **Reality (Nuläge)**: `geminiLiveSession.ts` kopplar enbart upp primärkanalen `'forlikas'` vid `connectLive` och använder en `thinkingConfig` med redundant mix av `thinking_level` och `thinkingLevel`, vilket orsakar handshake-fel i vissa miljöer och lämnar de övriga två agenterna okopplade.
- **Options (Alternativ)**: Sekventiell anslutning vs parallell `Promise.all`. Parallell uppkoppling är snabbare, minimerar fördröjning och garanterar att alla tre stereokanaler är synkroniserade vid start.
- **Will (Plan & Åtagande)**: Ersätta den enkla anslutningen i `geminiLiveSession.ts` med en parallell 3-agent `Promise.all`-uppkoppling, sätta `{ thinkingLevel: 'high' }`, spara sessionerna i `this.agentSessions` och verifiera via `src/__tests__/transient_TCK-022d.test.ts`.

## 2. Operativt Delta (Bevara vs Sanera)
- **Bevara**:
  - `DSPRingBufferMixer` och kanalerna `folja: -0.4`, `forlikas: 0.0`, `vanda_om: 0.4`.
  - `FloorController` för preemptive golvkontroll.
  - Metoder för `handleAgentMessage`, `sendRealtimeAudio` och `sendRealtimeText`.
- **Sanera / Ersätta**:
  - Ersätt `{ thinking_level: 'high', thinkingLevel: 'HIGH' }` med `{ thinkingLevel: 'high' }`.
  - Ersätt den singulära `live.connect` för endast `'forlikas'` med parallell `Promise.all` för de 3 krafterna.

## 3. Zod- och Typkontrakt
Befintliga kontrakt i `telemetrySchema.ts` och `floorController.ts` bibehålls.

## 4. Testkriterier (Transient Mikro-E2E)
- `src/__tests__/transient_TCK-022d.test.ts`:
  1. Verifiera att `connectLive` skapar och sparar sessioner för alla 3 kanaler (`forlikas`, `folja`, `vanda_om`) i `agentSessions`.
  2. Verifiera att `thinkingConfig` i `makeAgentConfig` skapas med `{ thinkingLevel: 'high' }`.
  3. Verifiera att meddelanden från varje kanal routas till korrekt ljudkanal i DSP-mixern.
  4. AST-kontroll: radantal <= 250 rader och noll produktionsmockar.
