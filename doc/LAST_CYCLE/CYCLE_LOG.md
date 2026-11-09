# BYGGCYKEL LOGG: TCK-MAINT-017
**Starttid:** 2026-11-09T05:19:39.937Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
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

```


#### 1a Att följa: Intention & Nytta
Givet att jag har initierat TCK-MAINT-017, när jag uppdaterar 'scripts/run-planera-live.ts' för att avvisa tester med 'TypeError' eller 'ReferenceError', och lägger till BENCHMARK.json generering vid lyckade cykler, samt skapar saknade Zod-scheman i 'pathSchema.ts', så uppnår vi en robust infrastruktur och kontraktstillförlitlighet för Vägmotorn.


#### 0a Att vända om: Kontraktsaudit
Granskningen är genomförd. TCK-MAINT-017 berör endast en FSD-domän (källkod under `src/features/path`), och alla verktyg och API-skills finns tillgängliga. Vi kan nu gå vidare till avsiktsgrinden.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
För att lösa TCK-MAINT-017 och möta kraven formulerar jag här tre ortogonala alternativ:

Alternativ 1 innebär direkt integrering och procedurell parsning i skripten. Vi använder reguljära uttryck för att skanna terminalutdatan i `run-planera-live.ts` och lägger till enkla AST-kontroller via `ts.js`. Zod-schemana definieras direkt i `pathSchema.ts`.

Alternativ 2 satsar på en dedikerad kontrollmekanism för testströmmen och djupare AST-analys. Här implementeras en separat klass för att fånga upp körtidskrascher med full stacktrace, och en fullständig AST-traversering används i `ts.js` för att säkerställa att port-fabriker inte används felaktigt.

Alternativ 3 bygger på strict runtime-isolering och explicit schemabyggnad. Testmiljön i sig kastar fel om förbjudna mönster upptäcks, medan mätprofildata hanteras via anpassade hookar i Vitest. Zod-schemana specificeras med full typinferens och dokumenteras separat.


#### 2c Att vända om: Resiliensgranskning
Resiliensgranskningen visar att Alternativ 2 erbjuder den högsta driftsäkerheten genom djupare AST-analys och en dedikerad mekanism för att fånga krascher. Denna lösning minimerar risken för dolda fel och undviker att förlita sig på spröda textmatchningar.


#### 2d Att förlikas: Mättnad
Vi väljer Alternativ 2. Vår resiliensgranskning bekräftar att detta alternativ ger högst driftsäkerhet genom den djupare AST-analysen och det dedikerade kraschskyddet. MÄTTNAD: JA.
