# BYGGCYKEL LOGG: TCK-MAINT-051
**Starttid:** 2026-11-12T15:12:41.705Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-MAINT-051: Modulär radgränsspärr (sizeGate.js) och undantagsfri rekursiv domänläckagekontroll för scripts/

**Måldomän:** `scripts`
**Målfiler:** `scripts/lib/sizeGate.js`, `scripts/verify-architecture.js`
**Mekanisk Acceptans:**
1. `scripts/lib/sizeGate.js` (< 250 rader) exporterar `validateCodebaseLineLimits(rootDir)` som kontrollerar både `scripts/` (max 250 rader; ratchet `run-planera-live.ts`: 1000, `bidiLiveRunner.ts`: 345) och `src/features/` (max 125 rader för `.tsx`, max 250 rader för `.ts`; ratchet `geminiLiveSession.ts`: 260, `sessionIntentAudio.ts`: 300).
2. Grind 2 i `scripts/verify-architecture.js` skannar rekursivt SAMTLIGA `.ts`- och `.js`-filer under `scripts/` (inklusive `scripts/lib/` och `scripts/drivers/`, exklusive `__tests__`) via TypeScript AST och avvisar utan undantag alla statiska/dynamiska importer av FSD-domäner utanför `'path'` och `'shared'`.
3. `scripts/verify-architecture.js` hålls strikt under 210 rader, och `pnpm verify` passerar med exit 0.

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **Skapa `scripts/lib/sizeGate.js` (< 250 rader):**
   - Exportera `validateCodebaseLineLimits(rootDir)` som returnerar antalet radgränsbrott (`number`) och skriver tydliga felmeddelanden (`❌ RADGRÄNSBROTT ...`).
   - Hoppa över `__tests__`, `node_modules` och `.legacy.`-filer.
   - Använd `LEGACY_SCRIPT_CAPS = { 'run-planera-live.ts': 1000, 'bidiLiveRunner.ts': 345 }` för `scripts/` och `LEGACY_FEATURE_CAPS = { 'geminiLiveSession.ts': 260, 'sessionIntentAudio.ts': 300 }` för `src/features/`.
2. **Uppdatera Grind 2 & Grind 4 i `scripts/verify-architecture.js` (< 210 rader):**
   - Importera `validateCodebaseLineLimits` från `'./lib/sizeGate.js'` och ersätt `checkScriptSize` (rad 177–211) med `const scriptSizeViolations = validateCodebaseLineLimits(ROOT_DIR);`.
   - Uppdatera Grind 2 (rad 92–121) till att rekursivt gå igenom hela `SCRIPTS_DIR` (hoppa över `__tests__` och `node_modules`). Kontrollera både statiska `ImportDeclaration`/`ExportDeclaration` och dynamiska `import(...)` efter sökvägar som matchar `features/<domän>` (inkl. `@/features/<domän>`). Tillåt uteslutande `dom === 'path' || dom === 'shared'`.

---

## Scenariotriad (Den relationella och systemiska avsikten)

**Scenario: ATT FÖLJA – Undantagsfritt skydd mot domänläckage och radsvullnad**
  Givet att `samrad.ts` nu importerar från `src/shared/` och `scripts/lib/` växer
  När `pnpm verify` körs
  Så skannar Grind 2 rekursivt varje skriptfil utan undantag och `sizeGate.js` kontrollerar radgränser i både `src/features/` och `scripts/`
  Vilket garanterar strikt arkitekturdisciplin.

**Scenario: ATT VÄNDA OM – Avvisande av hårdkodade skriptlistor**
  Givet att Grind 2 tidigare enbart granskade `run-planera-live.ts` och `run-tests.js`
  När skanningen görs rekursiv över hela `SCRIPTS_DIR`
  Så kan ingen ny fil i `scripts/lib/` smyga in otillåtna domänimporter.

**Scenario: ATT FÖRLIKAS – Grön verifiering i hela repot**
  Givet att `sizeGate.js` och `verify-architecture.js` är sparade
  När `pnpm verify` körs
  Så passerar samtliga grindar och tester med exit 0.

```


#### 1a Att följa: Intention & Nytta
Jag förstår verkligen intentionen med det här uppdraget. Det handlar om att skapa en tryggare arkitektur och förhindra att kodbasen växer okontrollerat i våra hjälpskript. Hur ser din bild ut av hur dessa nya regler kommer att underlätta det framtida samarbetet i teamet?


#### 0a Att vända om: Kontraktsaudit
Jag har granskat kontraktet för TCK-MAINT-051. Det uppfyller systemreglerna för modulär expansion och destruktiv sanering. Vi kommer att införa `sizeGate.js` och förstärka arkitekturkontrollen rekursivt över `scripts/` för att garantera full isolering. Kontraktet är därmed godkänt.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
För att lösa TCK-MAINT-051 formulerar jag här tre ortogonala alternativ:

Alternativ ett innebär att vi använder Node.js inbyggda `fs`- och `path`-moduler för rekursiv filgenomgång, där radgränser kontrolleras genom att läsa filer och räkna radbrytningar, samt att reguljära uttryck används för att avvisa otillåtna FSD-importer.

Alternativ två fokuserar på fullständig TypeScript AST-analys genom att använda `typescript`-paketet för att exakt identifiera importdeklarationer och dynamiska importsamt säkerställa arkitekturdisciplin på nodnivå.

Slutligen innebär alternativ tre en uppdelad hantering där vi använder en anpassad AST-visitor för importkontroll och kombinerar detta med en optimerad bufferläsning i `sizeGate` för att upprätthålla prestanda och precision i hela repot.


#### 2c Att vända om: Resiliensgranskning
Vid en resiliensgranskning av alternativen ser jag att alternativ ett är sårbart för felaktigheter genom reguljära uttryck. Alternativ två är korrekt, men alternativ tre kombinerar AST-precision med effektiv bufferläsning, vilket ger bäst resiliens och prestanda.


#### 2d Att förlikas: Mättnad
Efter att ha vägt samman perspektiven i spänningsfältet och mätt det semantiska deltat står det klart att alternativ tre är det vinnande kontraktet. Det kombinerar AST-precision med effektiv bufferläsning, vilket ger bäst resiliens och prestanda. MÄTTNAD: JA.
