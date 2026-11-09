# TCK-MAINT-023: Härda Action Loopens Filkrav och Etablera run-path Integrationstest

## 1. MÅL
Åtgärda blindfläcken i Action Loopen i `scripts/run-planera-live.ts` så att filer med flera punkter (t.ex. `.test.ts`) inkluderas i kravlistan och inte avbryts i förtid, samt etablera det permanenta integrationstestet `scripts/__tests__/run-path.test.ts` med ESM-säker start i `scripts/run-path.ts`.

## 2. INFRASTRUKTURSPECIFIKATION
1. `scripts/run-planera-live.ts`:
   - I `getRequiredFiles()`: ändra regexen för MAINT till:
     `const promptFiles = ticketPrompt.match(/scripts\/[a-zA-Z0-9_\-./]+\.(?:ts|js)/g) || [];`
   - I `isFas2Complete()`: säkerställ att för MAINT måste alla filer i `getRequiredFiles()` finnas i antingen `createdModules` eller `modifiedFiles` innan fasen får markeras som klar.

2. `scripts/run-path.ts`:
   - Ersätt CommonJS-kontrollen `if (require.main === module)` med ESM-säker CLI-detektering:
     ```typescript
     import { fileURLToPath } from 'node:url';
     const isDirectCli = process.argv[1] && (
       process.argv[1] === fileURLToPath(import.meta.url) ||
       process.argv[1].endsWith('run-path.ts') ||
       process.argv[1].endsWith('run-path.js')
     );
     if (isDirectCli) {
       exekveraRunPath().catch(() => process.exit(1));
     }
     ```

3. `scripts/__tests__/run-path.test.ts`:
   - Skapa integrationstestet som anropar `exekveraRunPath` med syntetiskt I/O och verifierar att recepten (både default lean och classic) exekverar grönt.

## 3. ACCEPTANSKRITERIER
1. `scripts/__tests__/run-path.test.ts` existerar och körs grönt i `pnpm test`.
2. `pnpm verify` passerar 100 % grön med 17 testfiler.
3. Trepunktsbesiktningen visar explicit att testfilen skapats och godkänns med `j`.
