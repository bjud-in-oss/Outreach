# TCK-MAINT-069: Delad 2-prompts 5-Varför-tratt (Varför 1–3 -> 3 hypoteser -> fri prövning & Varför 4–5+), Repo-återanvändning och AST await-spärr

**Måldomän:** `scripts`
**Målfiler:** `scripts/lib/channelRunner.ts`, `scripts/lib/ticketAndAnchor.ts`, `scripts/verify-architecture.js`, `scripts/run-planera-live.ts`
**Mekanisk Acceptans:**
1. `scripts/lib/channelRunner.ts` (< 195 rader) exporterar `diagnostiseraRotOrsak(ai, modelName, contextTitle, errorLog, sourceContext, si)` som ersätter den gamla enkelprompten (`Metanoia`) med **två fristående efemära sessioner**:
   - **Prompt 1 (`Att vända om`, `maxTurns: 1`):** Zoomar ut mot FSD-/kontraktsintegritet och modulär expansion (Väg 2), spårar de inledande mekaniska faktafrågorna (**normalt `Varför 1–3`**), öppnar där **3 ortogonala felhypoteser** utan rangordning, ställer den **Epistemiska Falsifieringsfrågan** och anger **återstående frågedjup** (`minst 2`, dvs. `Varför 4–5+`), strippad från slutsatser.
   - **Prompt 2 (`Att förlikas`, `maxTurns: 1`, blankt minne):** Väger hypoteserna mot fellogg, källkod, `FEATURE_INDEX.json` och `DECISIONS.md`, väljer fritt egna prövningsfrågor för att testa anpassning av befintliga repoidéer (`HYPOTES D: REPO-ÅTERANVÄNDNING`), slutför `Varför 4–5+`, loggar domen via `sparaMetaOmvandelse` till `CYCLE_LOG.md` och låser `EGENTLIGT_FEL`.
2. `scripts/lib/ticketAndAnchor.ts` (< 215 rader) exporterar `getCompactTicketWindow(ticketsMdContent, recentVerifiedLimit = 5)`, `validateTicketScope(ticketPrompt, isMaint, targetDomain)` (> 4 målfiler) samt `selectRelevantRetryFiles(candidateFiles, errorLog)`.
3. `scripts/verify-architecture.js` (< 230 rader) kontrollerar via TypeScript AST att varje anrop till `hanteraTrepunktsbesiktning(...)` har en `AwaitExpression` som förälder.
4. `scripts/run-planera-live.ts` (< 950 rader) kopplar in `hanteraKonstruktivKritik`, `diagnostiseraRotOrsak`, `getCompactTicketWindow`, `validateTicketScope` och upp till 4 yttre omvändelser (`TCK` + `MAINT`).
5. `pnpm verify` passerar med exit 0.
