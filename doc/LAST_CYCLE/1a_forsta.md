# 1a Förstå: Agentkrafter & 4:e Seriell Motor (TCK-006)

## 1. Målbild & Bakgrund
I **TCK-006** integrerar vi SI v10.0:s tre grundläggande agentkrafter samt etablerar systemets 4:e komponent: **SERIELL_MOTOR** inom domänen `src/features/gemini_live_swarm/`.

### Bakgrund enligt SI v10.0 & AGENTS.md
Systemarkitekturen vilar på tre komplementära krafter:
1. **ATT_FOLJA (Följa)**: Drivande kraft som analyserar förutsättningar, kartlägger kontext och författar lösningar framåt i ett obrutet flöde. Motsvarar de operativa rollerna `RESEARCHER` och `OUTREACH_WRITER`.
2. **ATT_VANDA_OM (Vända om)**: Kritiskt granskande och stresstestande kraft som ifrågasätter antaganden, tillämpar Fail-Fast och verifierar mot strikta krav. Motsvarar rollen `CRITIC`.
3. **ATT_FORLIKAS (Förlikas)**: Harmoniserande och sammanfogande kraft som väger samman delresultat, bygger konsensus och säkrar mättnad (`MÄTTNAD: JA`) före commit. Motsvarar rollen `ORCHESTRATOR`.
4. **SERIELL_MOTOR (4:e Motorn)**: En deterministisk exekveringsmotor för linjära pipelinesteg. Den garanterar att fasövergångar sker sekventiellt (1a -> 1b -> 2a -> 2b -> 2e -> 3c), beräknar körtidsmetrik och avbryter vid brott mot invarianta villkor.

### Nulägesanalys i `src/features/gemini_live_swarm/`
- `roleDefinitions.ts`: Innehåller diskreta roller (`ORCHESTRATOR`, `RESEARCHER`, `OUTREACH_WRITER`, `CRITIC`). Saknar koppling till SI v10.0-krafterna och saknar definitionen för den seriella motorn.
- `telemetrySchema.ts`: Saknar Zod-scheman för `AgentForce` samt `SerialExecutionMetricSchema` och fält för pipelineframdrift.
- `swarmEventBus.ts`: Hanterar grundläggande händelser, men saknar dedikerade händelsetyper och mönster för seriella pipelineövergångar och grindevalueringar (`swarm.serial.*`).

---

## 2. Intern Riskanalys (GROW-risknoder)

### Risknod 1: State (Pipelinesekvensering & Tillståndshantering)
- **Risk**: När den 4:e seriella motorn orkestrerar steg sekventiellt finns risk för tillståndskonkurrens eller att mellanliggande steg överskuggar varandras resultat i minnesbufferten.
- **Teknisk analys & Åtgärd**: Den seriella motorn modelleras som en tillståndsmaskin med deterministiska tillstånd (`IDLE`, `PIPELINE_RUNNING`, `STEP_RUNNING`, `STEP_COMPLETED`, `TOKEN_GATE_PAUSED`, `PIPELINE_COMPLETED`, `HALTED`). Varje steg genererar ett oföränderligt CloudEvents-kuvert med entydigt sekvensnummer och steg-ID. Tillståndet isoleras per pipelinekörning så att noll minnesläckor eller tillståndskontaminering uppstår.

### Risknod 2: Contract (Bakåtkompatibilitet & Zod-validering)
- **Risk**: Introduktion av de nya krafterna (`ATT_FORLIKAS`, `ATT_FOLJA`, `ATT_VANDA_OM`, `SERIELL_MOTOR`) bryter befintliga komponenter (`SwarmDashboard`, `TelemetrySidebar`, befintliga enhetstester) som förväntar sig `SwarmAgentRole` (`ORCHESTRATOR`, etc.).
- **Teknisk analys & Åtgärd**: Fullständig bakåtkompatibilitet garanteras genom tvåvägs typ-alias och mapping-funktioner:
  - `AgentForce` definieras som `z.enum(['ATT_FORLIKAS', 'ATT_FOLJA', 'ATT_VANDA_OM', 'SERIELL_MOTOR'])`.
  - En explicit kartläggningsfunktion `mapRoleToForce(role: SwarmAgentRole): AgentForce` och `mapForceToRole(force: AgentForce): SwarmAgentRole` introduceras.
  - Befintliga roller bevaras intakta medan de berikas med `force: AgentForce`-fält.
  - `telemetrySchema.ts` utökas med `SerialExecutionMetricSchema` och `AgentForceSchema` utan att ändra befintliga obligatoriska fält destruktivt.

### Risknod 3: Resilience (Token Gate-skydd & Fail-Fast)
- **Risk**: Att källkodsändringar under Fas 1 utförs direkt under `src/` vilket skulle bryta mot SI v10.0 Token Gate-spärren och körtidskontraktet.
- **Teknisk analys & Åtgärd**: Strikt tillämpning av Token Gate. Under Fas 1 ändras eller skapas INGA källkodsfiler under `src/`. Alla specifikationer och modeller sparas under `doc/LAST_CYCLE/`. Godkännandekoden registreras i `REQUIRED_TOKEN.txt` och verkställande under `src/` sker först i Fas 2 via `pnpm genomfor [REQUIRED_TOKEN]`.
