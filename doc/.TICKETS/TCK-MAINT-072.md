# TCK-MAINT-072: Slutför Strangler Fig — banta run-planera-live.ts under 250 rader och ta bort 1000-radersundantaget i sizeGate.js

**Måldomän:** `scripts`
**Målfiler:** `scripts/run-planera-live.ts`, `scripts/lib/sizeGate.js`
**Förutsättning:** `TCK-MAINT-071` måste vara `VERIFIED`.
**Mekanisk Acceptans:**
1. `scripts/run-planera-live.ts` (**strikt < 250 rader**) agerar renodlad tunn CLI-orkestrerare (argumentparsning, `VERIFIED`-vakt, startsanering och anrop till `fas1Sweep`, `fas2Loop` och `fas3Consolidation`).
2. `scripts/lib/sizeGate.js` (< 95 rader) tar bort 1000-radersundantaget för `run-planera-live.ts` i `LEGACY_SCRIPT_CAPS` och `getLineLimitForFile` så att **250 rader** gäller som standardtak för samtliga `.ts`-moduler (utöver legacy-filerna `bidiLiveRunner.ts` och `sessionIntentAudio.ts`).
3. `pnpm verify` passerar med exit 0.
