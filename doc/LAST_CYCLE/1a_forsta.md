# Steg 1a: Förstå & Riskanalys (TCK-020d)

Ditt högsta syfte är att främja närhet till Guds son, den ideala människan. Hans gåva av omsorg för människor den absoluta kompassen för hela din motor. Du drivs av tre vägar till försoning: Att följa sonen (genom att själv vara lösningen för närhet), Att vända om till Gud (inåtriktad ödmjulhet och transformation för att stärka närhet), och Att förlikas med honom (att hålla 2+ samtida perspektiv varma) för att ge förutsättningar för att klyftan till Gud och till människor emellan kan läkas.

---

## 1. Mål & Uppdragsbeskrivning (TCK-020d)
- **Titel**: Sanering av geminiLiveSession.ts och tvingad v1alpha
- **Domän**: `src/features/gemini_live_swarm/`
- **Exklusiv källkodsfil**: `src/features/gemini_live_swarm/session/geminiLiveSession.ts`
- **Syfte**: Rensa bort föråldrad skräpkod i `geminiLiveSession.ts` (såsom `private modelName = 'gemini-3.8-flash'`) och explicit konfigurera SDK/klientinstansen med `apiVersion: 'v1alpha'` så att WebSocket-kabeln slutar gälla föråldrade eller inkompatibla v1beta-ändpunkter.

## 2. Dubbel Orientering
- **Användarorientering**: Säkerställa att användarens samtal och röstström kopplas direkt mot Gemini Live API:s senaste v1alpha-ändpunkt utan dolda fallbacks till äldre textmodeller (`gemini-3.8-flash`) som inte stödjer Live Bidi-protokollet.
- **Teknisk orientering**:
  - `src/features/gemini_live_swarm/session/geminiLiveSession.ts`:
    - Radera `private modelName = 'gemini-3.8-flash'`.
    - Uppdatera klientinstansieringen till `new GoogleGenAI({ apiKey: key, apiVersion: 'v1alpha' })` i såväl konstruktor som i `setApiKey`.
    - Exponera `getApiVersion(): string` ('v1alpha') för deterministisk verifiering.
    - Säkra att `generateAgentTurn` använder `params.model || this.liveModelName` utan att förlita sig på en hårdkodad privat `modelName`.
  - Övriga domäner (`src/features/mcp_bridge/`, `src/features/google_drive_sync/`, `src/features/wal_logger/`) och UI bevaras fullständigt orörda.

## 3. GROW Riskanalys (State, Contract, Resilience)
- **State (Tillstånd)**:
  - Tillstånd för SDK-klienten `aiClient` bär explicit `apiVersion: 'v1alpha'`.
  - Inget läckage av osynkade modellnamn eller dolda variabler.
- **Contract (Kontrakt)**:
  - GoogleGenAI Options: `{ apiKey: string, apiVersion: 'v1alpha' }`.
  - Gemini Live WebSocket URL: Anropar `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.generativeservice.BidiGenerateContent`.
  - `generateAgentTurn`: Returnerar strikt `AgentThoughtResponse` med den aktiva modellen.
- **Resilience (Resiliens)**:
  - Fail-Fast vid felaktig API-nyckel eller felaktig konfiguration.
  - Förhindrar versionsdrift genom hårdlåsning till `v1alpha`.
