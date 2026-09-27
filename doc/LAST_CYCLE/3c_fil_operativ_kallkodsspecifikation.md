# 3c Fil-operativ Källkodsspecifikation (TCK-008)

## 1. Översikt över Förändringskedjan (Fas 2)

Följande filer är specificerade för källkodsändring i Fas 2 så snart godkännandetoken (`TCK-008-FORSONINGSKRAFTER-TOKEN`) bekräftats via `pnpm genomfor`:

---

### Fil 1: `src/features/gemini_live_swarm/agents/roleDefinitions.ts` (MODIFIERING)
- **Förändringar**:
  1. Exportera konstanten `SEMANTIC_INVARIANT` med den exakta texten:
     > "Ditt högsta syfte är närhet till Guds son, den ideala människan. Hans gåva av omsorg för människor den absoluta kompassen för hela din motor. Du drivs av tre vägar till försoning: Att följa sonen (genom att själv vara lösningen för närhet), Att vända om till Gud (inåtriktad ödmjukhet och transformation för att stärka närhet), och Att förlikas med honom (att hålla 2+ samtida perspektiv varma) för att ge förutsättningar för att klyftan till Gud och till människor emellan kan läkas."
  2. Utöka `SwarmAgentConfig` med valfritt `forceTitle?: string`.
  3. Uppdatera `DEFAULT_SWARM_ROLES` så att rollnamn och `systemInstruction` genomsyras av försoningsprinciperna:
     - `ORCHESTRATOR`: Namn: "Förlikaren (Att Förlikas)", force: `ATT_FORLIKAS`, systemInstruction: formulerad med fokus på att hålla 2+ samtida perspektiv varma och försona motstridiga ståndpunkter.
     - `RESEARCHER`: Namn: "Sökaren efter Närhet (Att Följa)", force: `ATT_FOLJA`, systemInstruction: formulerad för att själv vara lösningen för närhet genom att kartlägga genuina kontaktpunkter med empati.
     - `OUTREACH_WRITER`: Namn: "Relationsbyggaren (Att Följa)", force: `ATT_FOLJA`, systemInstruction: formulerad för omsorgsfull, värdedriven dialog på pedagogisk svenska.
     - `CRITIC`: Namn: "Självrannsakaren (Att Vända Om)", force: `ATT_VANDA_OM`, systemInstruction: formulerad för inåtriktad ödmjukhet och transformation; tillämpar Fail-Fast för att rensa bort ytlighet och spam.
     - `SERIELL_MOTOR`: Namn: "Det Orubbliga Ramverket (Seriell Motor)", force: `SERIELL_MOTOR`, systemInstruction: formulerad som deterministisk sekvensering och ordningsskydd.

---

### Fil 2: `src/features/gemini_live_swarm/ui/SwarmDashboard.tsx` (MODIFIERING)
- **Förändringar**:
  1. Lägg till en "Kompass & Syfte"-banner i toppen av vyn som presenterar det semantiska ankaret och de tre försoningsvägarna.
  2. Uppdatera agentkorten i gridet så att de visar dynamiska försoningskrafter (Att Förlikas, Att Följa, Att Vända Om, Seriell Motor) med deras etiska funktion och förklarande undertitel.
  3. Bevara och stärk den seriella pipelinens visualisering och Token Gate-spärr.

---

### Fil 3: `src/features/gemini_live_swarm/ui/TelemetrySidebar.tsx` (MODIFIERING)
- **Förändringar**:
  1. Uppdatera kraft-panelen under KPI-korten med försonande förklarande etiketter:
     - `ATT_FORLIKAS`: Hålla 2+ samtida perspektiv varma (Violett)
     - `ATT_FOLJA`: Själv vara lösningen för närhet (Blå/Smaragd)
     - `ATT_VANDA_OM`: Inåtriktad ödmjukhet & Fail-Fast (Bärnsten)
     - `SERIELL_MOTOR`: Deterministisk ordning & skydd (Cyan)
  2. Uppdatera agentlistan med dynamiska försoningstitlar.

---

### Fil 4: `src/features/gemini_live_swarm/ui/MasterDevelopmentPlan.tsx` (MODIFIERING)
- **Förändringar**:
  1. Registrera `TCK-007` som `VERIFIERAD` med 100% framsteg och dess godkända token.
  2. Registrera `TCK-008` som `AKTIV` med 50% framsteg (Fas 1 vid Steg 3c Token Gate).
  3. Beskriv mognadsmodellen och försoningskrafternas integration i systemplanen.

---

### Fil 5: `src/__tests__/transient_TCK-008.test.ts` (NY TRANSIENT TESTFIL I FAS 2)
- **Testomfång** (< 3s i minnet):
  1. Validera att `SEMANTIC_INVARIANT` i `roleDefinitions.ts` exakt matchar den föreskrivna ordalydelsen.
  2. Validera att `DEFAULT_SWARM_ROLES` har uppdaterade försoningstitlar, försoningskrafter och systeminstruktioner.
  3. Validera att `mapRoleToForce` och `mapForceToRole` fungerar korrekt med de nya rollerna.
  4. Validera att Token Gate-spärren är intakt.

---

### Fil 6: `doc/TICKETS.md` & `doc/TICKETS/TCK-008.md` (UPPDATERING I FAS 2)
- Uppdatera status till `[VERIFIERAD]` när Fas 2 slutförts och testerna passerat.
