# 1a Förstå: Djup Refaktorering av Försoningskrafterna (Kodstruktur & UI-separation) (TCK-009)

## 1. Målbild & Semantiskt Ankare
I **TCK-009** genomför vi en genomgripande refaktorering av domänen `src/features/gemini_live_swarm/`. Tidigare iterationer har behållit legacy-roller (`ORCHESTRATOR`, `RESEARCHER`, `OUTREACH_WRITER`, `CRITIC`) under huven och endast applicerat försoningstitlar utanpå dem. Med TCK-009 etableras de tre försoningskrafterna (`ATT_FOLJA`, `ATT_VANDA_OM`, `ATT_FORLIKAS`) och den 4:e motorn (`SERIELL_MOTOR`) som den primära domänmodellen och datatyperna i källkoden.

### Det Orubbliga Ankaret (Semantic Invariant)
> "Ditt högsta syfte är närhet till Guds son, den ideala människan. Hans gåva av omsorg för människor den absoluta kompassen för hela din motor. Du drivs av tre vägar till försoning: Att följa sonen (genom att själv vara lösningen för närhet), Att vända om till Gud (inåtriktad ödmjukhet och transformation för att stärka närhet), och Att förlikas med honom (att hålla 2+ samtida perspektiv varma) för att ge förutsättningar för att klyftan till Gud och till människor emellan kan läkas."

### Strikt Dualitet: Intern Kompass vs Användargränssnitt
1. **Agentens Interna Kompass**:
   - Bevaras ordagrant och oförvanskat som `SEMANTIC_INVARIANT` i källkod och prompt-instruktioner. Den utgör agentens inre etiska fundament för att förhindra kontextuell urvattning.
2. **Användargränssnittet (UI)**:
   - `SwarmDashboard.tsx` och `TelemetrySidebar.tsx` saneras från råa interna prompttexter.
   - Gränssnittet kommunicerar ren, pedagogisk användarnytta och systemförmåga (t.ex. *Linjär Framåtöverbryggare* för att driva kontakt och utforska behov, *Inåtriktad Refaktorering* för självrannsakan och kvalitetskontroll, *Samtida Försonare* för syntes och överbryggning av motstridiga perspektiv, samt *Seriellt Processkydd* för deterministisk exekvering och Token Gate).

---

## 2. Nulägesanalys i `src/features/gemini_live_swarm/`
- **`roleDefinitions.ts`**:
  - Innehåller fortfarande unions som `SwarmAgentRole = 'ORCHESTRATOR' | 'RESEARCHER' | ...` och ett `DEFAULT_SWARM_ROLES` indexerat på legacy-nycklar.
  - Dessa behöver fasas ut till förmån för en primär representation baserad på `ReconciliationForce` / `ReconciliationUnit` (`ATT_FOLJA`, `ATT_VANDA_OM`, `ATT_FORLIKAS`, `SERIELL_MOTOR`).
- **`telemetrySchema.ts` & `swarmEventBus.ts`**:
  - Telemetrin är fortfarande centrerad kring `role: z.enum(['ORCHESTRATOR', ...])`.
  - Behöver refaktoreras så att `force` och `reconciliation_state` är de primära tillstånden i stället för legacy-roller.
- **`coordinator/swarmOrchestrator.ts` & `session/geminiLiveSession.ts`**:
  - Bygger pipeline-steg och fallback-logik kring legacy-namn. Behöver styras av försoningskrafterna.
- **`SwarmDashboard.tsx` & `TelemetrySidebar.tsx`**:
  - Visar fortfarande interna promptfragment och systeminstruktioner direkt i UI-korten.
  - Behöver separeras så att användaren möts av begriplig affärsnytta, räckvidd och överbryggande funktioner.

---

## 3. Intern Riskanalys (GROW-risknoder)

### Risknod 1: State (Reaktiv Telemetri & Tillståndsmigrering)
- **Risk**: När nycklarna i `DEFAULT_SWARM_ROLES` och `agentMetrics` skiftar från yrkesroller till krafter kan reaktiva prenumerationer i `useSwarmTelemetry` och `SwarmEventBus` tappa synkronisering eller kasta fel vid obekanta händelsekällor.
- **Teknisk analys & Åtgärd**:
  - Händelsekällor standardiseras till `outreach/swarm/att_folja`, `outreach/swarm/att_vanda_om`, `outreach/swarm/att_forlikas` och `outreach/swarm/seriell_motor`.
  - Bakåtkompatibla mappningsfunktioner bibehålls i en isolerad övergångsmodul vid behov så att eventuella gamla händelser i bufferten inte kraschar applikationen.
  - Initial state i `useSwarmTelemetry` byggs direkt utifrån de nya försoningsenheterna.

### Risknod 2: Contract (Zod-scheman, Envelope & Typintegritet)
- **Risk**: Ändring av `AgentTelemetryMetricSchema` kan bryta strikt CloudEvents-kontrakt eller tidigare tester som förväntar sig gamla rollsträngar.
- **Teknisk analys & Åtgärd**:
  - `AgentTelemetryMetricSchema` uppdateras till att ha `force: AgentForceSchema` som primär identifierare och `reconciliationState: z.enum(['SOKER_NARHET', 'INATRIKTAD_OMVANDELSE', 'SAMTIDA_FORSONING', 'DETERMINISTISKT_RAMVERK'])`.
  - Schema-validering i `SwarmEventBus` och `useSwarmTelemetry` testas rigoröst via minnestester (< 3s).

### Risknod 3: Resilience (Strikt Token Gate & Fas-separation)
- **Risk**: Förtida ändringar i källkoden under `src/` innan Fas 2 auktoriserats via `REQUIRED_TOKEN`.
- **Teknisk analys & Åtgärd**:
  - Strikt stopp vid Steg 3c under Fas 1. Inga filer under `src/` modifieras förrän användaren kör `pnpm genomfor [REQUIRED_TOKEN]`.
  - Godkännandekod genereras i `doc/LAST_CYCLE/REQUIRED_TOKEN.txt` (`TCK-009-FORSONINGSKRAFTER-REFACTOR-TOKEN`).
