# TCK-MAINT-067: 6:e WS-retry (60s inom 345 rader), 750ms sessionspaus och pre-write syntax-/radspärr

**Måldomän:** `scripts`
**Målfiler:** `scripts/bidiLiveRunner.ts`, `scripts/lib/channelRunner.ts`, `scripts/lib/sizeGate.js`, `scripts/lib/fas2Tooling.ts`
**Mekanisk Acceptans:**
1. `scripts/bidiLiveRunner.ts` (**strikt <= 345 rader**) utökar återanslutningslogiken vid WebSocket `1011`/`1006`/`503` från 5 till **6 försök** via ett kompakt 1-radigt fördröjningsuttryck (`const delay = (this.reconnectAttempts === this.maxReconnectAttempts ? 60000 : Math.pow(2, this.reconnectAttempts) * 1000) + Math.floor(Math.random() * 1000);`).
2. `scripts/lib/channelRunner.ts` (< 120 rader) behåller separata efemära mikrokanaler men ökar nedkylningspausen efter `runner.close()` till `750 ms`.
3. `scripts/lib/sizeGate.js` (< 95 rader) exporterar `getLineLimitForFile(relPath)` och `getNearLimitWarnings(rootDir, targetFiles)` (varnar vid > 180 rader för 250-radersfiler, > 90 rader för `.tsx`).
4. `scripts/lib/fas2Tooling.ts` (< 220 rader) kör syntaxspärr (`ts.transpileModule` med `target: ts.ScriptTarget.ES2022`) och radgränsspärr (`getLineLimitForFile`) **före `fs.writeFileSync`** i både `save_code` och `apply_patch`.
5. `pnpm verify` passerar med exit 0.
