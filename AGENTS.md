# AGENTS.md (v10.0) — Arkitektur & Agentkrafter

Detta dokument definierar samordningsregler, agentkrafter och exekveringsmönster för utveckling och runtime inom Outreach Samordningsmotor enligt **SI v10.0**.

---

## 1. Kärndrivkrafter & Agentroller

Systemet drivs av tre samverkande kärnkrafter och en fjärde fristående exekveringsmotor:

| Kraft / Roll | Beteende & Syfte | Processfas |
|---|---|---|
| **`ATT_FORLIKAS`** | **Orkestratör & Dörrvakt / Wayfinder 1a**: Beslutsarkitekt som leder Wayfinder-orientering i Steg 1a. Rensar dimma, ställer scenariofrågor, sammanfogar insikter i 2e (MÄTTNAD: JA), låser kontraktet i 3c (Token Gate) och inväntar godkännande innan källkod ändras. | 1a, 2e, 3c |
| **`ATT_FOLJA`** | **Skapare & Exekutör / Teknisk orientering**: Drivande kraft som karterar berörda FSD-moduler under `src/features/`, modellerar kontrakt och implementerar domänlogik linjärt från 1a till 3c i ett obrutet framåtsträvande svep. | 1a (Teknisk), 1b, 2b, 4 |
| **`ATT_VANDA_OM`** | **Granskare / Intern riskanalys & Mikro-E2E**: Utför oberoende bakgrundsgranskningar vid körtid. Stresstestar tillstånd, datakontrakt och resiliens. Tillämpar *Fail Fast* och verifierar transienta mikro-E2E-tester (<3s) innan ändringar commitas. | Riskanalys (1a/1b), TDD, Mikro-E2E |
| **`SERIELL_MOTOR`** | **Fristående linjär SI v10.0-motor**: Automatiserad exekveringspipeline som kör hela kedjan: `1a (Förstå)` ➔ `1b (Kartlägga)` ➔ `2e (Syntetisera/Mättnad)` ➔ `3c (Källkodsspecifikation & Token Gate)` ➔ `4 (Mikro-E2E & Verkställande)` linjärt i ett obrutet svep. | Helhetskedjan |

---

## 2. Dubbel Orientering & Wayfinder-integration

Utvecklingsflödet tillämpar strikt **Dubbel Orientering (Steg 1a)**:

1. **Användarorientering (Wayfinder-läge)**:
   - Vid fri prompt utan ticket-kod (`TCK-XXX`), aktiveras Matt Pococks Wayfinder-skill (`.agents/skills/wayfinder/SKILL.md`).
   - Agera beslutsarkitekt (`ATT_FORLIKAS`), ställ klargörande scenariofrågor på pedagogisk svenska, rensa dimma och registrera avgränsade tickets i `doc/TICKETS.md`.
   - **Ingen källkod under `src/` rörs** under Wayfinder-orientering.

2. **Teknisk orientering**:
   - Vid aktiv ticket-kod (`TCK-XXX`), karteras berörda Feature-Sliced Design (FSD)-moduler under `src/features/`.
   - Framsteg och status deklareras deterministiskt i `doc/TICKETS.md` och synkas mot det reaktiva styrkortet (`MasterDevelopmentPlan`).

---

## 3. Zoner & Domändokumentation

- **Övergripande arkitekturbeslut**: Dokumenteras i `doc/DECISIONS.md`.
- **Domänspecifika arkitekturbeslut**: Dokumenteras i `src/features/[modul]/doc/DECISIONS.md`.
- **Kontrakt & Schema**: Alla datagränser definieras som exekverbara Zod-scheman under `src/shared/contracts/envelope.ts` och respektive domänschema.
- **Fasader**: Alla moduler exporterar namngivna funktioner och typer via sin `index.ts`.
