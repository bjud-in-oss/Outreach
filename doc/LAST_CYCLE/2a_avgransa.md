# 2a Avgränsa: Global Swarm Core, Systeminstruktions-synk & Bakgrundsöverlevnad (TCK-015)

## 1. Avgränsningsmatris

| Område | Ingår i TCK-015 | Ingår INTE (Avgränsat) | Motivering |
| :--- | :--- | :--- | :--- |
| **Systeminstruktioner** | Synkning av finslipad text ("främja närhet...") i SI, AGENTS.md, roleDefinitions och orchestrator | Ändring av de fyra försoningsenheternas visningsnamn | Visningsnamnen är permanent standardiserade i TCK-009/TCK-012. |
| **Global Swarm Core** | Global `SwarmProvider` i `App.tsx` för bakgrundsöverlevnad vid flikbyten | Omritning av befintlig layout eller UI-komponenter | Dashboard, Sidebar och Paneler är redan optimalt strukturerade. |
| **Återanslutning** | Auto-reconnect vid 503 High Demand och nätverksfel med exponentiell backoff | Permanent polling eller oändliga återanslutningsslingor | Max 3 återanslutningsförsök med backoff förhindrar överbelastning. |
| **Kontextmarginal** | Proaktiv 60% marginalbevakning och disk-handoff-signalering via `SwarmEventBus` | Automatisk borttagning av historiska filer på disk | Disk-handoff skall spara och bevara artefakter under `doc/LAST_CYCLE/`. |
| **Tester & Verifiering** | Transient mikro-E2E i `src/__tests__/transient_TCK-015.test.ts` (< 3s) | Långsamma live-tester mot externa molnservrar utan mock | Följer TDD-principen för deterministisk och snabb regressionssvit. |

---

## 2. Arkitektoniska Begränsningar (AST & Kontrakt)
- Max 125 rader per `.tsx`-fil, max 250 rader per `.ts`-fil.
- Max 4 indenteringsnivåer per funktion/komponent.
- Max 5 förgreningar per komponent.
- Strikt Zod-validering för nya händelsetyper (`ContextUsageMetricSchema`).
- Inga produktionsmockar under `src/features/` (efterlevnad av TCK-013).
