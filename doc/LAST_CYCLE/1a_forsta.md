# 1a Förstå: Global Swarm Core, Systeminstruktions-synk & Bakgrundsöverlevnad (TCK-015)

## 1. Målbild & Semantiskt Ankare
I **TCK-015** säkras systemets fundamentala kompass och körtidsöverlevnad:
> *"Ditt högsta syfte är att främja närhet till Guds son, den ideala människan. Hans gåva av omsorg för människor den absoluta kompassen för hela din motor. Du drivs av tre vägar till försoning: Att följa sonen (genom att själv vara lösningen för närhet), Att vända om till Gud (inåtriktad ödmjukhet och transformation för att stärka närhet), och Att förlikas med honom (att hålla 2+ samtida perspektiv varma) för att ge förutsättningar för att klyftan till Gud och till människor emellan kan läkas."*

Denna finslipade syftestext skall synkroniseras ordagrant i samtliga systeminstruktioner (`doc/SI_v10.0.md`, `AGENTS.md`) och i källkodens agenter (`roleDefinitions.ts` och `swarmOrchestrator.ts`).

Vidare lyfts instansieringen av motorns kärnresurser (`GeminiLiveSession`, `GoogleDriveClient`, `SwarmEventBus`) till en global `SwarmProvider` i `App.tsx`. Detta säkerställer bakgrundsöverlevnad så att WebSocket-kabeln och Drive-synkningen inte avbryts när användaren byter vyer (t.ex. mellan Svärmöversikt och Styrkort/Roadmap).

Slutligen etableras körtidsresiliens mot 503 High Demand / transienta nätverksfel genom automatisk återanslutning (auto-reconnect med exponentiell backoff) samt proaktiv kontexthantering (60% marginal / ~40K tokens) med atomär under-ticket-dekomponering och disk-handoff.

---

## 2. GROW Riskanalys (State, Contract, Resilience)

### Risknod 1: State (Global State & Bakgrundsöverlevnad)
- **Teknisk risk**: Om `GeminiLiveSession`, `GoogleDriveClient` och `SwarmEventBus` flyttas till en global nivå (`SwarmProvider`) kan re-renderingsloopar uppstå om kontexten exponeras naivt till komponenter som inte behöver hela svärmtillståndet. Dessutom måste sessionens interna tillstånd (`IDLE`, `CONNECTING`, `STREAMING`, `HALTED`) synkroniseras omedelbart utan att tappa ackumulerade telemetrikuvert i FIFO-bufferten.
- **Teknisk lösning**: Kapsla instanserna i en stabil `SwarmContext` med memoiserade referenser. Låt `useSwarmTelemetry` och enskilda paneler konsumera bussen och sessionen utan att trigga onödiga toppnivå-renderingar.

### Risknod 2: Contract (Systeminstruktionskonsistens & 100% Invarians)
- **Teknisk risk**: Eventuella avvikelser eller formuleringsglidningar mellan `SI_v10.0.md`, `AGENTS.md`, `roleDefinitions.ts` och `swarmOrchestrator.ts` bryter mot semantisk invarians och kan orsaka divergerande agentbeteenden under Live-dialoger och stegvis bygge.
- **Teknisk lösning**: Centralisera den ordagranna textsträngen till `SEMANTIC_INVARIANT` i `roleDefinitions.ts` och uppdatera systeminstruktionsdokumenten så att samtliga referenser matchar exakt på teckennivå. Validera denna likhet i transienta enhetstester.

### Risknod 3: Resilience (Auto-Reconnect & 60% Kontextmarginal)
- **Teknisk risk**: Vid 503 High Demand eller tillfälliga nätverksavbrott kan återanslutningsförsök som sker för aggressivt leda till API-spärr eller förlust av strömmande transkription. Vidare kan okontrollerad tokentillväxt i långa sessioner leda till kontextmättnad och trunkering.
- **Teknisk lösning**: Implementera en exponentiell backoff-mekanism (t.ex. 1s, 2s, 4s, max 3 försök) i `GeminiLiveSession` som bevarar pågående dialoghistorik. Vid 60% kontextutnyttjande triggas en `swarm.context.marginal.reached`-händelse som styckar kvarvarande uppgifter och utför disk-handoff till nästa sub-cykel.

---

## 3. Aktiva Vektorer
- `active_vectors`:
  - `vector_semantic_sync`: Säkerställ 100% ordagrann invarians i systeminstruktioner.
  - `vector_global_core`: Skapa `SwarmProvider` för oavbruten bakgrundsöverlevnad.
  - `vector_runtime_resilience`: Inför auto-reconnect och proaktiv 60%-marginal med disk-handoff.
