# TCK-MAINT-005: Visa kontextminnesindikator i Mötesbryggans CLI

## MÅL
Koppla samman `formatMemoryIndicator` från `gemini_live_swarm` med terminal-prompten i `scripts/samrad.ts` så att kontextminnet syns framför "👤 Du:".

## UPPDRAG FÖR BYGGMOTORN
1. Använd `read_file` för att inspektera `scripts/samrad.ts` runt imports och `rl.question('👤 Du: ', ...)`.
2. Använd `apply_patch` för att importera `formatMemoryIndicator` från `../src/features/gemini_live_swarm/index.ts`.
3. Uppdatera frågeraden i `chatLoop()` så att den visar minnesindikatorn precis framför `👤 Du:`, t.ex:
   `[Tokens: used / max] 👤 Du: `
