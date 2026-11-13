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
