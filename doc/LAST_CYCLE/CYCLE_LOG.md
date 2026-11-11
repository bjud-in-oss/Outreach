# BYGGCYKEL LOGG: TCK-MAINT-032
**Starttid:** 2026-11-11T21:01:58.552Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
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

```


#### 1a Att följa: Intention & Nytta
Det här underhållet är verkligen viktigt för att motorn ska kunna hela sig själv ända in i kärnan. Genom att låta byggmotorn hantera både delad infrastruktur och rotkompositioner skapar vi en mycket säkrare grund.

Innan vi startar, finns det någon specifik risk eller tidigare händelse med felaktiga tillstånd på disken som du särskilt vill att vi skyddar oss emot?


#### 0a Att vända om: Kontraktsaudit
För att göra en korrekt kontraktsaudit av underhållsbiljetten TCK-MAINT-032 behöver jag först inspektera hur `getRequiredFiles` och `restoreScriptsBackup` är implementerade i `run-planera-live.ts`. Jag sätter igång med granskningen nu.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
För att möta kraven i TCK-MAINT-032 och bevara FSD-integriteten föreslår jag följande tre ortogonala alternativ för lösning.

Alternativ ett är en direkt statisk domänkartläggning där underhållsläget explicit utökar tillåten sökvägslista i getRequiredFiles med förutbestämda och hårt kodade mönster för delade komponenter och konfigurationsfiler.

Alternativ två är mönsterbaserad dynamisk parsning via reguljära uttryck som i körtid utvärderar samtliga ändringar och automatiskt fångar upp träffar inom specificerade mappar som src/shared och projektroten.

Det tredje alternativet är att behandla delade lagerytor som en separat efemär FSD-domän vid körstart vilket medger strikt isolerad validering och resursövertagning utan risk för läckage till applikationens huvudlogik.


#### 2c Att vända om: Resiliensgranskning
Alternativ ett, med statisk domänkartläggning, erbjuder hög resiliens eftersom den är förutsägbar och har strikt avgränsad omfattning, vilket minskar risken för oavsiktliga sidoeffekter. Alternativ två har högre risk för fel i körtid på grund av dynamiska uttryck, och alternativ tre introducerar onödig komplexitet som kan leda till orkestreringsfel.


#### 2d Att förlikas: Mättnad
Alternativ ett är det vinnande kontraktet. Genomstatiskdomänkartläggningmaximera vi resiliens,förutsägbarhetochstrikt kontroll.MÄTTNAD:JA.
