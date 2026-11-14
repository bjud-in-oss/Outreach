# TCK-MAINT-078: Samla extractErrorSignature(log) som SSOT i ticketAndAnchor.ts och ersätt stubbar i channelRunner, fas2Recovery & fas1Sweep

**Måldomän:** `scripts`
**Målfiler:** `scripts/lib/ticketAndAnchor.ts`, `scripts/lib/channelRunner.ts`, `scripts/lib/fas2Recovery.ts`, `scripts/lib/fas1Sweep.ts`
**Förutsättning:** `TCK-MAINT-076` måste vara `VERIFIED`.
**Mekanisk Acceptans:**
1. `scripts/lib/ticketAndAnchor.ts` (< 165 rader) exporterar `extractErrorSignature(log: string, maxLines = 15): string` som extraherar alla rader som matchar `/Error|FAIL|Transform failed|SyntaxError|TypeError|AssertionError|error TS|RADGRÄNSBROTT|✘|\[ERROR\]|❌|File:/` (upp till `maxLines` rader) så att `esbuild`-, `tsc`- och Vitest-fel fångas enhetligt.
2. `scripts/lib/channelRunner.ts` (< 185 rader) implementerar riktig `fs.readFileSync`/`fs.readdirSync`-logik i `executeInspection` (ingen stubb) och återställer den 2-sessioners asynkrona `diagnostiseraRotOrsak(ai, modelName, contextTitle, errorLog, sourceContext, si): Promise<string>` (`Att vända om` `Varför 1–3` -> 3 hypoteser -> Epistemisk Falsifieringsfråga, följt av `Att förlikas` med blankt minne + kompakta `## ADR-`-rubriker ur `doc/DECISIONS.md` + `Varför 4–5+` och `appendCycleLog`).
3. `scripts/lib/fas2Recovery.ts` (< 195 rader) använder `extractErrorSignature` från `./ticketAndAnchor.js`, anropar den asynkrona `diagnostiseraRotOrsak` från `./channelRunner.js` (med automatisk inläsning av externa felande filer som nämns i felloggen), och anropar `planContextBatches(files, errorLog)` och `buildCrashDumpPayload(data)` från `./contextBatcher.js` med korrekta argumentsignaturer.
4. `scripts/lib/fas1Sweep.ts` (< 115 rader) tar bort de lokala platshållarna `getCompactTicketWindow` och `validateTicketScope` och importerar i stället de riktiga funktionerna från `./ticketAndAnchor.js`.
5. `pnpm verify` passerar med exit 0.
