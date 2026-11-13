# BYGGCYKEL LOGG: TCK-MAINT-061
**Starttid:** 2026-11-13T22:40:54.318Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
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

```


#### 1a Att följa: Intention & Nytta
Syftet med denna uppdatering är att stärka kvalitetssäkringen i våra utvecklingsflöden. Genom att förbjuda syntetiska spioner och garantera att all legacy-kod städas undan, ser vi till att våra tester förblir helt autentiska och att arbetsytan hålls ren. Detta skapar en mer pålitlig och resilient utvecklingsmiljö.


#### 0a Att vända om: Kontraktsaudit
Jag har granskat kontraktet för TCK-MAINT-061. Omfånget är tydligt begränsat till nödvändiga ändringar i `scripts/run-planera-live.ts` för att stärka kvalitetssäkringen och säkerställa renare testning. Jag godkänner detta uppdrag.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
De tre ortogonala alternativen för lösning är som följer:

Alternativ 1 innebär direkt patchning av alla tre förändringar i en enda atomisk operation. Alternativ 2 bygger på inkrementell modifiering där instruktionsuppdateringar separeras från den operativa logikförändringen. Alternativ 3 innebär fullständig blockersättning för att säkerställa att hela kontextuella block uppdateras korrekt.


#### 2c Att vända om: Resiliensgranskning
Granskning av alternativen visar att fullständig blockersättning, alternativ 3, är mest resilient då det garanterar kontextuell konsistens för de nya reglerna utan risk för partiella uppdateringar. Genom att uppdatera hela blocket säkras spårbarhet och minskad felkvot vid felpropagering.


#### 2d Att förlikas: Mättnad
Jag bekräftar att alternativ 3, fullständig blockersättning, är det vinnande kontraktet. Denna strategi säkerställer arkitektonisk resiliens och absolut kontextuell konsistens. MÄTTNAD: JA.
