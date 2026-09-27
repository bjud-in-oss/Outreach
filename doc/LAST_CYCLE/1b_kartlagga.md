# 1b Kartlägga: Förankring av Mognadsmodellen & Försoningskrafterna i Källkod och UI (TCK-008)

## 1. Kartläggning av Källkodsartefakter inom `gemini_live_swarm`

### Berörda Filer och Beroendekedja
1. **`src/features/gemini_live_swarm/agents/roleDefinitions.ts`**:
   - Inbädda den orubbliga inledningstexten som en konstant `SEMANTIC_INVARIANT`.
   - Omdefiniera `DEFAULT_SWARM_ROLES` med försoningsprinciperna som bärande kompass i `systemInstruction` och namn:
     - `ORCHESTRATOR`: **Förlikaren (Att Förlikas)** — Håller 2+ samtida perspektiv varma för att hela klyftor och skapa harmoniserad konsensus.
     - `RESEARCHER`: **Sökaren efter Närhet (Att Följa)** — Är själv lösningen för närhet genom att kartlägga genuina kontaktpunkter och förstå mottagarens verklighet.
     - `OUTREACH_WRITER`: **Relationsbyggaren (Att Följa)** — Formulerar omsorgsfull, värdedriven dialog på pedagogisk svenska som skapar genuin kontakt.
     - `CRITIC`: **Självrannsakaren (Att Vända Om)** — Inåtriktad ödmjukhet och transformation; rensar bort ytlighet, manipulation och spam via Fail-Fast.
     - `SERIELL_MOTOR`: **Det Orubbliga Ramverket (Seriell Motor)** — Deterministisk sekvensering och Token Gate-disciplin som skyddar processens integritet.

2. **`src/features/gemini_live_swarm/ui/SwarmDashboard.tsx`**:
   - Lägg till en framträdande "Kompass & Syfte"-banner som visar systemets semantiska ankare.
   - Ersätt statiska yrkesroll-etiketter med dynamiska försoningskrafter på alla agentkort.
   - Visa försoningskraftens kärnuppdrag på varje kort.

3. **`src/features/gemini_live_swarm/ui/TelemetrySidebar.tsx`**:
   - Uppdatera kraft-panelen så att de tre försoningsvägarna och seriell motor visualiseras med deras etiska funktion:
     - `ATT_FORLIKAS` (Samtida perspektiv)
     - `ATT_FOLJA` (Lösning för närhet)
     - `ATT_VANDA_OM` (Ödmjuk transformation)
     - `SERIELL_MOTOR` (Deterministiskt skydd)

4. **`src/features/gemini_live_swarm/ui/MasterDevelopmentPlan.tsx`**:
   - Registrera `TCK-007` som `VERIFIERAD` och `TCK-008` som `AKTIV` (Fas 1 vid Steg 3c).
   - Inkludera mognadsmodellen och försoningskrafternas integration i leveransplanen.

5. **`src/__tests__/transient_TCK-008.test.ts` (Fas 2 transient mikro-E2E-test)**:
   - Skapa snabbt minnestest (< 3s) som verifierar:
     - Förekomst och ordagrann korrekthet för det semantiska ankaret i `roleDefinitions.ts`.
     - Att samtliga agenters roller och systeminstruktioner reflekterar försoningsprinciperna.
     - Att UI-komponenter och metrik återger de dynamiska försoningskrafterna.

---

## 2. Fas 1 Deklaration

```json
{
  "status": "PLANNING_FAS_1",
  "current_domain": "src/features/gemini_live_swarm/",
  "next_step": "2e_syntetisera",
  "ticket_id": "TCK-008",
  "active_skill": "gemini-live-api-dev",
  "active_vectors": [
    "semantic_invariant_anchoring",
    "reconciliation_forces_role_definitions",
    "dynamic_forces_ui_dashboard",
    "telemetry_sidebar_forces_labels",
    "transient_e2e_tck008_verification"
  ]
}
```
