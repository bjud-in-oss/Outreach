# TCK-MAINT-078: Samla felradsmönstret i delad extractErrorSignature(log) i ticketAndAnchor.ts (SSOT för maintValidation och fas2Recovery)

**Måldomän:** `scripts`
**Målfiler:** `scripts/lib/ticketAndAnchor.ts`, `scripts/lib/maintValidation.ts`, `scripts/lib/fas2Recovery.ts`, `scripts/__tests__/scriptLibs.test.ts`
**Förutsättning:** `TCK-MAINT-076` måste vara `VERIFIED`.
**Mekanisk Acceptans:**
1. `scripts/lib/ticketAndAnchor.ts` (< 165 rader) exporterar `extractErrorSignature(log: string, maxLines = 15): string` som extraherar alla rader som matchar `/Error|FAIL|Transform failed|SyntaxError|TypeError|AssertionError|error TS|RADGRÄNSBROTT|✘|\[ERROR\]|❌|File:/` (upp till `maxLines` rader) så att `esbuild`-, `tsc`- och Vitest-fel alltid fångas enhetligt utan stacktrace-brus.
2. `scripts/lib/maintValidation.ts` (< 75 rader) ersätter sitt lokala `errorPatterns`-regex med `extractErrorSignature` från `./ticketAndAnchor.js`.
3. `scripts/lib/fas2Recovery.ts` (< 185 rader) använder `extractErrorSignature` från `./ticketAndAnchor.js` för sin framstegsspärr (`currentSig !== prevErrorSignature`) i `korMaintValidering`.
4. `scripts/__tests__/scriptLibs.test.ts` (< 125 rader) lägger till ett enhetstest för `extractErrorSignature` som bevisar att både `✘ [ERROR] No matching export...` och `error TS2322` extraheras medan vanliga Node-stacktraces filtreras bort.
5. `pnpm verify` passerar med exit 0.
