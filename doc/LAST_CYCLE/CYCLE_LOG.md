# BYGGCYKEL LOGG: TCK-MAINT-055
**Starttid:** 2026-11-13T21:18:21.844Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
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

```


#### 1a Att följa: Intention & Nytta
Det här låter verkligen som en viktig förbättring för att göra våra byggvändor mer stabila. Genom att höja antalet återanslutningsförsök och sprida ut dem med lite slumpmässig fördröjning, undviker vi att systemet kraschar i onödan. Visst är det den resiliensen vi vill uppnå?


#### 0a Att vända om: Kontraktsaudit
Kontraktet är granskat och godkänt. Vi håller oss strikt till de tre enradiga patcharna och maximerar resiliensen med jitter utan att påverka livscykeln i övrigt. STATUS: GODKÄND.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
Här är de tre ortogonala alternativen för att lösa uppdraget i bidiLiveRunner.ts:

Alternativ 1: Direkt inline-patching. Vi applicerar de exakta tre enradiga ändringarna direkt i onclose och connect, vilket minimerar risken för att påverka filens struktur eller överskrida radgränserna.

Alternativ 2: Extraherad backoff-hjälper. Vi skapar en privat metod för beräkning av backoff och jitter för att minska duplikationen mellan onclose och connect. Detta ger renare kod men kräver noggrann hantering av radantalet.

Alternativ 3: Konfigurationsdriven styrning. Vi bryter ut maxReconnectAttempts till en definierad konstant för att samla alla parametrar på ett ställe. Förändringen i backoff-logiken sker fortfarande via inline-matematik.


#### 2c Att vända om: Resiliensgranskning
Alternativ 1 ger högst resiliens mot nya körtidsfel genom minsta möjliga kodförändring, vilket skyddar befintlig WebSocket-logik från oavsiktliga sidobiverkningar.


#### 2d Att förlikas: Mättnad
Det vinnande alternativet är fastställt till Alternativ 1, då det ger högst resiliens genom minsta möjliga ingrepp. Spänningsfältet är upplöst och mognadskontrollen godkänd. MÄTTNAD: JA.
