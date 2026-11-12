# TCK-MAINT-036: Skydd mot 0-bytesfiler i Fas 2 och Precisionsspärr i Fail-First

**Måldomän:** `scripts` (`scripts/run-planera-live.ts`)
**Mekanisk Acceptans:** Ett transient skripttest bevisar att `getMissingFiles()` i `run-planera-live.ts` betraktar tomma 0-bytesfiler som saknade, att Fail-First tillåter oskapade relativa importer till `../features/${targetDomain}` men blockerar saknade externa paket, samt att regressionssviten passerar med exit 0.

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **0-bytes-skydd i getMissingFiles():**
   - I `scripts/run-planera-live.ts` MÅSTE `getMissingFiles()` returnera en fil som saknad om filen antingen inte existerar på disk ELLER har filstorlek 0 bytes (`fs.statSync(fullPath).size === 0`).
   - Därmed tvingar `getFas2FollowupPrompt()` modellen att anropa `save_code` i stället för att fastna på `apply_patch` mot en tom fil.
2. **Precisionsspärr för importer i Gate 3a Fail-First:**
   - I `scripts/run-planera-live.ts` ska Fail-First-grinden enbart underkänna `Failed to resolve import` om felet avser externa paket (d.v.s. INTE när felloggen refererar till `../features/${targetDomain}`, vilket är en legitim Fail-First-orsak innan Fas 2 skapat filen).
3. **Epistemisk läsning i Steg 3a:**
   - Instruktionen för Steg 3a i `run-planera-live.ts` ska uppmana modellen att via `read_file` inspektera befintliga filer i `src/features/${targetDomain}/` (t.ex. `renderer.tsx` och katalogkomponenter) innan den formulerar assertions på komponent-ID och props.

---

## Scenariotriad (Den relationella och systemiska avsikten)

**Scenario: ATT FÖLJA – Tomma filer fylls direkt via save_code**
  Givet att en målfil i kontraktet saknas eller är 0 bytes på disk
  När Fas 2 utvärderar saknade filer
  Så ska filen flaggas som saknad och modellen instrueras att anropa `save_code`
  Så att källkoden skrivs utan att fastna i läs-loopar.

**Scenario: ATT VÄNDA OM – Legitimt rött test vid oskapad domänmodul**
  Givet att ett transient test importerar en ny modul från `../features/${targetDomain}/...`
  När Fail-First-grinden kör Vitest före källkodsgenerering
  Så ska systemet godkänna det röda utfallet
  Men fortsätta blockera saknade externa npm-paket.

**Scenario: ATT FÖRLIKAS – En robust byggloop för UI-domäner**
  Givet att ändringarna i `scripts/run-planera-live.ts` tillämpas
  När `pnpm verify` körs
  Så ska alla skriptkontroller och arkitekturregler lysa 100 % gröna.
