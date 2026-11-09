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
