# BYGGCYKEL LOGG: TCK-055
**Starttid:** 2026-11-13T21:14:33.106Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-055: Exempelskördning av swarm_telemetry.legacy.ts och gemini_swarm.legacy.ts (ADR-030)

**Måldomän:** `gemini_live_swarm` (`src/features/gemini_live_swarm/`)
**Målfiler:** `src/features/gemini_live_swarm/bus/swarmEventBus.ts`, `src/features/gemini_live_swarm/coordinator/swarmOrchestrator.ts`
**Skördad Legacy:** `src/__tests__/swarm_telemetry.legacy.ts`, `src/__tests__/gemini_swarm.legacy.ts`
**Mekanisk Acceptans:** Ett hermetiskt Vitest-test (konsoliderat till `src/features/gemini_live_swarm/__tests__/`) verifierar samtliga 8 scenarier från `src/__tests__/swarm_telemetry.legacy.ts` och `src/__tests__/gemini_swarm.legacy.ts` (`SwarmEventBus` wildcard-prenumeration, `unsubscribe`, FIFO-ringbuffert, Zod `SwarmTelemetrySnapshotSchema`/`DevelopmentTicketSchema`, `RECONCILIATION_UNITS` samt `SwarmOrchestrator.getAllUnits()`/`createCampaignPlan()`), varefter Fas 3 raderar de skördade legacy-filerna och `pnpm verify` passerar med exit 0.

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **Läs båda legacy-filerna innan testgenerering:**
   - Läs `src/__tests__/swarm_telemetry.legacy.ts` och `src/__tests__/gemini_swarm.legacy.ts` i Steg 3a och översätt samtliga 8 assertions till standard Vitest `describe`/`it`/`expect` utan `vi.fn()`-spioner.
2. **FSD-isolering och radgränser:**
   - Importera uteslutande från `../bus/swarmEventBus`, `../coordinator/swarmOrchestrator`, `../agents/roleDefinitions`, `../telemetry/telemetrySchema` och `../../../shared/contracts/envelope`.

---

## Scenariotriad (Den relationella och systemiska avsikten)

**Scenario: ATT FÖLJA – Historisk testkunskap blir levande regressionsskydd**
  Givet att `swarm_telemetry.legacy.ts` och `gemini_swarm.legacy.ts` innehåller 8 verifierade kärnscenarier
  När de skördas in i `src/features/gemini_live_swarm/__tests__/`
  Så körs de automatiskt i varje Fas 2-validering och `pnpm verify`
  Och legacy-filerna städas bort automatiskt i Fas 3.

**Scenario: ATT VÄNDA OM – Avvisande av passiv, okörd testkod**
  Givet att `*.legacy.ts` exkluderas av Vitest
  När scenarierna flyttas till aktiva Vitest-sviter
  Så upptäcks eventuella brott i `SwarmEventBus` eller `SwarmOrchestrator` omedelbart.

**Scenario: ATT FÖRLIKAS – Renare testkatalog och grön verifiering**
  Givet att de skördade testerna passerar och de två legacy-filerna är borttagna
  När `pnpm verify` körs
  Så passerar hela sviten med exit 0.

```


#### 1a Att följa: Intention & Nytta
Vi vill säkra systemets framtid genom att väcka liv i historisk testkunskap. Genom att skörda de gamla testerna från `swarm_telemetry` och `gemini_swarm` och integrera dem i vår aktiva struktur, bygger vi ett starkare regressionsskydd och kan städa bort gammal testkod som inte längre används. Det skapar mer ordning och högre tillförlitlighet för hela systemet.


#### 0a Att vända om: Kontraktsaudit
Kontraktsaudit genomförd. Uppdraget omfattar exakt en FSD-domän: `gemini_live_swarm`. Destruktiv sanering av legacy-filerna i Fas 3 är konsekvent deklarerad. Vi rör oss framåt mot grön verifiering.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
De tre ortogonala alternativen för att skörda och integrera legacy-testerna är:

1. Enhetlig konsolidering i en enda ny testfil, vilket ger full överblick men skapar en större fil. 

2. Domänspecifik uppdelning, där testerna för händelsebuss respektive orkestreringsmodellen isoleras i egna filer för tydligare felisolering.

3. Fabriksbaserad datainjicering, där man bygger modulära test-helpers eller fabriker för att testa Zod-scheman och datakontrakt oberoende av händelselogiken.


#### 2c Att vända om: Resiliensgranskning
Alternativ ett skapar en risk för en monolitisk testfil som döljer felkällor och försvårar underhåll. Alternativ två skyddar bäst genom att isolera logik och underlätta snabb felisolering mellan oberoende domäner. Alternativ tre kräver för mycket komplexitet för detta specifika uppdrag. Jag landar i att alternativ två är mest resilient för framtida uppdateringar.


#### 2d Att förlikas: Mättnad
Jag fastställer att alternativ två är det vinnande alternativet för detta uppdrag. Dess fokus på isolering och resiliens ger bäst förutsättningar för underhåll och felisolering. MÄTTNAD: JA.


#### 3a Att följa: Testspecifikation



#### 3b Att följa: Källkod



#### 3c Att förlikas: Slutgiltigt Byggkontrakt
Det slutgiltiga byggkontraktet innebär att vi skapar testfilen `src/features/gemini_live_swarm/__tests__/swarm_swarm.test.ts` som konsoliderar de åtta scenarierna, och att vi bevarar `index.ts` oförändrad då inga källkodsändringar krävs.
