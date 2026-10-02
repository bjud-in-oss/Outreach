# Steg 2e: Syntetisera & Verifiering av Mättnad (TCK-019)

## 1. Målkonfliktanalys & Syntes

### Målkonflikt 1: GIS i Webbläsare vs Node.js & E2E-Testmiljö
- **Konflikt**: Google Identity Services (`window.google.accounts.oauth2`) existerar uteslutande i webbläsarkontexten. Direkta anrop kastar fel i transienta minnestester (`npm test`), medan rena mockar är förbjudna i produktionskod enligt miljöspärren (ADR-SWARM-011).
- **Syntes**: `GoogleDriveClient` implementerar en valbar injicerbar `TokenRefresher`-funktion vid sidan av den skarpa webbläsarkontrollen (`typeof window !== 'undefined' && window.google?.accounts?.oauth2`). Detta tillåter skarp testning av livscykel, timers och CloudEvents utan att mocka bort produktionsarkitekturen eller bryta SSR/Node-kompatibilitet.

### Målkonflikt 2: Bakgrunds-Timers vs Minnesläckor & React Lifecycle
- **Konflikt**: Om schemalagd förnyelse sätts på långa tidsintervall (t.ex. 55 minuter framåt) kan hängande timeouts förhindra ren nedstängning eller ackumulera oönskade processer vid omstarter i `SwarmProvider`.
- **Syntes**: Strikt timer-livscykel. Varje ny token-tilldelning (`setToken`) avbryter föregående timer deterministiskt. En explicit `dispose()`-metod garanterar fullständig uppstädning.

### Målkonflikt 3: Larmtrötthet vs Reaktiv Säkerhet i Gränssnittet
- **Konflikt**: Tillfälliga nätverksbortfall vid tyst förnyelse får inte låsa användaren i ett oåterkalleligt feltillstånd eller avbryta pågående röstinteraktion i Gemini Live.
- **Syntes**: Vid utgång eller förnyelsefel sätts kronans status till `ERROR` med en pedagogisk text och en tydlig ett-klicksknapp för återinloggning (`[ ↺ Återanslut Google Drive ]`). Röst- och textchatt fortsätter fungera oavbrutet, och när användaren godkänner återinloggningen återhämtar sig Drive-klienten direkt och sänder `DRIVE_AUTH_REFRESHED`.

---

## 2. Kriterier för Mättnad
- Alla tre risknoder från GROW (State, Contract, Resilience) är fullständigt adresserade med konkreta arkitekturmönster.
- Inga regressioner i befintliga 94 tester eller källkodsspärrar.
- Kontraktet för `DRIVE_AUTH_EXPIRED` och `DRIVE_AUTH_REFRESHED` är definierat och synkroniserat med `SwarmEventBus` och `SymbolCrown`.

MÄTTNAD: JA
