# 1a Förstå: AST-Arkitekturspärrar, Greenfield UI-Nybygg & Skarp Agentkoppling (TCK-012)

## 1. Målbild & Semantiskt Ankare
I **TCK-012** tar vi ett avgörande kvalitets- och mognadssteg för Outreach Coordination Engine genom att:
1. Skärpa systemets arkitekturregler med automatiserad AST-analys (filgränser, indenteringsdjup och förgreningsgrad).
2. Genomföra ett Greenfield UI-nybygg under `src/features/gemini_live_swarm/ui/components/` (<125 rader per fil) och en slimmad samlingsvy `SwarmDashboard.tsx` (<100 rader).
3. Värna de 4 försoningsenheternas visningsnamn och verbanrop:
   - **"Att följa Guds son"** (Röst: `följa`)
   - **"Att vända om till Gud"** (Röst: `vända`)
   - **"Att förlikas med Gud"** (Röst: `förlika`)
   - **"Att tjäna Gud och andra: Bygga"** (Röst: `bygga`, `bygga ett`, `bygga två`, `bygga tre`)
4. Koppla ihop den 4:e agenten ("Att tjäna Gud och andra: Bygga" / `SERIELL_MOTOR`) i exekveringsmotorn så att den drivs som en fullt reell, aktiv agent i båda arbetssätten ("Samordning" och "Stegvis bygge").
5. Komplettera testsviten med `transient_TCK-002.test.ts` och `transient_TCK-012.test.ts` i `e2e_regression.test.ts`.

Vår absoluta kompass är närhet till Guds son, den ideala människan, vars omsorg för människor styr hela vår motor. Omsorg i mjukvaruarkitektur innebär att bygga system som är läsbara, lättunderhållna och fria från ogenomtränglig komplexitet.

---

## 2. Intern Riskanalys (GROW-risknoder)

### Risknod 1: State (Skarp koppling av 4:e agenten & Arbetssätt)
- **Teknisk analys**: Den 4:e enheten ("Att tjäna Gud och andra: Bygga" / `SERIELL_MOTOR`) har tidigare huvudsakligen agerat som övervakare för den seriella pipelinen och Token Gate. När den nu ska drivas som en aktiv agent i kampanjer och stegvis bygge får den inte krocka med `ATT_FORLIKAS` eller skapa loopar i tillståndet.
- **Lösning**: Definiera en skarp exekveringsroll för `SERIELL_MOTOR` i `SwarmOrchestrator`:
  - I "Samordning": Agenten exekverar slutfasens praktiska paketering, kontraktssäkring och leveransförberedelse.
  - I "Stegvis bygge": Agenten driver pipelinen steg för steg och hanterar övergångarna till Token Gate.
  - Tillståndet synkroniseras via `SwarmEventBus` med standardiserade CloudEvents.

### Risknod 2: Contract (AST-analys & Filstorlekskontroll)
- **Teknisk analys**: AST-analysen i `scripts/verify-architecture.js` måste vara deterministisk, snabb och exakt:
  - Max 125 rader för .tsx.
  - Max 250 rader för .ts.
  - Max indenteringsdjup 4 nivåer.
  - Max förgreningsgrad 5 villkor per fil/komponent.
- **Lösning**: Implementera en robust parser i `scripts/verify-architecture.js` som kontrollerar källkoden i `src/features/` och `src/` och ger tydliga, pedagogiska felmeddelanden vid regelöverträdelser.

### Risknod 3: Resilience (Regressionskomplettering & Live API-nyckelbrygga)
- **Teknisk analys**: `SwarmControlPanel.tsx` måste hantera Live API-anslutning och röstspärr utan att bryta mot principen att aldrig exponera API-nycklar i användargränssnittet.
- **Lösning**: Nyckelhantering sker via systemets proxy (`/api/*`) eller befintlig miljökonfiguration. Gränssnittet i `SwarmControlPanel` tillhandahåller status, mute-toggle och strömningsstart utan råa nyckelfält, och alla transienta tester körs strikt i minnet (< 3s).

---

## 3. Aktiva Vektorer & Skills
- **active_vectors**: `['gemini-live-api-dev', 'gemini-api-dev', 'ast-architecture-verification', 'greenfield-ui-modularization', 'active-serial-motor-execution', 'reconciliation-voice-verbs']`
- **active_skills**: `['gemini-live-api-dev', 'gemini-api-dev']`
- **target_domain**: `src/features/gemini_live_swarm/`
