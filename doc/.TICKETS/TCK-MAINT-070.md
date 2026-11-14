# TCK-MAINT-070: Aktivera ofiltrerad tsc-kontroll (efter TCK-064), synka critiqueTriage-rubriker, full s-städning och AST anti-stubb-spärr

**Måldomän:** `scripts`
**Målfiler:** `scripts/lib/maintValidation.ts`, `scripts/lib/critiqueTriage.ts`, `scripts/lib/fas3Consolidation.ts`, `scripts/verify-architecture.js`
**Förutsättning:** `TCK-064` måste vara `VERIFIED` (så att `pnpm lint` passerar med exit 0).
**Mekanisk Acceptans:**
1. `scripts/lib/maintValidation.ts` (< 115 rader) ersätter den temporära filtreringen `npx tsc -p scripts/tsconfig.json --noEmit 2>&1 | grep "^scripts/" && exit 1 || true` med ofiltrerad `npx tsc -p scripts/tsconfig.json --noEmit`.
2. `scripts/lib/critiqueTriage.ts` (< 145 rader) synkar mot de verkliga rubrikerna i `doc/PROCESS_IMPROVEMENTS.md` (`## 2. Köade Batch-förbättringar`, `## 3. Avvisade & Vederlagda Förslag` och `## 4. Papperskorg (Makulerade & Inaktuella Beslut)`) och **tömmer `## 4. Papperskorg` allra först** vid varje körning.
3. `scripts/lib/fas3Consolidation.ts` (< 200 rader) kör `execSync('git reset HEAD -- src/ scripts/ 2>/dev/null || true && git checkout -- src/ scripts/ package.json vite.config.ts 2>/dev/null || true && git clean -fd src/ scripts/', { cwd: ROOT_DIR })` i `s`-grenen.
4. `scripts/verify-architecture.js` (< 235 rader) kontrollerar via TypeScript AST dels att varje anrop till `hanteraTrepunktsbesiktning(...)` har en `AwaitExpression` som förälder, dels att ingen exporterad funktion i `scripts/` eller `src/features/` enbart består av en tom alibi-stubb (`return 0;`, `return;`, `return null;`, `return [];`, `return {};`).
5. `pnpm lint` och `pnpm verify` passerar båda med exit 0.
