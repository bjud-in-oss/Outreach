# TCK-MAINT-017: Infrastruktur-rest och Zod-kontrakt för Vägmotorn

## 1. MÅL
Åtgärda den resterande infrastrukturskulden inför TCK-041. Bygg in skydd mot dolda testkrascher i Fail-First, slutför Zod-valideringen för alla Vägportar och formalisera profilmätningen för framtida jämförelser av 4-ports vs 12-stegsreceptet.

## 2. KÄLLKODSSPECIFIKATION
1. scripts/run-planera-live.ts:
   - Leta upp "Gate 3a Fail-First". Läs ut hela stderr/stdout från vitest-körningen. Om terminalutskriften innehåller 'TypeError:' eller 'ReferenceError:' måste testet omedelbart underkännas, även om processen kraschar med kod 1 (Testet har dolda fel i sin egen kod).
   - I slutet av filen (vid lyckad körning om !isMaint): Skriv en automatisk mätprofil till doc/LAST_CYCLE/BENCHMARK.json med formatet { "ticket": ticketId, "durationMs": <tiden från scriptstart till hit>, "timestamp": <ISO-datum> }.
2. scripts/drivers/ts.js (Kontraktsspeglare):
   - För Gate 3a (check-alibi): Inför en regel som varnar eller kastar fel om testet anropar interna port-fabriker (som t.ex. skapaAvsiktsport) om inte port-fabriken specifikt testas. För exekverings-tester ska anonyma funktioner (lambdas) användas för dependencies.
3. src/features/path/contracts/pathSchema.ts (Zod-Scheman):
   - Skapa och exportera de saknade schemana:
     * ProvningsportOptionsSchema
     * KonstruktionsportOptionsSchema
     * BesiktningsportOptionsSchema
     * ClassicReceptOptionsSchema
     * LeanReceptOptionsSchema

## 3. ACCEPTANSKRITERIER
1. Gate 3a Fail-First blockerar trasiga tester (TypeScript-fel) istället för att bara kräva exit-kod 1.
2. BENCHMARK.json skapas vid lyckade cykler.
3. Alla options i Vägmotorn har Zod-validering.
4. pnpm verify är 100 % grön.
