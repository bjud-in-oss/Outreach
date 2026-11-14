# TCK-MAINT-070: Aktivera ofiltrerad tsc-kontroll (efter TCK-065) och synka critiqueTriage-rubriker + Papperskorg

**Måldomän:** `scripts`
**Målfiler:** `scripts/lib/maintValidation.ts`, `scripts/lib/critiqueTriage.ts`
**Förutsättning:** `TCK-065` måste vara `VERIFIED`.
**Mekanisk Acceptans:**
1. `scripts/lib/maintValidation.ts` (< 80 rader) ersätter den temporära filtreringen med ofiltrerad `npx tsc -p scripts/tsconfig.json --noEmit` och använder `extractErrorSignature` från `./ticketAndAnchor.js`.
2. `scripts/lib/critiqueTriage.ts` (< 145 rader) synkar mot rubrikerna i `doc/PROCESS_IMPROVEMENTS.md` (`## 2. Köade Batch-förbättringar`, `## 3. Avvisade & Vederlagda Förslag` och `## 4. Papperskorg (Makulerade & Inaktuella Beslut)`) och **tömmer `## 4. Papperskorg` allra först** vid varje körning.
3. `pnpm lint` och `pnpm verify` passerar båda med exit 0.
