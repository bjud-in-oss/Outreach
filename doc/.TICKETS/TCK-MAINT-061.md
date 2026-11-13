# TCK-MAINT-061: Förbjud vi.fn() och tautologier i Steg 3a-prompten och aktivera universell saneraSkordadLegacy

**Måldomän:** `scripts`
**Målfiler:** `scripts/run-planera-live.ts`
**Mekanisk Acceptans:**
1. `scripts/run-planera-live.ts` (strikt <= 980 rader) inkluderar en uttrycklig regel 7 i Steg 3a-instruktionen (runt rad 349) samt i `recoveryPrompt` (runt rad 403) som förbjuder `vi.fn()`, `vi.spyOn()`, `jest.fn()`, `fs.readFileSync` och `expect(true).toBe(true)` och instruerar modellen att använda vanliga tillståndsvariabler (`let anropad = false;`).
2. Rad 867 i `scripts/run-planera-live.ts` ändras från `if (!isMaint) saneraSkordadLegacy(ticketPath);` till `saneraSkordadLegacy(ticketPath);` så att skördade legacy-filer städas för samtliga biljettyper.
3. `pnpm verify` passerar med exit 0.

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **Kirurgiska patchar i `scripts/run-planera-live.ts` (nu 965 rader, håll totalen <= 980 rader):**
   - Lägg till `7. INGA SPIONER ELLER ALIBIN (GATE 3a): Använd ALDRIG vi.fn(), vi.spyOn(), jest.fn(), fs.readFileSync eller expect(true).toBe(true) i testet. Använd rena tillståndsvariabler (let anropad = false;) och minnesobjekt.` direkt efter punkt 6 i Steg 3a (runt rad 349).
   - Uppdatera `recoveryPrompt` (runt rad 403) till att även ange: `Ta bort all import av 'vi' och ersätt varje vi.fn()/vi.spyOn() med vanliga variabler (let anropad = false;) utan tautologier.`.
   - Ändra `if (!isMaint) saneraSkordadLegacy(ticketPath);` (rad 867) till `saneraSkordadLegacy(ticketPath);`.

---

## Scenariotriad (Den relationella och systemiska avsikten)

**Scenario: ATT FÖLJA – Steg 3a genererar Gate 3a-rena tester direkt i vända 1**
  Givet att Steg 3a-prompten tydligt förbjuder `vi.fn()` och tautologiska assertions
  När ett funktionsbygge som `TCK-060` kör Steg 3a
  Så genereras rena körtidstester med vanliga tillståndsvariabler utan att fastna i Gate 3a-loopen.

**Scenario: ATT VÄNDA OM – Universell städning av skördad legacy**
  Givet att `saneraSkordadLegacy` tidigare hoppades över för `MAINT`-biljetter
  När `if (!isMaint)`-spärren tas bort på rad 867
  Så städas skördade `*.legacy.ts`-filer bort efter grön `pnpm verify` oavsett biljettyp.

**Scenario: ATT FÖRLIKAS – Grön verifiering i hela repot**
  Givet att `scripts/run-planera-live.ts` är uppdaterad och under 980 rader
  När `pnpm verify` körs
  Så passerar kompilering, radgränser och tester med exit 0.
