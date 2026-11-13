# BYGGCYKEL LOGG: TCK-MAINT-060
**Starttid:** 2026-11-13T22:22:46.807Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
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

```


#### 1a Att följa: Intention & Nytta
Hej! Intentionen med det här uppdraget är att stärka systemets egen felhantering. Genom att ge agenten direkt tillgång till källkod och typer i självrättningsloopen minskar vi gissningar och ser till att kanalen fortsätter tills samtliga filer är korrekt åtgärdade. Det innebär stabilare underhållsbiljetter och färre avbrott.


#### 0a Att vända om: Kontraktsaudit



#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
För att uppfylla kraven i TCK-MAINT-060 kring källkodsankare och muteringskontroll har jag tagit fram följande tre ortogonala alternativ:

Alternativ 1 innebär en direkt injicering av källkodsankaret och konfigurationen direkt i felhanteringsblocket. Detta håller ändringarna lokala, kompakta och lätta att granska.

Alternativ 2 extraherar logiken för hämtning av källkodsfiler och anropet till `runMicroChannel` till en dedikerad lokal hjälpförfunktion i `run-planera-live.ts`. Detta skapar en renare struktur som underlättar framtida underhåll av självrättningsloopen.

Alternativ 3 strukturerar om loopkörningen till att använda ett deklarativt konfigurationsobjekt för `maxTurns` och `onMutationCheck`. Detta gör koden mer modulär och flexibel för framtida parameterjusteringar.


#### 2c Att vända om: Resiliensgranskning
Alternativ 1 ger bäst resiliens och minst risk eftersom den kirurgiska ersättningen i rad 668 till 686 håller alla ändringar helt isolerade utan att introducera nya lokala hjälpfunktioner eller bryta mot repots radgränser.


#### 2d Att förlikas: Mättnad
Jag bekräftar att Alternativ 1 är det vinnande kontraktet. Det ger bäst resiliens och lägst risk. MÄTTNAD: JA.
