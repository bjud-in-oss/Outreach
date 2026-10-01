# Steg 1b: Kartlägga & Komponentinventering (TCK-018)

## 1. Inventering av Filer att Skapa och Modifiera

### Filer att Modifiera
1. `src/features/gemini_live_swarm/ui/crownStateHelper.ts`:
   - Uppdatera symbol för `ATT_VANDA_OM` till `⇐`.
   - Lägg till typer och kontrakt för utökad kron-telemetri och deluppgifter.
2. `src/features/gemini_live_swarm/ui/SymbolCrown.tsx`:
   - Avlägsna separat LED-cirkel. Låt själva agent-symbolen bära statusklassen (`text-emerald-400`, `text-amber-400`, `text-red-400`).
   - Gör kronan klickbar för att fälla ut statuspanelen.
3. `src/features/gemini_live_swarm/ui/SplitPaneCanvas.tsx`:
   - Lägg till grepplist med `[ ⇕ ]` och enkeltryck-snap (0% / 100% fullskärmschatt eller återställ).
   - Stöd för immersivt läge och integrering med User Activity Lock.
4. `src/App.tsx`:
   - Montera immersiv touch-overlay, bottenmeny med assistanstriggers och förmedla User Activity Lock.
5. `src/features/gemini_live_swarm/index.ts`:
   - Exportera nya komponenter och krokar.
6. `scripts/verify-architecture.js`:
   - Lägg till `TCK-018-IMMERSIVE-OVERLAY-TOKEN` och nya TSX-filer i `astCheckTargets`.

### Nya Moduler att Skapa
1. `src/features/gemini_live_swarm/ui/useUserActivityLock.ts`:
   - Hanterar 5s inaktivitetstimer och frysning av automatiska kanvas-ändringar.
2. `src/features/gemini_live_swarm/ui/ExecutionCard.tsx`:
   - Fällbara kort i chatten (`[ ⇑ Exekveringskort #XX ]`) med historik, filer och ändringsloggar.
3. `src/features/gemini_live_swarm/ui/TouchOverlayMenu.tsx`:
   - Flytande touch-overlay för bottenmeny och krona i immersivt läge (tonas bort efter 3s).
4. `src/__tests__/transient_TCK-018.test.ts`:
   - Transient mikro-E2E-svit (< 3s i minnet).
