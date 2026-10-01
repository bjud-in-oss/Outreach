# Steg 2a: Avgränsa & Systemkontrakt (TCK-017)

## 1. Vad som SKA implementeras i TCK-017
- **Yteffektiv Symbol-Krona (`SymbolCrown.tsx`)**:
  - Exakt 1 rad låst högst upp i viewporten.
  - Ersätt textnamn med rena symboler (`⇑`, `↔`, `●`) kopplade till de 3 försoningsvägarna.
  - Dynamiska statusfärger/LED: 🟢 (Aktiv), 🟡 (Återansluter/Tänker), 🔴 (Avbruten/Fel).
  - Lyssna på `SwarmEventBus` för reaktiv uppdatering.
- **Justerbart Split-Pane Kanvas (`SplitPaneCanvas.tsx`)**:
  - Dragbar horisontell avgränsare (split-bar) med mus- och touch-stöd.
  - Två zoner med variabel höjdfördelning (övre zon och nedre zon).
  - STRIKT REGEL: Inga rubriker, inga etiketter ("Övre zon", "Kanvas", "Chatt") – zonerna innehåller direkt sina respektive element.
- **Uppdatering av `App.tsx`**:
  - Integrera `SymbolCrown` och `SplitPaneCanvas` med bibehållen strikt radgräns (< 30 rader).
- **Transient testsvit (`transient_TCK-017.test.ts`)**:
  - Tre mångskiktade tester som verifierar symboler, eventbusssynk och dragfunktion.

## 2. Vad som INTE ska implementeras i TCK-017 (Avgränsningar)
- Implementera INTE User Activity Lock eller 5s inaktivitetstimer (detta tillhör TCK-018).
- Implementera INTE de agentassisterade handlingstriggers-knapparna (`[🎬 Reflektera]`, `[🧠 Kom ihåg]`, `[💬 Rådgör]`) eller fällbara handlingschips i chatten (detta tillhör TCK-018).
- Rör INTE backend/domänkärnan i `swarmOrchestrator.ts`, `roleDefinitions.ts`, `geminiLiveSession.ts`, `walEngine.ts` eller `driveClient.ts`.
