# 2a Avgränsa: Mål, Omfång och Invarianter (TCK-006)

## 1. Målavgränsning & Leveransomfång
Målet med **TCK-006: AGENTKRAFTER & 4:E SERIELL MOTOR I GEMINI_LIVE_SWARM** är att förankra SI v10.0:s krafter och introducera den 4:e seriella motorn på kodnivå i svärmens grundarkitektur.

### Ingår i omfånget (IN-SCOPE):
1. **Agentkrafter & Rollmappning (`roleDefinitions.ts`)**:
   - Definiera typen `AgentForce = 'ATT_FORLIKAS' | 'ATT_FOLJA' | 'ATT_VANDA_OM' | 'SERIELL_MOTOR'`.
   - Utöka `SwarmAgentConfig` med fältet `force?: AgentForce`.
   - Addera `SERIELL_MOTOR` till `DEFAULT_SWARM_ROLES` med dedikerad systeminstruktion och avatar/färgprofil.
   - Implementera `mapRoleToForce` och `mapForceToRole` för 100% bakåtkompatibilitet.
2. **Strikta Zod-kontrakt (`telemetrySchema.ts`)**:
   - Skapa `AgentForceSchema`.
   - Skapa `SerialStageSchema` och `SerialExecutionMetricSchema`.
   - Utöka `SwarmTelemetrySnapshotSchema` med valfritt `serialExecution`-fält för att stödja realtidsmetrik för den seriella motorn.
3. **Eventbuss för Seriell Motor (`swarmEventBus.ts`)**:
   - Definiera händelsemönster för den seriella motorn (`swarm.serial.*`).
   - Tillhandahålla hjälpmetod eller mönster för publicering av validerade `SerialExecutionMetric`-kuvert.
4. **Fasadexport (`index.ts`)**:
   - Exportera alla nya typer, konstanter och valideringsscheman.
5. **Transient Mikro-E2E-test (`transient_TCK-006.test.ts`)**:
   - Konstrueras i Fas 2 och verifierar hela flödet i minnet (< 3s).

### Ingår EJ i omfånget (OUT-OF-SCOPE):
- Grafiska UI-vyer, dashboards och visuella mätare för den seriella motorn i React (tillhör **TCK-007**).
- Djupintegration mellan MCP Bridge och Gemini Live Swarm (tillhör **TCK-003**).
- Källkodsredigering under `src/` under Fas 1 (skyddas av Token Gate).

## 2. Invarianta Arkitekturprinciper
- **100% Typsäkerhet**: Alla typer och scheman måste vara strikta och typvaliderade via Zod.
- **Bakåtkompatibilitet**: Befintliga tester (`gemini_swarm.test.ts`, `swarm_telemetry.test.ts`) och befintliga UI-komponenter (`SwarmDashboard`, `TelemetrySidebar`) ska fortsätta passera utan ändring.
- **Token Gate**: Noll skrivning i `src/` förrän användaren godkänt `REQUIRED_TOKEN.txt` och initierat Fas 2.
