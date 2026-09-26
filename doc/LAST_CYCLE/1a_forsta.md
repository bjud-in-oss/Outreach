# 1a Förstå: UI & Dashboard-övervakning av Seriell Motor (TCK-007)

## 1. Målbild & Bakgrund
I **TCK-007** lyfter vi fram SI v10.0:s tre grundläggande agentkrafter samt den 4:e komponenten (**SERIELL_MOTOR**) till användargränssnittet inom domänen `src/features/gemini_live_swarm/`.

Efter att **TCK-006** etablerade de bakomliggande kontrakten (`AgentForce`, `SerialExecutionMetric`, `SerialStage` och deterministiska `swarm.serial.*`-händelser på `SwarmEventBus`) ska nu presentationsskiktet uppdateras för att ge operatören full realtidsinsyn och interaktiv övervakning:
1. **`SwarmDashboard.tsx`**:
   - Visualisera och kontrastera `SERIELL_MOTOR` mot de tre problemlösande krafterna (`ATT_FORLIKAS`, `ATT_FOLJA`, `ATT_VANDA_OM`).
   - Berika agentkorten med färgkodade kraft-brickor och realtidsindikatorer.
   - Dedikerad sektion för Seriell Pipeline-övervakning: fasframdrift (`1a_forsta` -> `1b_kartlagga` -> `2a_avgransa` -> `2b_modellera` -> `2e_syntetisera` -> `3c_spec` -> `e2e_verify`), stegstatus och Token Gate-spärr.
2. **`TelemetrySidebar.tsx`**:
   - Skapa ett realtidsmätande 4-krafters styrkort i sidopanelen som visar kraftbalansen och aktiviteten för samtliga fyra krafter.
   - Rendera live-metrik för `snapshot.serialExecution` när pipelinehändelser strömmar in via eventbussen.
3. **`MasterDevelopmentPlan.tsx`**:
   - Reflektera SI v10.0 leveransplan: registrera TCK-006 som `VERIFIERAD`, TCK-007 som `AKTIV` (Fas 1 Planerad / Steg 3c), och synka leverabler och kvittohashar.

---

## 2. Nulägesanalys i `src/features/gemini_live_swarm/ui/`
- **`SwarmDashboard.tsx`**:
  - Visar för närvarande endast de 4 traditionella rollerna utan koppling till de tre filosofiska krafterna eller `SERIELL_MOTOR`.
  - Har ingen visuell komponent för att följa en seriell Fas 1/Fas 2-pipelineframdrift.
- **`TelemetrySidebar.tsx`**:
  - Visar enbart KPI:er för `activeAgentsCount` (4), `eventsPerMinute` och `totalEventsCount`.
  - Mäter inte de 4 krafterna individuellt och visualiserar inte `snapshot.serialExecution`.
- **`MasterDevelopmentPlan.tsx`**:
  - Saknar post för TCK-006 och TCK-007, vilket gör att styrkortet inte avspeglar systemets faktiska utvecklingsstatus.

---

## 3. Intern Riskanalys (GROW-risknoder)

### Risknod 1: State (Reaktiv Telemetribindning & Komponentrendering)
- **Risk**: När händelser strömmar snabbt på `SwarmEventBus` kan asynkrona uppdateringar av `serialExecution` orsaka onödiga omrenderingar, blinkande gränssnitt eller `undefined`-krascher om metrik saknas.
- **Teknisk analys & Åtgärd**:
  - `useSwarmTelemetry` har redan Zod-validering och lagrar `snapshot.serialExecution` som optional.
  - UI-komponenterna designas defensivt med null-checks och fallback-visning (t.ex. visar "Pipeline vilande / redo" när ingen aktiv seriell körning pågår).
  - Använd memoiserade eller enkla rena komponentstrukturer utan tunga sidoeffekter.

### Risknod 2: Contract (Zod-schema & Typkonsistens)
- **Risk**: Eventuella diskrepanser mellan `AgentForce` i `roleDefinitions.ts`, `telemetrySchema.ts` och UI-komponenternas förväntade props kan leda till typfel vid kompilering eller krasch i runtime.
- **Teknisk analys & Åtgärd**:
  - Alla komponenter importerar strikt `AgentForce`, `SerialExecutionMetric`, `DevelopmentTicket` direkt från `../telemetry/telemetrySchema.ts` och `../agents/roleDefinitions.ts`.
  - Inga duplicerade schema-definitioner i UI-lagret.

### Risknod 3: Resilience (Token Gate-spärr & Fas 1-disciplin)
- **Risk**: Frestelse att börja skriva kod direkt under `src/features/gemini_live_swarm/ui/` innan användaren godkänt `REQUIRED_TOKEN`.
- **Teknisk analys & Åtgärd**:
  - Strikt respekt för Token Gate (Steg 3c). Inga källkodsfiler under `src/` ändras i Fas 1.
  - Hela källkodsspecifikationen dokumenteras i `doc/LAST_CYCLE/3c_fil_operativ_kallkodsspecifikation.md`.
  - Utförandet aktiveras först när `pnpm genomfor TCK-007-UI-SERIELL-MOTOR-TOKEN` körs.
