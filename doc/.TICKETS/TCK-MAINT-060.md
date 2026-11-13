# TCK-MAINT-060: Injicera källkodsankare (buildRetryAnchor) och full muteringskontroll i MAINT-självrättningen

**Måldomän:** `scripts`
**Målfiler:** `scripts/run-planera-live.ts`
**Mekanisk Acceptans:**
1. `scripts/run-planera-live.ts` (strikt <= 975 rader) bygger ett live-källkodsankare via `buildRetryAnchor('', currentMaintSource, errLog)` över `[...modifiedFiles, ...getRequiredFiles(), 'src/features/path/model/types.ts']` i `MAINT`-självrättningsloopen (rad 670–686), höjer `maxTurns` till `5`, använder `onMutationCheck: isFas2Complete` och förbjuder `require()` i självrättningsprompten.
2. `pnpm verify` passerar med exit 0.

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **Kirurgisk ersättning i `scripts/run-planera-live.ts` (rad 668–686, håll totalen <= 975 rader):**
   - Ersätt blocket från `const errLog = err.stdout?.toString() || err.stderr?.toString() || err.message;` till och med `getFollowupPrompt: getFas2FollowupPrompt` + `);` med:
     * Samla aktuellt innehåll för `Array.from(new Set([...modifiedFiles, ...getRequiredFiles(), 'src/features/path/model/types.ts']))` i `currentMaintSource`.
     * Bygg `const maintRetryAnchor = buildRetryAnchor('', currentMaintSource, errLog);`.
     * Anropa `runMicroChannel('Att vända om', maintRetryPrompt, maintRetryAnchor, systemInstruction, codegenTools, executeFas2Tools, { requireMutation: true, maxTurns: 5, onMutationCheck: isFas2Complete, getFollowupPrompt: getFas2FollowupPrompt });`.
   - Behåll alla befintliga importer och rader utanför rad 668–686 orörda.

---

## Scenariotriad (Den relationella och systemiska avsikten)

**Scenario: ATT FÖLJA – MAINT-självrättning får omedelbar sikt över sina egna ändringar och path-typer**
  Givet att ett `MAINT`-bygge fallerar i `verify-architecture.js`, `vitest` eller `esbuild`
  När `MAINT`-självrättningen startar i Fas 2
  Så får modellen felloggen, målfilerna och `src/features/path/model/types.ts` direkt i `maintRetryAnchor` och har upp till 5 vändor med `isFas2Complete`
  Vilket gör att flerfiliga underhållsbiljetter självrättas utan blinda `read_file`-vändor eller typgissningar.

**Scenario: ATT VÄNDA OM – Avvisande av förtida avslut efter första filen**
  Givet att ett `MAINT`-fel berör flera filer
  När `onMutationCheck: isFas2Complete` används i stället för `() => codeSaved`
  Så fortsätter kanalen tills samtliga målfiler är åtgärdade.

**Scenario: ATT FÖRLIKAS – Grön verifiering i hela repot**
  Givet att `scripts/run-planera-live.ts` är uppdaterad och under 975 rader
  När `pnpm verify` körs
  Så passerar kompilering, radgränser och tester med exit 0.
