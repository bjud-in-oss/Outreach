# FRAMTIDA META-UPPDRAG: EXEKVERBARA SPECIFIKATIONER & MUTATIONSTESTNING

## Kontext & Målbild
När motorns grundläggande stafett (Fas 0–3) är verifierad i skarp drift vill vi höja testkvaliteten från "gröna alibin" till matematiskt bevisad funktion enligt Dave Farleys principer för Continuous Delivery.

## 🎯 Aktuella Meta-Mål (Strangler Fig & Vägen)
1. **Empirisk mätning via BENCHMARK.json:** Jämför driftdata mellan 12-stegsmodellen (`path-classic`) och 4-portsmodellen (`path-lean`).
2. **Kravarkiv för exempelskördning (ADR-030 punkt 3):** Selektiv överföring av integrationsscenarier från `src/__tests__/*.legacy.ts` till `src/features/path/__tests__/` när körtidsadaptrarna är i drift.

---

## 🔬 Framtida Arkitektur- & Testinvarianter
1. **Strikt Kontrakts-DSL i Ticket-nedbrytningen:** Tvinga alla transienta tester att interagera med omvärlden via EventBus, CloudEvents eller MCP.
2. **Mutationstestning (Stryker):** Automatiserat nattjobb mot `src/shared/contracts/` för att bevisa att testsviten detekterar logikfel.
