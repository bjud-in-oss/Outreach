# 2e Syntetisera: Sammanfogning av Insikter & Mättnadsanalys (TCK-009)

## 1. Mättnadsanalys
- **MÄTTNAD: JA**
- Samtliga målkonflikter mellan teknisk arkitektur, etisk invarians och renodling till exakt 4 enheter har lösts.
- De 5 legacy-rollerna receptbeläggs och ersätts helt av de 4 försoningsenheterna: `ATT_FOLJA`, `ATT_VANDA_OM`, `ATT_FORLIKAS` och `SERIELL_MOTOR`.
- Gränssnittet i `SwarmDashboard.tsx` och `TelemetrySidebar.tsx` minskas från 5 till 4 enheter och visar ordagrant de fyra visningsnamnen:
  1. "Att följa Guds son"
  2. "Att vända om till Gud"
  3. "Att förlikas med Gud"
  4. "Att försonas (ensam agent)"
- `SEMANTIC_INVARIANT` förblir oförvanskat internt som den absoluta etiska kompassen för agenternas systemprompt.
- Inga råa interna prompttexter exponeras i användargränssnittet.

---

## 2. Syntes av Arkitektoniska Insikter

1. **Konsolidering till 4 Enheter**:
   - Genom att minska antalet enheter från 5 till 4 och direkt knyta varje enhet till dess grundkraft (`ATT_FOLJA`, `ATT_VANDA_OM`, `ATT_FORLIKAS`, `SERIELL_MOTOR`) uppnås en 1:1-mappning mellan teori, typdefinitioner, telemetri och UI.
2. **Harmoni mellan Inre Kompass och Yttre Gränssnitt**:
   - Den inre kompassen (`SEMANTIC_INVARIANT`) hålls absolut och ordagrann i källkod och promptar för att förhindra kontextuell urvattning.
   - Det yttre gränssnittet bär de fyra värdiga och tydliga titlarna med ren pedagogisk användarnytta och räckvidd.
3. **Strikt Token Gate-disciplin**:
   - Fas 1 avslutas vid Steg 3c. Inga filer under `src/` ändras förrän godkännandekoden i `doc/LAST_CYCLE/REQUIRED_TOKEN.txt` bekräftats av användaren via `pnpm genomfor`.

---

## 3. Planerade Åtgärder i Fas 2 (efter Token Gate)
- Uppdatera `src/features/gemini_live_swarm/agents/roleDefinitions.ts` med `RECONCILIATION_UNITS`.
- Uppdatera `src/features/gemini_live_swarm/telemetry/telemetrySchema.ts` och `useSwarmTelemetry.ts` för 4 enheter.
- Anpassa `src/features/gemini_live_swarm/bus/swarmEventBus.ts`.
- Uppdatera orkestrering i `src/features/gemini_live_swarm/coordinator/swarmOrchestrator.ts` och `session/geminiLiveSession.ts`.
- Skriva om `src/features/gemini_live_swarm/ui/SwarmDashboard.tsx` och `TelemetrySidebar.tsx` för 4 enheter med de exakta namnen.
- Uppdatera `src/features/gemini_live_swarm/ui/MasterDevelopmentPlan.tsx`.
- Skapa transient mikro-E2E-test `src/__tests__/transient_TCK-009.test.ts`.
- Köra `pnpm test` och `pnpm verify`.
- Konsolidera testet till `src/__tests__/suite/e2e_regression.test.ts` och stänga TCK-009 i `doc/TICKETS.md`.
