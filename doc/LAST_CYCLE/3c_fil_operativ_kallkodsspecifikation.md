# 3c Fil-operativ Källkodsspecifikation (TCK-018)

## 1. Förändringskedja för Fas 2 (pnpm genomfor)

Följande filer är specificerade för källkodsändring under Fas 2 efter bekräftelse av godkännandekoden (`TCK-018-IMMERSIVE-OVERLAY-TOKEN`):

---

### Fil 1: `src/features/gemini_live_swarm/ui/crownStateHelper.ts` (MODIFIERING)
- **Förändring**:
  - Uppdatera symbol för `ATT_VANDA_OM` till `⇐` med bibehållen bakåtkompatibilitet för `↔`.
  - Definiera typer för kronans expanderade detaljvy.

---

### Fil 2: `src/features/gemini_live_swarm/ui/SymbolCrown.tsx` (MODIFIERING)
- **Förändring**:
  - Avlägsna separat LED-cirkel (`<span data-testid="crown-status-led" />`).
  - Låt själva agent-symbolen bära statusklassen (`STATUS_LED_CLASSES[state.color]`).
  - Gör komponenten tryckbar med fällbar detaljvy (`isExpanded`).

---

### Fil 3: `src/features/gemini_live_swarm/ui/SplitPaneCanvas.tsx` (MODIFIERING)
- **Förändring**:
  - Lägg till grepplisten med ikon `[ ⇕ ]` och klick-hanterare för snabbväxling till 100% fullskärmschatt (0% övre zon).
  - Utöka spannet till 0%–100% med magnetisk snap vid ytterlägena.
  - Håll filen under 125 rader och förgrening <= 5.

---

### Fil 4: `src/features/gemini_live_swarm/ui/useUserActivityLock.ts` (NY MODUL)
- **Förändring**:
  - Hook som sätter `isLocked = true` och schemalägger automatisk upplåsning efter 5 sekunder inaktivitet.
  - Exportera `useUserActivityLock`.

---

### Fil 5: `src/features/gemini_live_swarm/ui/ExecutionCard.tsx` (NY MODUL)
- **Förändring**:
  - Fällbart kort i chattflödet (`[ ⇑ Exekveringskort #XX ]`) med historik, skapade filer och ändringsöversikt (< 90 rader, djup <= 3).

---

### Fil 6: `src/features/gemini_live_swarm/ui/TouchOverlayMenu.tsx` (NY MODUL)
- **Förändring**:
  - Flytande touch-overlay som visar krona och bottenmeny i immersivt läge och tonas bort efter 3 sekunder.

---

### Fil 7: `src/App.tsx` (MODIFIERING)
- **Förändring**:
  - Integrera immersivt läge, touch-overlay, User Activity Lock och bottenmeny med triggers (`[🎬 Reflektera]`, `[🧠 Kom ihåg]`, `[💬 Rådgör]`).
  - Håll filen under 35 rader.

---

### Fil 8: `src/features/gemini_live_swarm/index.ts` (MODIFIERING)
- **Förändring**:
  - Re-exportera `ExecutionCard`, `useUserActivityLock`, `TouchOverlayMenu`.

---

### Fil 9: `scripts/verify-architecture.js` (MODIFIERING)
- **Förändring**:
  - Lägg till nya TSX-filer i `astCheckTargets`.
  - Lägg till `TCK-018-IMMERSIVE-OVERLAY-TOKEN` i `validTokens`.

---

### Fil 10: `src/__tests__/transient_TCK-018.test.ts` (NY TRANSIENT TESTFIL)
- **Förändring**:
  - Skapa mångskiktat test (< 3s i minnet):
    1. **Test 1**: Verifiera symbol-kronans integrerade färgsättning och expansion (`⇑`, `⇐`, `●`).
    2. **Test 2**: Verifiera snap till 100% fullskärmschatt och immersiv touch-overlay (3s timer).
    3. **Test 3**: Verifiera User Activity Lock (5s inaktivitetstimer).
    4. **Test 4**: Verifiera rendering och fällbarhet av exekveringskort i chatten.

---

### Fil 11: `scripts/run-tests.js` & `src/__tests__/suite/e2e_regression.test.ts` (MODIFIERING)
- **Förändring**:
  - Registrera `transient_TCK-018.test.ts` i test runner och regressionssvit.
