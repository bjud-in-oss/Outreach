# TCK-MAINT-024: Fallback-svar i run-path MockAdapter och Etablering av Integrationstest

## 1. MÅL
Gör mock-adaptern i `scripts/run-path.ts` kapabel att hantera `classic`-receptets alla steg genom syntetiska fallback-svar vid provkörning, samt skapa det permanenta integrationstestet `scripts/__tests__/run-path.test.ts`.

## 2. INFRASTRUKTURSPECIFIKATION
1. `scripts/run-path.ts`:
   - Om `options.adapter` inte skickas med, instansiera mock-adaptern med en dynamisk fallback:
     ```typescript
     const adapter = options.adapter || {
       skicka: async (prompt: any) => {
         const stegMatch = prompt.userPrompt.match(/StegId: ([^\n]+)/);
         const stegId = stegMatch ? stegMatch[1].trim() : 'okänt-steg';
         io.log(`   ⚡ [STEG: ${stegId}] Prompt kompilerad (${prompt.beraknadeTokensUngefar || 50} tokens) -> Exekverar.`);
         return { svar: `Syntetiskt källkodssvar för ${stegId}`, tokensAnvanda: 50 };
       }
     };
     ```

2. `scripts/__tests__/run-path.test.ts`:
   - Importera `exekveraRunPath` från `../run-path`.
   - Skapa ett Vitest-test som verifierar att `exekveraRunPath({ argv: [] })` (lean) returnerar `success: true` och `slutfold: true`.
   - Skapa ett Vitest-test som verifierar att `exekveraRunPath({ argv: ['--classic'] })` (classic) exekverar delstegen och returnerar `success: true` och `slutfold: true`.

## 3. ACCEPTANSKRITERIER
1. Både `pnpm bygg:path TCK-MAINT-024` och `pnpm bygg:path TCK-MAINT-024 --classic` passerar grönt utan krascher.
2. `pnpm test` körs med 17 gröna testfiler.
3. Trepunktsbesiktningen visar att båda filerna hanterats inför godkännande med `j`.
