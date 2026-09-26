# AKTUELL BRIEF: SI v10.0-anpassning och 4:e Seriell Motor

1. Wayfinder-installation & README:
   - Kör `npx skills@latest add mattpocock/skills --skill=wayfinder`
   - Uppdatera `README.md` med pnpm/wayfinder-instruktioner samt `/wayfinder`-flöde.

2. Standardisering av Domänbeslut (`DECISIONS.md`):
   - Konsolidera och döp om alla lokala moduldokument under `src/features/[modul]/doc/` till `DECISIONS.md`.
   - Logga övergripande systembeslut i `doc/DECISIONS.md`.

3. Agentkrafter & 4:e Seriell Motor i `gemini_live_swarm`:
   - Mappa om `roleDefinitions.ts`, `telemetrySchema.ts` och `swarmEventBus.ts` under `src/features/gemini_live_swarm/` till krafterna `ATT_FORLIKAS`, `ATT_FOLJA`, `ATT_VANDA_OM` samt tillägget `SERIELL_MOTOR`.

4. UI & Dashboard:
   - Uppdatera `SwarmDashboard.tsx`, `TelemetrySidebar.tsx` och `MasterDevelopmentPlan.tsx` för övervakning och jämförelse av `SERIELL_MOTOR`.

5. Verifiering:
   - Kör `pnpm test` och `pnpm verify`.