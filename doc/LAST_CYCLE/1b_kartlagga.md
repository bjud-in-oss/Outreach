# 1b Kartlägga: AST-Miljöspärr mot Mockar, Autonom Handoff & Max 3 Agenter-kapacitet (TCK-013)

## 1. Kartläggning av Källkodsartefakter

### 1.1 Verifieringsskript (`scripts/verify-architecture.js` & `scripts/drivers/ts.js`)
- **Nuvarande läge**:
  - Kontrollerar filgränser (<=125 .tsx, <=250 .ts), indenteringsdjup (<=4) och förgreningsgrad (<=5).
  - Saknar kontroll mot tysta produktionsmockar i `src/features/`.
- **Förändringsbehov för TCK-013**:
  - Inför `checkNoProductionMocks(filePath, content)` i `scripts/drivers/ts.js`.
  - Scanna samtliga filer under `src/features/` och blockera:
    * `isTestMode`
    * `generateDeterministicFallback`
    * `mock-file` / `mock-folder`
    * Tysta syntetiska genereringar som maskerar saknade API-nycklar.
  - Fail-Fast med omedelbar avbruten verifiering och tydlig felrapport.

### 1.2 Gemini Live Session & Google Drive Client
- **`src/features/gemini_live_swarm/session/geminiLiveSession.ts`**:
  - Ta bort `isTestMode` och `generateDeterministicFallback`.
  - Utöka `LiveSessionStatus` med tillståndet `HALTED`.
  - Om `apiKey` saknas sätts tillståndet direkt till `HALTED`, och en CloudEvents-händelse `swarm.live.session.halted` sänds på bussen med pedagogisk diagnostik.
  - Anrop till `generateAgentTurn` eller strömning utan nyckel kastar ett strukturerat `MissingApiKeyError`.
- **`src/features/google_drive_sync/api/driveClient.ts`**:
  - Rensa bort `mock-folder-...` och `mock-file-...`.
  - Om token saknas kastas `MissingDriveAuthError`, och klientens status markeras som `UNAUTHENTICATED`.

### 1.3 UI-namnharmonisering & Diagnostikpanel
- **`src/features/gemini_live_swarm/ui/TelemetrySidebar.tsx`**:
  - Ersätt hårdkodade "Att försonas (ensam agent)" med dynamisk läsning från `RECONCILIATION_UNITS.SERIELL_MOTOR.displayName` ("Att tjäna Gud och andra: Bygga").
  - Hämta och visa enhetsnamnen 100% dynamiskt.
- **`src/features/gemini_live_swarm/ui/components/SwarmHeader.tsx`**:
  - Säkerställ att fjärde vägen benämns med enhetens korrekta dynamiska namn och syfte.
- **`src/features/gemini_live_swarm/ui/SwarmDashboard.tsx` & `SwarmControlPanel.tsx`**:
  - Inför pedagogisk diagnostikpanel i gränssnittet när `liveStatus === 'HALTED'` eller Google Drive är `UNAUTHENTICATED`, med instruktioner för AI Studio Secrets.

### 1.4 Kapacitetsspärr (Max 3 Agenter) & Autonom Handoff-slinga
- **`src/features/gemini_live_swarm/coordinator/swarmOrchestrator.ts`**:
  - Inför `MAX_CONCURRENT_AGENTS = 3`.
  - Hantera svärmens kapacitet:
    * Under normal samverkan körs Live-agenterna (`ATT_FOLJA`, `ATT_VANDA_OM`, `ATT_FORLIKAS`) = 3 agenter.
    * Vid handoff till `SERIELL_MOTOR` pausas Live-agenterna (`isPaused: true`), och Bygga-agenten exekverar ensam i sitt deterministiska läge (1 aktiv agent <= 3).
    * När Bygga-agenten når Token Gate (Steg 3c) stannar den (`stageStatus = 'GATED'`), och Live-agenterna aktiveras för konsensusgranskning (`ATT_FOLJA`, `ATT_VANDA_OM`, `ATT_FORLIKAS`) innan användaren bekräftar med `REQUIRED_TOKEN`.
  - Autonom slinga: Bygga-agenten stegar sig själv från fas 1a till 3c genom att lyssna på sina egna fasövergångshändelser på `SwarmEventBus`.

### 1.5 Transient Testsvit
- Skapa `src/__tests__/transient_TCK-013.test.ts` som validerar:
  1. Fail-Fast när nycklar saknas (`HALTED` och `UNAUTHENTICATED`).
  2. AST-spärr mot mockar i produktionskod.
  3. 100% UI-namnharmonisering av 4:e enheten.
  4. Kapacitetsspärr på max 3 samtidiga agenter.
  5. Autonom handoff-slinga från Live-agenter till Bygga-agenten och konsensusgranskning vid Token Gate (3c).
