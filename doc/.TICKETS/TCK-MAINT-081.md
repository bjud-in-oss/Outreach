# TCK-MAINT-081: Samla samtliga matchande felrader ur hela loggen i extractErrorSignature och verifiera med enhetstest

**Måldomän:** `scripts`
**Målfiler:** `scripts/lib/ticketAndAnchor.ts`, `scripts/__tests__/scriptLibs.test.ts`
**Förutsättning:** `TCK-MAINT-079` måste vara `VERIFIED`.
**Mekanisk Acceptans:**
1. `scripts/lib/ticketAndAnchor.ts` (< 175 rader) uppdaterar `extractErrorSignature(log: string, maxLines = 15): string` till att filtrera **hela** loggen (`log.split('\n').filter(l => signatureRegex.test(l)).slice(0, maxLines).join('\n')`) så att felrader överst aldrig klipps bort av långa Node-stacktraces längst ned.
2. `scripts/__tests__/scriptLibs.test.ts` (< 125 rader) lägger till ett enhetstest för `extractErrorSignature` som bevisar att både `✘ [ERROR] No matching export...` och `error TS2322` extraheras ur en 30-raders logg medan stacktrace-rader filtreras bort.
3. `pnpm verify` passerar med exit 0.
