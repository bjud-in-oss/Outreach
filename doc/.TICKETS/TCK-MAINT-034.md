# TCK-MAINT-034: TSX-stöd för Transienta Tester och Syntaxspärr i Fail-First

**Måldomän:** `scripts` (`scripts/run-planera-live.ts`)
**Mekanisk Acceptans:** Ett transient skripttest bevisar att `run-planera-live.ts` dynamiskt väljer ändelsen `.tsx` för transienta tester när måldomänen innehåller `.tsx`-filer eller rör UI/React, att Fail-First avvisar transformerings- och syntaxfel (`PARSE_ERROR` / `Transform failed`), samt att regressionssviten passerar med exit 0.

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **Dynamisk testextension (.ts vs .tsx):**
   - I `scripts/run-planera-live.ts` ska transient-testets ändelse härledas dynamiskt:
     * Om `targetDomain === 'a2ui'`, om `ticketPrompt` innehåller `.tsx` / `React`, eller om domänkatalogen innehåller `.tsx`-filer, ska `testExt` sättas till `'tsx'`. Annars `'ts'`.
     * `transientTestFile` ska definieras som `src/__tests__/transient_${ticketId}.test.${testExt}`.
2. **Startsanering och Fas 3-konsolidering:**
   - Startsaneringen ska radera både eventuell `.test.ts` och `.test.tsx` för den aktuella biljetten.
   - I Fas 3 ska den permanenta testfilen konsolideras med samma `testExt` (`${path.basename(primaryModule)}.test.${testExt}`).
3. **Syntaxspärr i Gate 3a Fail-First:**
   - I Fas 1 får `failFirstOutput` inte accepteras om den innehåller `PARSE_ERROR`, `Transform failed` eller syntaxfel som indikerar att testkoden är ogiltig snarare än att källkoden saknas.
4. **Bevara orkestreringsinvarianter:**
   - Befintliga kvalitetsgrindar för skriptdomänen (`verify-architecture.js` och `npx vitest run scripts/__tests__/`) ska förbli 100 % intakta.

---

## Scenariotriad (Den relationella och systemiska avsikten)

**Scenario: ATT FÖLJA – UI-tester exekveras med fullständigt JSX-stöd**
  Givet en byggbiljett för en React- eller A2UI-komponent
  När transient-testet genereras i Fas 1
  Så ska testfilen skapas med ändelsen `.tsx`
  Och testmotorn parsar JSX-komponenter rent utan transformeringskrascher.

**Scenario: ATT VÄNDA OM – Avvisande av syntaxfel som "Fail-First"**
  Givet att en testfil genereras med parser- eller transformeringsfel
  När testet provkörs i Fas 1
  Så ska systemet neka testet och begära självrättning direkt
  I stället för att feltolka en syntaxkrasch som ett godkänt rött test.

**Scenario: ATT FÖRLIKAS – En helgjuten byggmotor för både backend och frontend**
  Givet att `run-planera-live.ts` uppdateras
  När skripttesterna och arkitekturgranskaren körs
  Så ska ändringen godkännas lokalt
  Och vägen är fri för TCK-050 att exekveras grönt.
