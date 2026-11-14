# TCK-MAINT-070: Aktivera ofiltrerad tsc-kontroll över gränssnittet scripts/ <-> src/features/path/ (efter TCK-064)

**Måldomän:** `scripts`
**Målfiler:** `scripts/lib/maintValidation.ts`
**Förutsättning:** `TCK-064` måste vara `VERIFIED` (så att `pnpm lint` passerar med exit 0).
**Mekanisk Acceptans:**
1. `scripts/lib/maintValidation.ts` (< 115 rader) ersätter den temporära filtreringen `npx tsc -p scripts/tsconfig.json --noEmit 2>&1 | grep "^scripts/" && exit 1 || true` med ofiltrerad `npx tsc -p scripts/tsconfig.json --noEmit` så att gränssnittet mellan `scripts/` och `src/features/path/` typkontrolleras utan filter vid varje `MAINT`-körning.
2. `pnpm lint` och `pnpm verify` passerar båda med exit 0.
