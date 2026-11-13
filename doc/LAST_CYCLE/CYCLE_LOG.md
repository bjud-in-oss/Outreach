# BYGGCYKEL LOGG: TCK-MAINT-056
**Starttid:** 2026-11-13T22:00:26.522Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-MAINT-056: Exempelskördning av envelope.legacy.ts till src/shared/__tests__/envelope.test.ts (ADR-030)

**Måldomän:** `scripts`
**Målfiler:** `src/shared/__tests__/envelope.test.ts`
**Skördad Legacy:** `src/__tests__/envelope.legacy.ts`
**Mekanisk Acceptans:**
1. `src/shared/__tests__/envelope.test.ts` (< 70 rader) verifierar samtliga 3 scenarier från `src/__tests__/envelope.legacy.ts` mot `EventEnvelopeSchema` i `src/shared/contracts/envelope.ts`.
2. `src/__tests__/envelope.legacy.ts` raderas och `pnpm verify` passerar med exit 0.

---

## Destruktiva Handlingssteg (ADR-030 § 3 Exempelskördning)
- **Radera `src/__tests__/envelope.legacy.ts`:** När `src/shared/__tests__/envelope.test.ts` är skapad och verifierad, ta bort `src/__tests__/envelope.legacy.ts`.

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **Skapa `src/shared/__tests__/envelope.test.ts` (< 70 rader):**
   - Läs `src/__tests__/envelope.legacy.ts` och översätt alla 3 tester (giltigt CloudEvent-kuvert, avvisat kuvert utan `id`/`source`, avvisad `specversion: '2.0'`) till Vitest `describe`/`it`/`expect`.
   - Ta bort `src/__tests__/envelope.legacy.ts`.

---

## Scenariotriad (Den relationella och systemiska avsikten)

**Scenario: ATT FÖLJA – Shared CloudEvent-kontraktet täcks av aktiv Vitest-svit**
  Givet att `envelope.legacy.ts` testar `EventEnvelopeSchema` i `src/shared/`
  När testerna flyttas till `src/shared/__tests__/envelope.test.ts` och legacy-filen raderas
  Så körs kontraktstesterna i varje `pnpm test`.

**Scenario: ATT VÄNDA OM – Avvisande av ogiltiga CloudEvents**
  Givet att `EventEnvelopeSchema` utgör ryggraden i `SwarmEventBus`
  När ogiltiga kuvert testas i Vitest
  Så garanteras Fail-Fast-validering vid alla händelsegränser.

**Scenario: ATT FÖRLIKAS – Noll kvarvarande *.legacy.ts i hela repot**
  Givet att samtliga legacy-filer är skördade
  När `pnpm verify` körs
  Så passerar hela sviten med exit 0.

```


#### 1a Att följa: Intention & Nytta
Det här är ett viktigt steg för att hålla vår kodbas ren och säker. Jag förstår att vi ska skörda testerna från `envelope.legacy.ts` och placera dem i `src/shared/__tests__/envelope.test.ts` enligt ADR-030. Detta garanterar att vårt CloudEvent-kontrakt valideras korrekt vid alla gränser. Kan vi sätta igång?


#### 0a Att vända om: Kontraktsaudit
Jag har granskat kontraktet för `TCK-MAINT-056`. Vi kommer att flytta över de tre scenarierna från `envelope.legacy.ts` och säkerställa att `EventEnvelopeSchema` valideras korrekt. Hela processen avslutas med borttagning av legacy-filen för att nå fullständig kontraktsrenhet enligt ADR-030.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
Här är tre ortogonala alternativ för lösningen:

Alternativ ett: Direkt översättning och omstrukturering, där vi flyttar testerna från `envelope.legacy.ts` till den nya filen med modern Vitest-syntax och raderar legacy-filen direkt efter.

Alternativ två: Strukturerad parametriserad testning, där vi samlar fallen i en tabell för att hålla nere kodvolymen och säkerställa att vi håller oss under radgränsen.

Alternativ tre: Schemadriven validering med explicita felkontroller, där vi fokuserar uteslutande på att schemat hanterar både giltiga och ogiltiga data korrekt i en isolerad miljö.


#### 2c Att vända om: Resiliensgranskning
I resiliensgranskningen av alternativen ser jag att alternativ två, strukturerad parametriserad testning, bäst säkrar långsiktig resiliens. Genom att samla fallen i en tabell minskar vi risken för duplicerad kod och säkerställer att vi håller oss strikt under radgränsen. Detta ger också ett robust och överskådligt skyddsnät för framtida förändringar i EventEnvelopeSchema.


#### 2d Att förlikas: Mättnad
Jag fastställer härmed att alternativ två, strukturerad parametriserad testning, är det vinnande alternativet för att främja långsiktig resiliens och hålla rätt kvalitet. MÄTTNAD: JA.
