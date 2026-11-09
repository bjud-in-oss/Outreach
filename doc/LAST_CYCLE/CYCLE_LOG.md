# BYGGCYKEL LOGG: TCK-MAINT-018
**Starttid:** 2026-11-09T16:21:24.063Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-MAINT-018: Fullborda Recept-Integration och Prefixmatchning i Vägmotorn

## 1. MÅL
Slutför integrationen mellan `runtimeAdapter.ts` och `promptCompiler.ts` samt inför robust prefix-matchning i `bestamFasForSteg` under `src/features/path/`. Befintliga tester i `promptCompiler.test.ts` och `pathOrchestrator.test.ts` måste förbli 100 % gröna samtidigt som steg-exekveraren bevisat anropar `kompileraPrompt`.

## 2. KÄLLKODSSPECIFIKATION FÖR DOMÄNEN
Måldomän: `src/features/path/` (Max 250 rader per logikfil enligt SI v10.5).

1. `src/features/path/engine/pathRunner.ts`:
   - Uppdatera `bestamFasForSteg(stegId: string): PathPhase`:
     * Prefix `step-1a`, `step-0`, `avsikt` -> `'avsikt'`
     * Prefix `step-1b`, `step-2`, `step-3`, `provning` -> `'provning'`
     * Prefix `step-fas2`, `konstruktion` -> `'konstruktion'`
     * Prefix `step-fas3`, `besiktning` -> `'besiktning'`
     * Fallback -> `'avsikt'`

2. `src/features/path/engine/promptCompiler.ts`:
   - `userPrompt` ska formateras rent och deterministiskt som:
     `StegId: ${input.stegId}\nInput: ${JSON.stringify(input.kontextMinne || {})}`
     Detta uppfyller exakt det kontrakt som både `pathOrchestrator.test.ts` och `promptCompiler.test.ts` förväntar sig.

3. `src/features/path/engine/runtimeAdapter.ts`:
   - `skapaMockSessionAdapter(svarstabell)`:
     * Hämta ut `stegId` via `prompt.userPrompt.match(/StegId: ([^\n]+)/)`.
     * Slå upp: `svarstabell[stegId] || svarstabell[prompt.userPrompt] || ''`.
   - `skapaStegExekverare(adapter, configOrDomain)`:
     * Stöd både `string` och `StegExekverarConfig` (`{ ticketId, malDoman, basUppdrag }`).
     * Anropa `kompileraPrompt` med fasen från `bestamFasForSteg(stegId)`.
     * Om adaptern ger svar: `{ success: true, data: res.svar, tokensUsed: res.tokensAnvanda }`.
     * Om tomt svar: `{ success: false, data: 'Inget svar erhölls' }`.

## 3. ACCEPTANSKRITERIER
1. Samtliga testfiler under `src/**/__tests__/` ska passera 100 % gröna.
2. `pnpm verify` ska passera 100 % grön.

```


#### 1a Att följa: Intention & Nytta
<TALA kraft="följa">
Jag har förstått intentionen. Vi ska fullborda recept-integrationen, införa robust prefixmatchning i vägmotorn samt säkerställa att prompt-formateringen blir helt deterministisk för att garantera att testerna förblir gröna. Jag skapar nu Gherkin-scenariot för Intent Gate.
</TALA>


#### 0a Att vända om: Kontraktsaudit
<TALA kraft="vända-om">
Kontraktsaudit genomförd. Måldomänen är begränsad till en domän (`src/features/path`), och berörda filer existerar enligt repots topologi. Samtliga modifikationer håller sig inom kontraktets gränser för FSD-isolering. Vi fortsätter planen.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
För att lösa TCK-MAINT-018 och fullborda integrationen i vägmotorn formulerar jag följande tre ortogonala alternativ.

Alternativ 1: Direkt imperativ implementation. Vi uppdaterar `bestamFasForSteg` med enkla `startsWith`-kontroller i `pathRunner.ts`, formaterar prompten sekventiellt enligt specifikationen i `promptCompiler.ts`, och hanterar konfigurationer direkt i `runtimeAdapter.ts` genom att kontrollera typen.

Alternativ 2: Utnyttjande av dedikerade hjälpfunktioner. Vi bryter ut reguljära uttryck och fasmappning till interna hjälpfunktioner för ökad modularitet och testbarhet inom domänen.

Alternativ 3: Modulär konfigurationsstyrning med strikt typvalidering. Vi fokuserar på extremt robust hantering av adapterns konfiguration och felloggning för att garantera att inga fel slinker igenom utan att flaggas korrekt.


#### 2c Att vända om: Resiliensgranskning
Alternativ 3 ger den bästa resiliensen då den strikta typvalideringen och robusta felloggningen i `runtimeAdapter` skyddar mot oförutsedda konfigurationsfel, vilket helt överensstämmer med systemets Fail Fast-princip och våra kvalitetsgrindar. Genom att garantera att inga fel döljs stärks systemets långsiktiga stabilitet och spårbarhet avsevärt.


#### 2d Att förlikas: Mättnad
Jag bekräftar härmed att Alternativ 3 är det vinnande kontraktet. Den strikta typvalideringen och robusta felloggningen i `runtimeAdapter` garanterar systemets stabilitet och följer Fail Fast-principen. MÄTTNAD: JA.
