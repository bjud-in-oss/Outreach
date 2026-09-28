# 1b Kartlägga: AST-Arkitekturspärrar, Greenfield UI-Nybygg & Skarp Agentkoppling (TCK-012)

## 1. Kartläggning av Källkodsartefakter

### 1.1 Verifieringsskript (`scripts/verify-architecture.js` & `scripts/drivers/ts.js`)
- **Nuvarande läge**: Validerar endast `doc/TICKETS.md`, `doc/FEATURE_INDEX.json`, `envelope.ts` och `APPROVAL.md`.
- **Förändringsbehov för TCK-012**:
  - Implementera strikt kodstruktur- och AST-analys:
    - **Filgränser**: Max 125 rader för alla `.tsx`-filer under nya UI-komponenter och max 250 rader för `.ts`-filer.
    - **Indenteringsdjup**: Max 4 nivåer (förhindrar djupt nästlad pyramidkod).
    - **Förgreningsgrad**: Max 5 logiska villkor (`if`, `? :`, `switch case`, `&&`, `||`) per komponent/funktion.
  - Fail-Fast med tydliga diagnostikmeddelanden som pekar ut exakta rader.

### 1.2 Domändefinitioner, Verbanrop & 4:e Agentens Skarpa Körning
- **Nuvarande läge**:
  - 4:e enheten heter "Att försonas (ensam agent)" och exekverades ej som ett aktivt steg i `createCampaignPlan`.
  - `detectUnitInvocation` i `telemetrySchema.ts` saknar de korta verbanropen.
- **Förändringsbehov för TCK-012**:
  - Uppdatera visningsnamnet för den 4:e enheten: **"Att tjäna Gud och andra: Bygga"**.
  - Skärp och utöka `detectUnitInvocation` med de exakta verbanropen:
    * "Att följa Guds son": `följa`, `att följa`, `sonen`
    * "Att vända om till Gud": `vända`, `att vända`, `vända om`
    * "Att förlikas med Gud": `förlika`, `att förlika`, `förlikas`
    * "Att tjäna Gud och andra: Bygga": `bygga`, `bygga ett`, `bygga två`, `bygga tre`, `tjäna`
  - I `swarmOrchestrator.ts`: Integrera `SERIELL_MOTOR` som ett aktivt, genererande steg i planeringen ("Praktisk paketering och leveranskonstruktion") samt i det stegvisa byggandet.

### 1.3 Greenfield UI Komponentstruktur (`src/features/gemini_live_swarm/ui/components/`)
Alla filer under `ui/components/` byggs strikt under 125 rader:
1. **`SwarmHeader.tsx`** (<125 rader):
   - Visar kompass, arbetssätt ("Samordning" och "Stegvis bygge") och status.
2. **`SwarmUnitCard.tsx`** (<125 rader):
   - Modulärt kort för enskild enhet med visningsnamn, kraft-badge, status och röst-verbanrop (`följa`, `vända`, `förlika`, `bygga`).
3. **`SwarmStreamLog.tsx`** (<125 rader):
   - Strömningslogg för realtids-transkription och fasvisning för "Planera" och "Genomföra".
4. **`SwarmControlPanel.tsx`** (<125 rader):
   - Skarp Live API-nyckelbrygga, mute- och röstspärrskontroller samt interaktionsknappar.
5. **`SwarmDashboard.tsx`** (<100 rader):
   - Slimmad samlingsvy som orkestrerar delkomponenterna.

### 1.4 Regressionskomplettering (`transient_TCK-002.test.ts` & `transient_TCK-012.test.ts`)
- Skapa `src/__tests__/transient_TCK-002.test.ts` för att verifiera telemetri i minnet.
- Skapa `src/__tests__/transient_TCK-012.test.ts` för att verifiera AST-spärrar, verbanrop och 4:e agentens exekvering.
- Registrera båda i `scripts/run-tests.js` och `src/__tests__/suite/e2e_regression.test.ts`.
