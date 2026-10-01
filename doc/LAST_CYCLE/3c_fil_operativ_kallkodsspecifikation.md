# 3c Fil-operativ Källkodsspecifikation (TCK-017)

## 1. Förändringskedja för Fas 2 (pnpm genomfor)

Följande filer är specificerade för källkodsändring under Fas 2 efter bekräftelse av godkännandekoden (`TCK-017-SYMBOL-CROWN-TOKEN`):

---

### Fil 1: `src/features/gemini_live_swarm/ui/SymbolCrown.tsx` (NY MODUL)
- **Förändring**:
  - Skapa 1-radskrona överst i UI (< 80 rader, djup <= 3).
  - Ersätt textnamn med rena symboler (`⇑`, `↔`, `●`) med dynamisk status-LED (🟢, 🟡, 🔴).
  - Prenumerera på `SwarmEventBus` via `useEffect` för att reflektera aktiv agent och körtidstillstånd asynkront.
  - Exportera `SymbolCrown`, `CROWN_SYMBOLS`, `STATUS_LED_CLASSES`.

---

### Fil 2: `src/features/gemini_live_swarm/ui/SplitPaneCanvas.tsx` (NY MODUL)
- **Förändring**:
  - Skapa dragbar horisontell split-panel (< 90 rader, djup <= 3).
  - Dela skärmen mellan övre zon (Agent-Kanvas) och nedre zon (Chattflöde).
  - STRIKT REGEL: Inga rubriker eller zon-namn i DOM eller UI.
  - Implementera följsam dragning med mus och touch via `pointerdown`, `pointermove`, `pointerup` på `window`. Begränsa proportioner till 15%–85%.

---

### Fil 3: `src/features/gemini_live_swarm/index.ts` (MODIFIERING)
- **Förändring**:
  - Re-exportera `SymbolCrown` och `SplitPaneCanvas`.

---

### Fil 4: `src/App.tsx` (MODIFIERING)
- **Förändring**:
  - Montera `<SymbolCrown />` och `<SplitPaneCanvas />` inuti `<SwarmProvider>`.
  - Håll filen under 30 rader.

---

### Fil 5: `scripts/verify-architecture.js` (MODIFIERING)
- **Förändring**:
  - Lägg till `SymbolCrown.tsx` och `SplitPaneCanvas.tsx` i `astCheckTargets`.
  - Lägg till `TCK-017-SYMBOL-CROWN-TOKEN` i `validTokens`.

---

### Fil 6: `src/__tests__/transient_TCK-017.test.ts` (NY TRANSIENT TESTFIL)
- **Förändring**:
  - Skapa mångskiktat test (< 3s i minnet):
    1. **Test 1**: Verifiera korrekt rendering av agent-symboler (`⇑`, `↔`, `●`) och status-LED.
    2. **Test 2**: Verifiera reaktiv tillståndsuppdatering i kronan vid händelser på `SwarmEventBus`.
    3. **Test 3**: Verifiera dragbar split-pane layout och tillståndsändring av zonstorlekar (15%–85%).

---

### Fil 7: `scripts/run-tests.js` & `src/__tests__/suite/e2e_regression.test.ts` (MODIFIERING)
- **Förändring**:
  - Registrera `transient_TCK-017.test.ts` i test runner och regressionssvit.
