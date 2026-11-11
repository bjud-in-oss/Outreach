# TCK-MAINT-030: Lokal Fas 2-validering vid skriptunderhåll & Hermetisk testexekvering

**Måldomän:** `scripts` (`scripts/`)
**Mekanisk Acceptans:** Ett transient test bevisar att `run-planera-live.ts` vid underhållskörningar (`isMaint`) lokalt exekverar `node scripts/verify-architecture.js` och `scripts/__tests__/ast-mutator.test.js` i Fas 2 innan processen tillåts gå till Fas 3, samt att regressionssviten passerar med 100 % grönt utfall (exit 0).

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **Lokal källgranskning för skriptdomänen:**
   - I Fas 2, när `isMaint` är sant, MÅSTE orkestreringsskriptet exekvera en lokal valideringsslinga som kör:
     1. `node scripts/verify-architecture.js`
     2. `npx vitest run scripts/__tests__/`
   - Om något av dessa steg fallerar ska Fas 2-loopen fånga felutskriften och erbjuda agenten självrättning på plats i stället för att maskera felet till slutbesiktningen.
2. **Hermetisk isolering:**
   - Exekvering av transienta testfiler i Fas 2 får aldrig manipulera eller vara beroende av transient-filter i repots delade `vite.config.ts`.
3. **Bevara orkestreringsinvarianter:**
   - Befintliga kvalitetsgrindar (Gate 2c, Gate 3a AST-kodexempel, startsanering via git) ska förbli 100 % intakta.

---

## Scenariotriad (Den relationella och systemiska avsikten)

**Scenario: ATT FÖLJA – Skriptunderhåll valideras direkt vid källan**
  Givet en underhållsbiljett som modifierar filer i `scripts/`
  När källkodsagenten i Fas 2 slutför sin ändring
  Så ska skriptet omedelbart köra arkitekturgranskaren och skripttesterna lokalt
  Och bekräfta att verktygslådan förblir hel innan bygget passerar vidare.

**Scenario: ATT VÄNDA OM – Arkitekturfel i skript fångas omedelbart i loopen**
  Givet att en ändring i `scripts/` råkar införa en otillåten korsimport eller bryter AST-mutatorn
  När den lokala Fas 2-kontrollen exekveras
  Så ska felet fångas i självrättningsloopen och återkopplas till modellen
  Så att skadan kan läkas utan att hela byggprocessen kraschar vid slutverifiering.

**Scenario: ATT FÖRLIKAS – Helheten lämnas stabil och grön**
  Givet att alla lokala skriptkontroller och transienta tester passerat
  När Fas 3 slutförs
  Så ska `pnpm verify` passera utan anmärkning
  Och biljetten stängas med fullständig förvissning om systemets hälsa.
