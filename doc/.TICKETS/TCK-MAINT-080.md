# TCK-MAINT-080: Full s-städning i fas3Consolidation.ts och AST await- + anti-stubb-spärr i verify-architecture.js

**Måldomän:** `scripts`
**Målfiler:** `scripts/lib/fas3Consolidation.ts`, `scripts/verify-architecture.js`
**Förutsättning:** `TCK-MAINT-070` måste vara `VERIFIED`.
**Mekanisk Acceptans:**
1. `scripts/lib/fas3Consolidation.ts` (< 200 rader) kör `execSync('git reset HEAD -- src/ scripts/ 2>/dev/null || true && git checkout -- src/ scripts/ package.json vite.config.ts 2>/dev/null || true && git clean -fd src/ scripts/', { cwd: ROOT_DIR })` i `s`-grenen.
2. `scripts/verify-architecture.js` (< 235 rader) kontrollerar via TypeScript AST dels att varje anrop till `hanteraTrepunktsbesiktning(...)` har en `AwaitExpression` som förälder, dels att ingen exporterad funktion i `scripts/` eller `src/features/` enbart består av en tom alibi-stubb (`return 0;`, `return;`, `return null;`, `return [];`, `return {};`).
3. `pnpm lint` och `pnpm verify` passerar båda med exit 0.
