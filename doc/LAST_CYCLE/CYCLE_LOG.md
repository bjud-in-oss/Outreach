# BYGGCYKEL LOGG: TCK-043
**Starttid:** 2026-11-09T15:20:54.569Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-043: Den Integrerade Recept-Orkestreraren (Path Orchestrator)

## 1. MÅL
Implementera en samlande orkestrerarmodul (`src/features/path/engine/pathOrchestrator.ts`) och integrera fasspecifik promptkompilering i `runtimeAdapter.ts` enligt ADR-029/030. Modulen ska deterministiskt mappa varje steg i ett recept till dess korrekta fas och uppdrag, kompilera prompten via `kompileraPrompt` och exekvera hela receptet via `exekveraRecept`.

## 2. KÄLLKODSSPECIFIKATION FÖR DOMÄNEN
Måldomän: `src/features/path/` (Max 250 rader per logikfil enligt SI v10.5).

1. `src/features/path/contracts/pathSchema.ts`:
   - Deklarera och exportera Zod-schemat:
     * `OrchestratorConfigSchema`: Validerar inställningar för en orkestrerarkörning (receptTyp: 'classic' | 'lean', ticketId: string, malDoman: string, uppdrag: string, kontextMinne?: record).
   - Härled typen via `z.infer`:
     * `export type OrchestratorConfig = z.infer<typeof OrchestratorConfigSchema>;`

2. `src/features/path/model/types.ts`:
   - Re-exportera `OrchestratorConfig` från `../contracts/pathSchema` enligt SSOT-regeln.

3. `src/features/path/engine/runtimeAdapter.ts`:
   - Implementera och exportera `bestamFasForSteg(stegId: string): PathPhase`:
     * Steg med prefix `step-1a`, `step-0a`, `step-0b`, `avsikt` -> `'avsikt'`
     * Steg med prefix `step-1b`, `step-2`, `step-3`, `provning` -> `'provning'`
     * Steg med prefix `step-fas2`, `konstruktion` -> `'konstruktion'`
     * Steg med prefix `step-fas3`, `besiktning` -> `'besiktning'`
   - Uppdatera `skapaStegExekverare(adapter: SessionAdapter, config: { ticketId: string; malDoman: string; basUppdrag: string })`:
     * När exekveraren anropas för ett `stegId` ska den anropa `kompileraPrompt` med fasen från `bestamFasForSteg`, stegId, ticketId, malDoman och uppdrag.
     * Skicka den kompilerade prompten till `adapter.skicka(prompt)`.
     * Returnera `StepResult` med `{ success: true, data: res.svar, tokensUsed: res.tokensAnvanda || prompt.beraknadeTokensUngefar }`.

4. `src/features/path/engine/pathOrchestrator.ts`:
   - Exportera funktionen `skapaPathOrkestrerare(options: { adapter: SessionAdapter; portar: { avsikt: Port; provning: Port; konstruktion: Port; besiktning: Port }; config: OrchestratorConfig })`.
   - Bygger antingen ett `classicRecipe` eller ett `leanRecipe` med den integrerade stegExekveraren och de tillhandahållna portarna.
   - Exportera funktionen `korPathCykel(...)` som anropar `exekveraRecept` och returnerar en strukturerad slutrapport: `{ success: boolean, slutfold: boolean, logg: string[] }`.

5. `src/features/path/index.ts`:
   - Re-exportera `bestamFasForSteg`, `skapaPathOrkestrerare`, `korPathCykel`, `OrchestratorConfigSchema` och `OrchestratorConfig`.

## 3. ACCEPTANSKRITERIER (Hermetisk TDD och Gate 3a)
1. Skapa transient test `src/__tests__/transient_TCK-043.test.ts`:
   - Testfall 1: Verifiera att `bestamFasForSteg` korrekt mappar samtliga 12 steg i `classicRecipe` till deras respektive fyra faser.
   - Testfall 2: Verifiera att `skapaStegExekverare` integrerar med `kompileraPrompt` så att den skickade prompten till adaptern innehåller den fasens specifika systeminstruktion.
   - Testfall 3: Verifiera att en komplett orkestrerarkörning via `korPathCykel` körs 100 % grönt i minnet för ett fullt godkänt classicRecipe med mockad adapter.
2. Hela verifieringssviten (`pnpm verify`) ska passera 100 % grön.

```


#### 1a Att följa: Intention & Nytta
Intentionen med den integrerade recept-orkestreraren är att skapa en modul som deterministiskt styr och exekverar utvecklingsstegen baserat på valda recept. För människan innebär detta trygghet och hög kvalitet då systemet säkrar spårbarhet och att varje fas får rätt kontext och instruktioner.


#### 0a Att vända om: Kontraktsaudit
Jag bekräftar kontraktsaudit för TCK-043. Alla operationer sker inom en domän, `src/features/path` och uppfyller alla krav. Vi fortsätter till nästa steg.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
För att uppfylla TCK-043 utan extern telemetri, presenterar jag tre ortogonala alternativ för lösning.

Först: Direkt integrering i `skapaStegExekverare` där vi mappar fas och kompilerar prompten in-line i stegexekveraren för linjär exekvering.

Sedan: En wrapper-fabrik för kompilering där en separat funktion hanterar fas-logik och promptbygge innan resultatet skickas till adaptern.

Slutligen: Konfigurationsdriven exekvering genom en strategimodell där receptet injicerar mappings- och kompileringslogiken för maximal extensibilitet.


#### 2c Att vända om: Resiliensgranskning
Vid en resiliensgranskning och analys av det tidigare haveriet ser vi att felaktigheter i testgränssnittet bröt flödet. Alternativ ett ger direkt kontroll, men alternativ två, wrapper-fabriken, ger bäst isolering och resiliens genom att låta kompileringen fel-isoleras ordentligt innan resultatet skickas till adaptern.


#### 2d Att förlikas: Mättnad
Efter en noggrann avvägning av spänningsfältet mellan kontroll och isolering, slår jag fast att Alternativ två, wrapper-fabriken, är det vinnande alternativet. Denna struktur ger bäst resiliens genom att isolera eventuella kompileringsfel. MÄTTNAD: JA.


#### 3a Att följa: Testspecifikation



#### 3b Att följa: Källkod



#### 3c Att förlikas: Slutgiltigt Byggkontrakt
Här är det fastställda byggkontraktet för TCK-043. För att undvika tidigare haveriförsök fokuserar vi på strikt typsäkerhet och exakt integration i Fas 2.

Filer att skapa och hantera: `src/features/path/contracts/pathSchema.ts`, `src/features/path/model/types.ts`, `src/features/path/engine/runtimeAdapter.ts`, och `src/features/path/engine/pathOrchestrator.ts`.

I `src/features/path/index.ts` ska vi re-exportera följande: `bestamFasForSteg`, `skapaPathOrkestrerare`, `korPathCykel`, `OrchestratorConfigSchema`, och `OrchestratorConfig`.
