# TCK-MAINT-028: Jidoka-härdning av Fas 2 (AST-exempel & Lokal Genchi Genbutsu)

**Måldomän:** `scripts` (`scripts/`)
**Mekanisk Acceptans:** Ett transient skripttest bevisar att `run-planera-live.ts` injicerar korrekt AST-exempel vid Gate 3a-brott, och att skriptet omedelbart efter grönt transient-test exekverar domänens lokala testsvit innan Fas 2 tillåts slutföras.

---

## Poka-Yoke & Systemiska Invarianter (Stoppklossar)
1. **Gate 3a (AST-grindens återkoppling):** När Gate 3a underkänner ett test på grund av alibimönster (`vi.fn()`) får felmeddelandet INTE enbart innehålla ett generellt text-tips. Det MÅSTE innehålla ett explicit, fullständigt kodexempel i TypeScript (t.ex. `let anropad = false; const fn = () => { anropad = true; };`) för att bryta språkmodellens kognitiva låsning under tidspress.
2. **Fail-Fast (Lokal Genchi Genbutsu):** I Fas 2, efter att det transienta testet blivit grönt och källkoden modifierats, MÅSTE orkestreringsskriptet exekvera den aktiva domänens befintliga testsvit (`pnpm vitest run src/features/[aktiv_domän]/__tests__/`). Om domänens tester fallerar (t.ex. på grund av brutet externt gränssnitt) ska Fas 2-loopen fånga felet, återkoppla till agenten och fortsätta oscillationen i stället för att maskera felet till slutverifieringen.
3. **Oförstörbar orkestrering:** Inga befintliga kvalitetsgrindar (Gate 2c, Token Gate) får avlägsnas från `run-planera-live.ts`.

---

## Scenariotriad (Den relationella och systemiska avsikten)

**Scenario: ATT FÖLJA – Agenten vägleds ur kognitiv låsning**
  Givet att agenten genererar ett alibitest med `vi.fn()` i Fas 2
  När Gate 3a underkänner testet
  Så ska skriptet injicera ett konkret, körbart AST-exempel för funktionell minnestestning
  Så att agenten genast ser hur den uttrycker tillståndet primitivt utan mocking-bibliotek.

**Scenario: ATT VÄNDA OM – Bakåtinkompatibilitet fångas omedelbart i källan**
  Givet att källkodsagenten i Fas 2 döper om en publik metod som `skicka` till `startStreaming`
  När agentens egna transienta test blir grönt
  Så ska skriptet omedelbart köra domänens övriga tester och fånga regressionsfelet i Fas 2-loopen
  Och tvinga agenten till omvändelse innan koden tillåts passera till slutverifiering.

**Scenario: ATT FÖRLIKAS – Resurser städas och cykeln sluts i frid**
  Givet att ett bygge havererar mekaniskt under domänvalideringen
  När Andon-linan (nödbromsen) dras
  Så ska det kraschade tillståndet sparas i `doc/LAST_CYCLE/CRASH_DIFF.patch`
  Och `src/`-katalogen ska återställas till rent tillstånd.
