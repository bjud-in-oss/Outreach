# TCK-MAINT-055: Höj maxReconnectAttempts till 5 och lägg till slumpad jitter i bidiLiveRunner.ts

**Måldomän:** `scripts`
**Målfiler:** `scripts/bidiLiveRunner.ts`
**Mekanisk Acceptans:**
1. `private maxReconnectAttempts = 5;` är satt i `scripts/bidiLiveRunner.ts` (höjd från `3`).
2. Både `onclose`-återanslutningen (runt rad 205) och handskaknings-backoffen i `connect()` (runt rad 260) adderar `+ Math.floor(Math.random() * 1000)` ms slumpad jitter till den exponentiella backoff-fördröjningen.
3. `scripts/bidiLiveRunner.ts` hålls strikt under 345 rader (341 rader), och `pnpm verify` passerar med exit 0.

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **Tre enradiga patchar i `scripts/bidiLiveRunner.ts` (behåll 341 rader, max 345):**
   - Rad 13: ändra `private maxReconnectAttempts = 3;` till `private maxReconnectAttempts = 5;`.
   - Rad 205 (i `onclose`): ändra `const delay = Math.pow(2, this.reconnectAttempts) * 1000;` till `const delay = Math.pow(2, this.reconnectAttempts) * 1000 + Math.floor(Math.random() * 1000);`.
   - Rad 260 (i `connect` `catch`): ändra `const delay = Math.pow(2, attempt + 1) * 1000;` till `const delay = Math.pow(2, attempt + 1) * 1000 + Math.floor(Math.random() * 1000);`.
2. **Bevara övrig WebSocket-livscykel:**
   - Ändra inga signaturer, timeouts eller stängningsflöden i `scripts/bidiLiveRunner.ts`.

---

## Scenariotriad (Den relationella och systemiska avsikten)

**Scenario: ATT FÖLJA – Resiliens mot transienta WS 1011-handskakningsavbrott**
  Givet att Google Live API tillfälligt stänger en WebSocket med kod 1011 under täta byggvändor
  När `BidiLiveSession` räknar ut väntetiden inför återanslutning
  Så används upp till 5 försök med exponentiell backoff plus 0–1000 ms slumpad jitter
  Vilket förhindrar onödiga byggkrascher utan att utöka filens radantal.

**Scenario: ATT VÄNDA OM – Avvisande av deterministisk återanslutningskollision**
  Givet att fast backoff utan jitter tidigare kunde återansluta i exakt samma millisekund som serverns överlastfönster
  När jitter läggs till i både `connect` och `onclose`
  Så sprids återanslutningsförsöken naturligt i tid.

**Scenario: ATT FÖRLIKAS – Grön verifiering i hela repot**
  Givet att `scripts/bidiLiveRunner.ts` är uppdaterad
  När `pnpm verify` körs
  Så passerar kompilering, arkitekturgrindar och tester med exit 0.
