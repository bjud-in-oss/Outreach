# TCK-MAINT-078: Samla extractErrorSignature(log) som SSOT, skärp validateTicketScope till max 2 befintliga målfiler och återställ 2-sessioners diagnostiseraRotOrsak

**Måldomän:** `scripts`
**Målfiler:** `scripts/lib/ticketAndAnchor.ts`, `scripts/lib/channelRunner.ts`
**Mekanisk Acceptans:**
1. `scripts/lib/ticketAndAnchor.ts` (< 175 rader) exporterar `extractErrorSignature(log: string, maxLines = 15): string` (matchar `/Error|FAIL|Transform failed|SyntaxError|TypeError|AssertionError|error TS|RADGRÄNSBROTT|✘|\[ERROR\]|❌|File:/`) och uppdaterar `validateTicketScope` så att biljetter med **fler än 2 befintliga målfiler på disk** (`existingFiles.length > 2`) eller fler än 4 totala målfiler avvisas med `{ valid: false, reason }`.
2. `scripts/lib/channelRunner.ts` (< 175 rader) behåller riktig `fs.readFileSync`/`fs.readdirSync`-logik i `executeInspection` och återställer den 2-sessioners asynkrona `diagnostiseraRotOrsak(ai, modelName, contextTitle, errorLog, sourceContext, si): Promise<string>` genom att återanvända `runMicroChannel` två gånger (`Att vända om` `Varför 1–3` -> 3 hypoteser -> Epistemisk Falsifieringsfråga, följt av `Att förlikas` med blankt minne + kompakta `## ADR-`-rubriker ur `doc/DECISIONS.md` + `Varför 4–5+` och `appendCycleLog`).
3. `pnpm verify` passerar med exit 0.
