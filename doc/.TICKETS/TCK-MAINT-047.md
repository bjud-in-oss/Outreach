# TCK-MAINT-047: Radgränsspärr och Strangler Fig-ratchet för scripts/ i verify-architecture.js

**Måldomän:** `scripts`
**Målfiler:** `scripts/verify-architecture.js`
**Mekanisk Acceptans:** `scripts/verify-architecture.js` innehåller en ny Grind 4 som skannar alla `.ts`- och `.js`-filer under `scripts/` (exklusive `scripts/__tests__/`) och:
1. Underkänner alla skriptmoduler som överstiger 250 rader, med undantag för de två legacy-filerna under Strangler Fig-avveckling (`scripts/run-planera-live.ts` max 1065 rader och `scripts/bidiLiveRunner.ts` max 345 rader).
2. Håller sig själv (`scripts/verify-architecture.js`) strikt under 250 rader.
Samtliga skripttester, domäntester och `pnpm verify` passerar med exit 0.

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **Lägg till Grind 4 i `scripts/verify-architecture.js` (håll filen < 250 rader):**
   - Efter Grind 3 (runt rad 174), inför en kompakt kontroll (`let scriptSizeViolations = 0;`) som rekursivt skannar `SCRIPTS_DIR` (hoppar över `__tests__` och `node_modules`).
   - Sätt takkartan: `const LEGACY_SCRIPT_CAPS = { 'run-planera-live.ts': 1065, 'bidiLiveRunner.ts': 345 };` och `const maxLines = LEGACY_SCRIPT_CAPS[entry.name] || 250;`.
   - Räkna radantalet via `content.split('\n').length`. Om `lineCount > maxLines`, logga tydligt fel och öka `scriptSizeViolations++`.
   - Inkludera `scriptSizeViolations > 0` i slutvillkoret på rad 176 så att bygget avbryts med `process.exit(1)` vid brott.
2. **Bevara övriga grindar:**
   - Ändringen berör uteslutande `scripts/verify-architecture.js`.

---

## Scenariotriad (Den relationella och systemiska avsikten)

**Scenario: ATT FÖLJA – Skriptlagret får samma modulära disciplin som FSD-domänerna**
  Givet att `verify-architecture.js` körs vid varje verifiering
  När nya skriptmoduler skapas under `scripts/` eller `scripts/lib/`
  Så garanterar Grind 4 att ingen ny modul överstiger 250 rader
  Och legacy-filerna låses vid sitt nuvarande tak.

**Scenario: ATT VÄNDA OM – Avvisande av fortsatt tillväxt i run-planera-live.ts**
  Givet att `run-planera-live.ts` är under Strangler Fig-avveckling mot `src/features/path/`
  När en framtida ändring försöker lägga till fler rader utöver taket
  Så avvisar `verify-architecture.js` ändringen mekaniskt
  Vilket tvingar fram utbrytning till `scripts/lib/` eller `src/features/path/`.

**Scenario: ATT FÖRLIKAS – Grön arkitekturkontroll**
  Givet att `scripts/verify-architecture.js` är uppdaterad
  När `pnpm verify` körs
  Så passerar samtliga grindar och tester med exit 0.
