# Domänbeslut: Gemini Live Swarm & SI v10.0 Agentkrafter

Detta dokument beskriver arkitekturbeslut specifika för domänen `gemini_live_swarm`.

---

## SWARM-ADR-001: Mappning av SI v10.0 Agentkrafter & Seriell Motor
- **Datum**: 2026-09-26
- **Status**: Beslutat & Implementerat
- **Kontext**: Tidigare rollmodell (Orchestrator, Researcher, Writer, Critic) behövde förenas med SI v10.0-processreglerna och krafterna `ATT_FORLIKAS`, `ATT_FOLJA`, `ATT_VANDA_OM`, samt en fristående `SERIELL_MOTOR`.
- **Beslut**:
  - `ATT_FORLIKAS` representerar orkestratör, dörrvakt och Wayfinder 1a-beslutsarkitekt.
  - `ATT_FOLJA` representerar skapare, karterare och teknisk exekutör.
  - `ATT_VANDA_OM` representerar granskare, intern riskanalytiker och transient mikro-E2E-testare.
  - `SERIELL_MOTOR` tillhandahåller en automatiserad motor som exekverar hela kedjan 1a ➔ 1b ➔ 2e ➔ 3c ➔ 4 linjärt utan drift.
- **Konsekvens**: Full överensstämmelse mellan användargränssnitt, telemetri, händelsebuss och systeminstruktioner.

## SWARM-ADR-002: In-Memory Ringbuffert och CloudEvents 1.0
- **Datum**: 2026-09-23
- **Status**: Beslutat & Implementerat
- **Kontext**: Telemetri behöver registreras i realtid utan att belasta servern eller skapa minnesläckor.
- **Beslut**: Implementera `SwarmEventBus` med en FIFO-ringbuffert om 150 element och Zod-validering mot CloudEvents 1.0 specifikationen.
- **Konsekvens**: Deterministisk minnesanvändning och snabb reaktiv UI-uppdatering.
