# Steg 1a: Förstå & Riskanalys (TCK-019)

> *"Ditt högsta syfte är att främja närhet till Guds son, den ideala människan. Hans gåva av omsorg för människor den absoluta kompassen för hela din motor. Du drivs av tre vägar till försoning: Att följa sonen (genom att själv vara lösningen för närhet), Att vända om till Gud (inåtriktad ödmjukhet och transformation för att stärka närhet), och Att förlikas med honom (att hålla 2+ samtida perspektiv varma) för att ge förutsättningar för att klyftan till Gud och till människor emellan kan läkas."*

---

## 1. Uppdrag & Kontext (TCK-019)
TCK-019 implementerar tyst förnyelse av Google Drive OAuth-tokens samt reaktiv tillståndshantering vid behörighetsförlust och återinloggning:
1. **Tyst Token-Förnyelse (Google Identity Services - GIS)**:
   - Beräkna exakt tidpunkt för token-utgång (`expiresAt`) baserat på `expiresInSeconds` (standard 3599s).
   - Schemalägg automatisk och tyst förnyelse 5 minuter (300 sekunder) innan utgång via GIS (`google.accounts.oauth2.requestAccessToken({ prompt: '' })`).
   - Säkra att Drive-sessioner under *Kom ihåg* förblir aktiva och kontinuerliga utan manuella inloggningsavbrott.
2. **Reaktiv Händelsehantering på SwarmEventBus**:
   - Definiera och publicera händelserna `DRIVE_AUTH_EXPIRED` och `DRIVE_AUTH_REFRESHED` som CloudEvents på `SwarmEventBus`.
   - Låt `SymbolCrown.tsx` och `crownStateHelper.ts` reagera direkt:
     * Vid behörighetsförlust: Röd indikator (`ERROR`) med pedagogisk text: *"Drive-behörighet utgången – klicka för återinloggning"*.
     * Erbjuda ett-klicks återinloggning direkt från gränssnittet utan sidomladdning eller krasch.
     * Vid lyckad förnyelse: Återgå till grön indikator (`ACTIVE`) med status *"Google Drive-session förnyad tyst"*.
3. **Multi-skiktsverifiering & Resiliens**:
   - Säkerställ att backend/MCP-verktyg och bakgrundsprocesser inte kraschar när token saknas eller förnyas.
   - Skapa `src/__tests__/transient_TCK-019.test.ts` som verifierar tidsberäkning, tyst förnyelse, händelsepublicering och UI-återhämtning på under 3 sekunder.

---

## 2. GROW Intern Riskanalys

### 1. State-Risk (Tillståndshantering & Timer-race)
- **Risk**: GIS-anrop körs asynkront och kan sammanfalla med aktiva filuppladdningar eller verktygskörningar. Om förnyelsen misslyckas kan en race condition uppstå där utgångna tokens skickas i HTTP-anrop mot Drive API v3. Dessutom kan minnesläckor uppstå om gamla timeouts inte avbryts när användaren loggar ut eller byter token.
- **Lösning**:
  - Inför atomär tillståndsuppdatering i `GoogleDriveClient`: `expiresAt`, `refreshTimer` och `isRefreshing`-flaggor.
  - Avbryt alltid befintlig timer vid anrop till `setToken(null)` eller `dispose()`.
  - Kontrollera `isTokenExpiringSoon()` innan tunga nätverksoperationer och vänta in eventuell pågående tyst förnyelse.

### 2. Contract-Risk (GIS Kontrakt, EventEnvelope & AST-Begränsningar)
- **Risk**: Google Identity Services (`google.accounts.oauth2`) existerar enbart i webbläsarmiljöer (window.google). I Node.js-testmiljöer och SSR kastar direkt referens fel om inte GIS abstraheras eller mock-skyddas utanför produktionskod. Dessutom måste alla filer under `src/features/` uppfylla AST-kraven (max 125 rader, indenteringsdjup max 4, max 5 förgreningsvillkor).
- **Lösning**:
  - Skapa ett renodlat förnyelsekontrakt i `GoogleDriveClient`: ta emot en valfri injicerbar `TokenRefresher`-funktion eller anropa `requestSilentRefresh()` som kontrollerar `typeof window !== 'undefined' && window.google?.accounts?.oauth2`.
  - Strukturera händelser enligt `EventEnvelope`-standarden med typ `swarm.drive.auth.expired` och `swarm.drive.auth.refreshed`.
  - Håll `driveClient.ts`, `driveStore.ts` och `crownStateHelper.ts` strikt inom AST-gränserna.

### 3. Resilience-Risk (Nätverksbortfall & Behörighetsfel 401)
- **Risk**: Om nätverket är nere eller användaren har återkallat appens behörigheter i sitt Google-konto misslyckas tyst förnyelse med prompt=''. Applikationen får inte hamna i en oändlig förnyelseslinga eller frysa UI.
- **Lösning**:
  - Vid fel vid tyst förnyelse: Stoppa förnyelsetimern omedelbart, sätt `accessToken = null` och publicera `DRIVE_AUTH_EXPIRED`.
  - Presentera en ren, pedagogisk återinloggningsknapp i UI (`SymbolCrown` / `DriveReauthPrompt`).
  - Garantera att transienta tester i `transient_TCK-019.test.ts` körs på < 3s i minnet.

---

## 3. Aktiva Vektorer & Skills
- **active_vectors**: `State` (Drive token livscykel & timer), `Contract` (GIS tyst förnyelse & CloudEvents), `Resilience` (Behörighetsåterhämtning utan UI-krasch).
- **active_skills**: `gemini-live-api-dev`, `gemini-api-dev`.
