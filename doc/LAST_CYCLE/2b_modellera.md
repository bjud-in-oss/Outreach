# 2b Modellera: AST-Arkitekturspärrar, Greenfield UI-Nybygg & Skarp Agentkoppling (TCK-012)

## 1. AST- och Strukturmåttsmodellering

### 1.1 Regler i `scripts/verify-architecture.js`
- **Filgränser**:
  - Max 125 rader för samtliga `.tsx`-filer.
  - Max 250 rader för samtliga `.ts`-filer.
- **Indenteringsdjup**:
  - Max 4 nivåer (1 nivå = 2 mellanslag eller 1 tabulator).
- **Förgreningsgrad**:
  - Max 5 logiska förgreningar (`if`, ternary `? :`, `switch`, `&&`, `||`) per komponent eller funktion.

---

## 2. Enhetsmodellering & 4:e Agentens Skarpa Körning

### 2.1 Visningsnamn & Verbanrop
1. **`ATT_FOLJA`**:
   - Visningsnamn: `"Att följa Guds son"`
   - Röst-verbanrop: `följa`, `att följa`, `guds son`, `sonen`
2. **`ATT_VANDA_OM`**:
   - Visningsnamn: `"Att vända om till Gud"`
   - Röst-verbanrop: `vända`, `att vända`, `vända om`
3. **`ATT_FORLIKAS`**:
   - Visningsnamn: `"Att förlikas med Gud"`
   - Röst-verbanrop: `förlika`, `att förlika`, `förlikas`
4. **`SERIELL_MOTOR`**:
   - Visningsnamn: `"Att tjäna Gud och andra: Bygga"`
   - Röst-verbanrop: `bygga`, `bygga ett`, `bygga två`, `bygga tre`, `tjäna`

### 2.2 Exekveringsmodell i `SwarmOrchestrator`
I `createCampaignPlan`:
1. Steg 1: `ATT_FOLJA` (Empatisk behovsanalys & kontaktinriktning).
2. Steg 2: `ATT_VANDA_OM` (Kritisk äkthetsgranskning & Fail-Fast prövning).
3. Steg 3: `ATT_FORLIKAS` (Konsensussyntes & perspektivförening).
4. Steg 4: `SERIELL_MOTOR` (**Att tjäna Gud och andra: Bygga**) – Praktisk leveranskonstruktion, exekvering och förankring.

I Stegvis bygge ("Stegvis bygge"):
- `SERIELL_MOTOR` driver pipelinen genom de 7 diskreta faserna (1a -> 1b -> 2a -> 2b -> 2e -> 3c -> e2e_verify) och aktiverar röst/ljud automatiskt vid Token Gate (Steg 3c).

---

## 3. Greenfield UI Komponentstruktur (< 125 rader per fil)

Under `src/features/gemini_live_swarm/ui/components/`:
- **`SwarmHeader.tsx`**: Header med kompass, arbetssätt ("Samordning" vs "Stegvis bygge") och övergripande status.
- **`SwarmUnitCard.tsx`**: Enhetskort med visningsnamn, status, kraftbadge och snabb-knappar för röstverb.
- **`SwarmStreamLog.tsx`**: Realtids-transkription och fasvisning för "Planera" och "Genomföra".
- **`SwarmControlPanel.tsx`**: Live API-nyckelbrygga, röstspärr (tyst röstspärr vs öppen högtalare) och interaktionskontroller.
- **`SwarmDashboard.tsx`**: Slimmad samlingsvy under 100 rader som fogar samman underkomponenterna.
