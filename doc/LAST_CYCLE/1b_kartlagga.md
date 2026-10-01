# Steg 1b: Kartlägga & Komponentstruktur (TCK-017)

## 1. Nya Komponenter under `src/features/gemini_live_swarm/ui/`
1. `src/features/gemini_live_swarm/ui/SymbolCrown.tsx`:
   - 1-radskrona överst i gränssnittet (`h-9 px-3 flex items-center justify-between bg-slate-950 border-b border-slate-800 text-xs font-mono`).
   - Visar aktiv agentsymbol med motsvarande statusfärg:
     - `⇑` för Att följa (blå/cyan eller grön beroende på status)
     - `↔` för Att vända om (bärnsten/röd eller grön beroende på status)
     - `●` för Att förlikas (grön)
     - Status-LED färgkod: `🟢` (Aktiv), `🟡` (Återansluter/Tänker), `🔴` (Avbruten/Fel).
     - Format: `[Symbol-LED] [Kort Status/Aktivitet]` i en enda ren rad utan pill-badges.
2. `src/features/gemini_live_swarm/ui/SplitPaneCanvas.tsx`:
   - Horisontell delare (`h-1.5 cursor-row-resize bg-slate-900 hover:bg-slate-700 active:bg-purple-600 transition-colors`).
   - Övre zon: Direkt visning av teater/dokument/genererat innehåll (inga rubriker!).
   - Nedre zon: Direkt visning av chattflöde och handlingschips (inga rubriker!).
   - Flexibelt proportionellt tillstånd (`splitRatio = 50%`, min 15%, max 85%).
3. `src/App.tsx`:
   - Montera `<SymbolCrown />` och `<SplitPaneCanvas />` inuti `<SwarmProvider>`.
   - Håll filen under 30 rader.

## 2. Re-Exports och Kontrakt
- Exportera `SymbolCrown` och `SplitPaneCanvas` från `src/features/gemini_live_swarm/index.ts`.
- Uppdatera `astCheckTargets` i `scripts/verify-architecture.js` med de nya komponenterna.

## 3. Transienta Tester
- `src/__tests__/transient_TCK-017.test.ts`:
  - Test 1: Korrekt rendering av agent-symboler (⇑, ↔, ●) och status-LED.
  - Test 2: Tillståndsuppdatering i kronan vid händelser på SwarmEventBus.
  - Test 3: Dragbar Split-Pane-layout och tillståndsändring av zonstorlekar.
- Konsolidera i `scripts/run-tests.js` och `src/__tests__/suite/e2e_regression.test.ts`.
