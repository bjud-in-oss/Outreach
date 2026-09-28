# 2b Modellera: AST-Miljöspärr mot Mockar, Autonom Handoff & Max 3 Agenter-kapacitet (TCK-013)

## 1. AST-Miljöspärrsmodell & Fail-Fast

### 1.1 Regler och Matchningsmönster i `scripts/drivers/ts.js`
- **Målkatalog**: Alla `.ts`- och `.tsx`-filer under `src/features/`.
- **Förbjudna mönster**:
  * `isTestMode\s*=\s*true` eller `isTestMode` som flagga för att undvika skarpa anrop i produktionsmoduler.
  * Metoder och anrop som `generateDeterministicFallback`.
  * Fejkade mock-strängar som `mock-folder-` eller `mock-file-` i returvärden.
  * Tysta `catch`-block som sväljer fel och returnerar syntetisk data istället för att propagera felet till användaren.
- **Fail-Fast Reaktion**:
  * `GeminiLiveSession`: Sätter tillståndet omedelbart till `HALTED` vid instansiering om `GEMINI_API_KEY` saknas. Publicerar CloudEvents-händelsen `swarm.live.session.halted` med felbeskrivning. Vid försök till textgenerering eller strömning kastas ett explicit `MissingApiKeyError`.
  * `GoogleDriveClient`: Känner av avsaknad av access-token, sätter status till `UNAUTHENTICATED`, och kastar `MissingDriveAuthError` istället för att returnera mockade mappar eller filer.

---

## 2. Kapacitetsspärrsmodell (Max 3 Agenter)

```
                    ┌──────────────────────────────────────────────┐
                    │ Svärmkapacitet: MAX_CONCURRENT_AGENTS = 3    │
                    └──────────────────────┬───────────────────────┘
                                           │
         ┌─────────────────────────────────┴─────────────────────────────────┐
         ▼                                                                   ▼
┌─────────────────────────────────────────┐               ┌─────────────────────────────────────────┐
│ Läge 1: Samråd & Live-dialog            │               │ Läge 2: Bygga-agent (SERIELL MOTOR)     │
│ Aktiva enheter (Exakt 3 st):            │               │ Aktiva enheter (Exakt 1 st):            │
│ 1. Att följa Guds son                   │   Handoff     │ 4. Att tjäna Gud och andra: Bygga       │
│ 2. Att vända om till Gud                │ ────────────► │                                         │
│ 3. Att förlikas med Gud                 │               │ (Live-agenterna pausas för determinism) │
└─────────────────────────────────────────┘               └────────────────────┬────────────────────┘
         ▲                                                                     │
         │                Återaktivering för Konsensus vid 3c                  │
         └─────────────────────────────────────────────────────────────────────┘
```

- **Invarians**: Vid inget tillfälle får antalet aktiva agenter (`status === 'THINKING' || status === 'RUNNING'`) överskrida 3.
- **Orkestreringsregler**:
  * I samrådsläget körs de tre Live-agenterna (`ATT_FOLJA`, `ATT_VANDA_OM`, `ATT_FORLIKAS`).
  * När ett kodbehov identifieras triggas `swarm.handoff.to_builder`. Live-agenterna pausas (`isPaused: true`), och `SERIELL_MOTOR` startas som ensam exekverande agent.
  * När `SERIELL_MOTOR` når Token Gate vid Steg 3c pausas den (`stageStatus = 'GATED'`), och Live-agenterna återaktiveras för konsensusgranskning.

---

## 3. Autonom Handoff & Fasstegningsmodell

### 3.1 Eventdrivet Flöde
1. **Signal om kodbehov**:
   - Live-agent publicerar `swarm.handoff.to_builder` med kontext och målsättning.
2. **Autonom fascykel i SERIELL_MOTOR**:
   - `SERIELL_MOTOR` lyssnar på `swarm.handoff.to_builder` och startar Fas 1.
   - Stegar automatiskt sekventiellt via interna timers/händelser på `SwarmEventBus`:
     * `1a_forsta` -> `swarm.serial.stage.transition`
     * `1b_kartlagga` -> `swarm.serial.stage.transition`
     * `2a_avgransa` -> `swarm.serial.stage.transition`
     * `2b_modellera` -> `swarm.serial.stage.transition`
     * `2e_syntetisera` -> `swarm.serial.stage.transition`
     * `3c_spec` -> `swarm.serial.gate.evaluated` (`isTokenGated: true`, `stageStatus: 'GATED'`)
3. **Reaktiv Konsensusgranskning vid Token Gate (3c)**:
   - Vid `3c_spec` publiceras `swarm.consensus.requested`.
   - Live-agenterna utför granskning (Följa: närhet och användarnytta, Vända om: fail-fast och etik, Förlika: perspektivharmoni).
   - När konsensus uppnåtts publiceras `swarm.consensus.completed`.
   - Motorn stannar och väntar på produktägarens `REQUIRED_TOKEN`.

---

## 4. UI-namnharmonisering & Diagnostikmodell

1. **Dynamisk Namnuppslagning**:
   - Samtliga UI-komponenter (`TelemetrySidebar.tsx`, `SwarmDashboard.tsx`, `SwarmHeader.tsx`, `SwarmUnitCard.tsx`) hämtar enhetens namn direkt via `RECONCILIATION_UNITS[force].displayName`.
   - Den 4:e enheten visas konsekvent som: **"Att tjäna Gud och andra: Bygga"**.
2. **Pedagogisk Diagnostikpanel**:
   - Om `liveStatus === 'HALTED'` eller Google Drive är `UNAUTHENTICATED` visas en amber-färgad varningspanel i UI med instruktion:
     `"Varning: Giltig GEMINI_API_KEY saknas i miljön. Gå till Settings > Secrets i AI Studio för att bifoga din nyckel. Produktionsmockar är avstängda enligt Fail-Fast-arkitekturen."`
