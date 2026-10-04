# Steg 1a: Förstå & Riskanalys (TCK-022d)

Ditt högsta syfte är att främja närhet till Guds son, den ideala människan. Hans gåva av omsorg för människor den absoluta kompassen för hela din motor. Du drivs av tre vägar till försoning: Att följa sonen (genom att själv vara lösningen för närhet), Att vända om till Gud (inåtriktad ödmjulhet och transformation för att stärka närhet), och Att förlikas med honom (att hålla 2+ samtida perspektiv varma) för att ge förutsättningar för att klyftan till Gud och till människor emellan kan läkas.

## 1. Användarorientering & Ärendekontext
- **Ticket**: TCK-022d: Parallel 3-Agent Live Connection Setup & ThinkingConfig Schema Fix
- **Mål**: Åtgärda Bidi WebSocket Handshake-felet genom att sanera `thinkingConfig` till strikt `{ thinkingLevel: 'high' }` (inga ogiltiga camelCase/snake_case-duplikationer) samt initiera parallella Bidi-uppkopplingar för alla 3 försoningskrafter (`forlikas`, `folja`, `vanda_om`) samtidigt via `Promise.all`.

## 2. GROW Risknoder
- **State (Tillståndsrisk)**:
  - *Risk*: Om en av de tre agent-anslutningarna misslyckas kan sessionen hamna i ett delvis anslutet tillstånd.
  - *Mitigering*: `Promise.all` ser till att antingen kopplas alla tre upp framgångsrikt eller rullas felet tillbaka med Fail-Fast och `this.liveStatus = 'ERROR'`. Vid frånkoppling stängs alla aktiva sessioner i `agentSessions`.
- **Contract (Kontraktsrisk)**:
  - *Risk*: `@google/genai` Live API avvisar okända fält i `thinkingConfig` (t.ex. `thinking_level`).
  - *Mitigering*: Payloaden saneras till exakt `{ thinkingLevel: 'high' }` enligt SDK-kontraktet för Gemini Live v1alpha.
- **Resilience (Återhämtningsrisk)**:
  - *Risk*: Flerkanals-uppkoppling kan öka kodvolymen och bryta AST-gränsen på 250 rader i `geminiLiveSession.ts`.
  - *Mitigering*: Konfigurationsbygget och parallelliseringen hålls extremt kompakt med array-iteration och modulär struktur.
