# TCK-MAINT-032: Expanderat Byggterritorium för Delad Infrastruktur och Rotkomposition

**Måldomän:** `scripts` (`scripts/run-planera-live.ts`)
**Mekanisk Acceptans:** Ett transient skripttest bevisar att `getRequiredFiles()` i `run-planera-live.ts` vid underhållskörningar (`isMaint`) korrekt extraherar målfiler under `src/shared/`, `src/App.tsx` och rotkonfigurationer (`vite.config.ts`, `package.json`), att `restoreScriptsBackup` vid avbrott även återställer dessa filer, samt att den lokala Fas 2-valideringen och regressionssviten passerar med exit 0.

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **Expanderad filidentifiering i getRequiredFiles():**
   - I `scripts/run-planera-live.ts` MÅSTE funktionen `getRequiredFiles()` vid `isMaint` utökas så att den utöver `scripts/...` även matchar:
     * Filer under `src/shared/` (`src/shared/[a-zA-Z0-9_\-./]+\.(?:ts|tsx)`)
     * Rotkonfigurationer (`vite.config.ts`, `package.json`)
     * Applikationens kompositionsrot (`src/App.tsx`)
2. **Säkerhetsnät och återställningsskydd (restoreScriptsBackup):**
   - Vid avbrott eller fel under underhållskörningar (`isMaintRun`) ska funktionen `restoreScriptsBackup` (eller motsvarande felhanterare) även återställa eventuella påbörjade ändringar i `src/shared/`, `src/App.tsx`, `vite.config.ts` och `package.json` via Git (`git checkout -- src/shared/ src/App.tsx vite.config.ts package.json 2>/dev/null || true`), så att inget trasigt tillstånd lämnas kvar på disken.
3. **Kontextuell Fas 2-validering:**
   - Den lokala kontrollen i Fas 2 ska förutom `verify-architecture.js` och `npx vitest run scripts/__tests__/` även köra typkontroll (`pnpm lint`) om modifierade filer berör TypeScript-filer utanför `scripts/` (såsom `src/shared/` eller `src/App.tsx`).
4. **Bevara FSD-integritet:**
   - Vanliga funktionsbiljetter (`TCK-XXX` där `!isMaint`) ska förbli strikt isolerade till `src/features/<targetDomain>/`. Det utökade territoriet gäller uteslutande underhållskörningar (`isMaint`).

---

## Scenariotriad (Den relationella och systemiska avsikten)

**Scenario: ATT FÖLJA – Motorn äger hela sitt systemiska underhåll**
  Givet en underhållsbiljett som specificerar korrigeringar i `src/shared/bus/swarmEventBus.ts` eller `vite.config.ts`
  När Byggmotorn startar i MAINT-läge
  Så ska `getRequiredFiles()` identifiera dessa filer från specifikationen och tillåta att de uppdateras
  Och bygget slutförs autonomt utan behov av manuella skalskript.

**Scenario: ATT VÄNDA OM – Återställning skyddar delad infrastruktur vid haveri**
  Givet att en underhållskörning som berör delade filer kraschar eller avbryts i Fas 2
  När processens säkerhetsspärr utlöses
  Så ska inte bara `scripts/` utan även påbörjade ändringar i `src/shared/` eller rotfiler rullas tillbaka
  Så att systemet alltid återgår till ett garanterat grönt tillstånd.

**Scenario: ATT FÖRLIKAS – Den lokala valideringen bekräftar helheten**
  Givet att `run-planera-live.ts` uppdateras med det expanderade territoriet
  När `scripts/__tests__/` och `verify-architecture.js` körs lokalt
  Så ska samtliga kontroller passera grönt
  Och motorn är formellt rustad att autonomt läka delade bussar och rotkompositioner.
