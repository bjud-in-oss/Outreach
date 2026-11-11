# BYGGCYKEL LOGG: TCK-MAINT-034
**Starttid:** 2026-11-11T21:52:59.257Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-MAINT-034: TSX-stöd för Transienta Tester och Syntaxspärr i Fail-First

**Måldomän:** `scripts` (`scripts/run-planera-live.ts`)
**Mekanisk Acceptans:** Ett transient skripttest bevisar att `run-planera-live.ts` dynamiskt väljer ändelsen `.tsx` för transienta tester när måldomänen innehåller `.tsx`-filer eller rör UI/React, att Fail-First avvisar transformerings- och syntaxfel (`PARSE_ERROR` / `Transform failed`), samt att regressionssviten passerar med exit 0.

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **Dynamisk testextension (.ts vs .tsx):**
   - I `scripts/run-planera-live.ts` ska transient-testets ändelse härledas dynamiskt:
     * Om `targetDomain === 'a2ui'`, om `ticketPrompt` innehåller `.tsx` / `React`, eller om domänkatalogen innehåller `.tsx`-filer, ska `testExt` sättas till `'tsx'`. Annars `'ts'`.
     * `transientTestFile` ska definieras som `src/__tests__/transient_${ticketId}.test.${testExt}`.
2. **Startsanering och Fas 3-konsolidering:**
   - Startsaneringen ska radera både eventuell `.test.ts` och `.test.tsx` för den aktuella biljetten.
   - I Fas 3 ska den permanenta testfilen konsolideras med samma `testExt` (`${path.basename(primaryModule)}.test.${testExt}`).
3. **Syntaxspärr i Gate 3a Fail-First:**
   - I Fas 1 får `failFirstOutput` inte accepteras om den innehåller `PARSE_ERROR`, `Transform failed` eller syntaxfel som indikerar att testkoden är ogiltig snarare än att källkoden saknas.
4. **Bevara orkestreringsinvarianter:**
   - Befintliga kvalitetsgrindar för skriptdomänen (`verify-architecture.js` och `npx vitest run scripts/__tests__/`) ska förbli 100 % intakta.

---

## Scenariotriad (Den relationella och systemiska avsikten)

**Scenario: ATT FÖLJA – UI-tester exekveras med fullständigt JSX-stöd**
  Givet en byggbiljett för en React- eller A2UI-komponent
  När transient-testet genereras i Fas 1
  Så ska testfilen skapas med ändelsen `.tsx`
  Och testmotorn parsar JSX-komponenter rent utan transformeringskrascher.

**Scenario: ATT VÄNDA OM – Avvisande av syntaxfel som "Fail-First"**
  Givet att en testfil genereras med parser- eller transformeringsfel
  När testet provkörs i Fas 1
  Så ska systemet neka testet och begära självrättning direkt
  I stället för att feltolka en syntaxkrasch som ett godkänt rött test.

**Scenario: ATT FÖRLIKAS – En helgjuten byggmotor för både backend och frontend**
  Givet att `run-planera-live.ts` uppdateras
  När skripttesterna och arkitekturgranskaren körs
  Så ska ändringen godkännas lokalt
  Och vägen är fri för TCK-050 att exekveras grönt.

```


#### 1a Att följa: Intention & Nytta
Jag förstår precis målet med TCK-MAINT-034. Det handlar om att göra vår byggmotor mer träffsäker för frontend-utveckling genom att sömlöst stödja .tsx-filer i transienta tester. Samtidigt bygger vi in en viktig spärr mot syntaxfel i Fail-First-fasen, så att vi undviker att misstolkas trasig kod som godkända röda tester. Det här ger en stabilare grund för framtida UI-arbete. Är det rätt uppfattat så sätter jag igång.


#### 0a Att vända om: Kontraktsaudit
Kontraktet för TCK-MAINT-034 är auditerat och godkänt. Vi säkerställer fullt TSX-stöd och en robust spärr mot syntaxfel i Fail-First, vilket stärker systemets resiliens och banar väg för nästa fas.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
De tre alternativen för att lösa dynamisk testextension och syntaxspärr är följande:

Alternativ 1 bygger på en explicit domänmappning, där vi i `run-planera-live.ts` hårdkodar logiken att använda `.tsx` om `targetDomain` är `a2ui`.

Alternativ 2 föreslår en proaktiv filskanning, där vi kontrollerar om domänkatalogen innehåller några `.tsx`-filer och i så fall väljer rätt extension.

Alternativ 3 innebär en spekulativ kompilering, där vi först testar att generera som `.ts`, men vid en `PARSE_ERROR` i Fail-First omedelbart ställer om och retryar med `.tsx` för UI-domäner.


#### 2c Att vända om: Resiliensgranskning
Resiliensgranskningen visar att Alternativ 2, proaktiv filskanning, är bäst. Det anpassar teständelsen deterministiskt baserat på domänens faktiska innehåll och uppfyller FSD-isoleringen perfekt. Vi undviker komplexa omkompileringsförsök i Fail-First, vilket minimerar risken för obskyra tillståndskrascher.


#### 2d Att förlikas: Mättnad
Alternativ 2 är det vinnande kontraktet. Genom att använda proaktiv filskanning anpassar vi teständelsen deterministiskt efter domänens faktiska innehåll, vilket uppfyller FSD-isoleringen perfekt. Vi minimerar även risken för tillståndskrascher genom att undvika komplexa omkompileringsförsök. MÄTTNAD: JA.
