# 3c Fil-operativ Källkodsspecifikation (TCK-012)

## 1. Förändringskedja för Fas 2 (pnpm genomfor)

Följande filer är specificerade för källkodsändring under Fas 2 efter bekräftelse av godkännandekoden (`TCK-012-GREENFIELD-UI-TOKEN`):

---

### Fil 1: `scripts/verify-architecture.js` (MODIFIERING)
- **Förändring**:
  - Inför strukturell kontroll av filgränser (.tsx <= 125 rader, .ts <= 250 rader) för källkodsfiler.
  - Inför kontroll av indenteringsdjup (max 4 nivåer) och förgreningsgrad (max 5 villkor per funktion/komponent).
  - Integrera i automatisk verifieringsloop med tydliga felrapporter.

---

### Fil 2: `src/features/gemini_live_swarm/agents/roleDefinitions.ts` (MODIFIERING)
- **Förändring**:
  - Uppdatera 4:e enhetens `displayName` till `"Att tjäna Gud och andra: Bygga"`.
  - Uppdatera enhetens beskrivning och systemprompt.

---

### Fil 3: `src/features/gemini_live_swarm/telemetry/telemetrySchema.ts` (MODIFIERING)
- **Förändring**:
  - Uppdatera `detectUnitInvocation(input: string)` med de exakta verbanropen:
    * `"Att följa Guds son"`: `följa`, `att följa`, `guds son`, `sonen`
    * `"Att vända om till Gud"`: `vända`, `att vända`, `vända om`
    * `"Att förlikas med Gud"`: `förlika`, `att förlika`, `förlikas`
    * `"Att tjäna Gud och andra: Bygga"`: `bygga`, `bygga ett`, `bygga två`, `bygga tre`, `tjäna`

---

### Fil 4: `src/features/gemini_live_swarm/coordinator/swarmOrchestrator.ts` (MODIFIERING)
- **Förändring**:
  - Integrera `SERIELL_MOTOR` ("Att tjäna Gud och andra: Bygga") som ett aktivt 4:e steg i `createCampaignPlan`:
    * Steg 1: `ATT_FOLJA`
    * Steg 2: `ATT_VANDA_OM`
    * Steg 3: `ATT_FORLIKAS`
    * Steg 4: `SERIELL_MOTOR` (Praktisk leveranskonstruktion & exekveringsförankring)
  - Driva agenten reellt i båda arbetssätten ("Samordning" och "Stegvis bygge").

---

### Fil 5: `src/features/gemini_live_swarm/ui/components/SwarmHeader.tsx` (NY FIL, < 125 rader)
- **Förändring**:
  - Kompass & semantiskt ankare, växling mellan "Samordning" och "Stegvis bygge", systemhälsa.

---

### Fil 6: `src/features/gemini_live_swarm/ui/components/SwarmUnitCard.tsx` (NY FIL, < 125 rader)
- **Förändring**:
  - Modulärt enhetskort med de 4 visningsnamnen, kraft-badge, statusindikator och snabbknappar för röstverb (`följa`, `vända`, `förlika`, `bygga`).

---

### Fil 7: `src/features/gemini_live_swarm/ui/components/SwarmStreamLog.tsx` (NY FIL, < 125 rader)
- **Förändring**:
  - Realtids-transkription och fasvisning för "Planera" och "Genomföra", med renderad strömningstext och tidsstämplar.

---

### Fil 8: `src/features/gemini_live_swarm/ui/components/SwarmControlPanel.tsx` (NY FIL, < 125 rader)
- **Förändring**:
  - Skarp Live API-nyckelbrygga, status för tyst röstspärr vs öppen högtalare, mute-toggle och interaktionskontroller.

---

### Fil 9: `src/features/gemini_live_swarm/ui/SwarmDashboard.tsx` (MODIFIERING, < 100 rader)
- **Förändring**:
  - Ren samlingsvy som komponerar `SwarmHeader`, grid med `SwarmUnitCard`, `SwarmControlPanel`, `SwarmStreamLog`, samt `TelemetrySidebar` och `MasterDevelopmentPlan`.

---

### Fil 10: `src/features/gemini_live_swarm/index.ts` (MODIFIERING)
- **Förändring**:
  - Exportera komponenterna från `ui/components/`.

---

### Fil 11: `src/__tests__/transient_TCK-002.test.ts` (NY TRANSIENT TESTFIL)
- **Förändring**:
  - Transienta tester för TCK-002 som validerar svärmens telemetrisnapshot och reaktiva eventbuss i minnet (< 3s).

---

### Fil 12: `src/__tests__/transient_TCK-012.test.ts` (NY TRANSIENT TESTFIL)
- **Förändring**:
  - Transienta tester för TCK-012 som validerar AST-arkitekturregler, verbanrop, 4:e agentens exekvering och Greenfield UI-komponenter i minnet (< 3s).

---

### Fil 13: `scripts/run-tests.js` & `src/__tests__/suite/e2e_regression.test.ts` (MODIFIERING)
- **Förändring**:
  - Registrera och kör både `transient_TCK-002` och `transient_TCK-012`.

---

### Fil 14: `src/features/gemini_live_swarm/doc/DECISIONS.md` (MODIFIERING)
- **Förändring**:
  - Dokumentera **ADR-SWARM-010: AST-Arkitekturspärrar, Greenfield UI-Nybygg & Skarp Agentkoppling**.

---

### Fil 15: `src/features/gemini_live_swarm/ui/MasterDevelopmentPlan.tsx` (MODIFIERING)
- **Förändring**:
  - Registrera styrkort för TCK-012.
