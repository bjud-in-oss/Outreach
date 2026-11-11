# BYGGCYKEL LOGG: TCK-MAINT-035
**Starttid:** 2026-11-11T22:01:15.337Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-MAINT-035: Dynamisk Testextension vid Fas 3-konsolidering

**Måldomän:** `scripts` (`scripts/run-planera-live.ts`)
**Mekanisk Acceptans:** Ett transient skripttest bevisar att Fas 3 i `run-planera-live.ts` sparar den permanenta testfilen med samma dynamiska ändelse (`testExt`) som transient-testet (`${path.basename(primaryModule)}.test.${testExt}`), samt att den lokala Fas 2-valideringen och regressionssviten passerar med exit 0.

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **Bevara testextension vid konsolidering:**
   - I `scripts/run-planera-live.ts` (Fas 3) MÅSTE variabeln `permanentTestPath` använda den dynamiska variabeln `testExt` i stället för hårdkodat `.test.ts`:
     `path.join(permanentTestDir, `${path.basename(primaryModule)}.test.${testExt}`)`
2. **Bevara FSD- och skriptinvarianter:**
   - Inga ändringar får göras i domänlogiken under `src/features/`. Ändringen berör uteslutande Fas 3 i orkestreringsskriptet.

---

## Scenariotriad (Den relationella och systemiska avsikten)

**Scenario: ATT FÖLJA – Testsviten förblir intakt efter konsolidering**
  Givet ett godkänt transient UI-test med ändelsen `.tsx`
  När Fas 3 konsoliderar testet till domänens permanenta mapp
  Så ska filen sparas som `.test.tsx`
  Och slutverifieringen (`pnpm verify`) exekverar testet rent utan parserfel.

**Scenario: ATT VÄNDA OM – Avvisande av filändelseförvanskning**
  Givet en JSX-innehållande testfil
  När systemet skriver filen till disk
  Så får den aldrig tvingas till ren `.ts`
  Så att oxc-kompilatorn inte kastar syntaxfel på JSX-taggar.

**Scenario: ATT FÖRLIKAS – En friktionsfri väg för A2UI**
  Givet att konsolideringen är harmoniserad
  När `pnpm verify` körs
  Så ska alla skriptkontroller och arkitekturregler lysa grönt
  Och vägen är helt öppen för TCK-050.

```


#### 1a Att följa: Intention & Nytta
Det här underhållet handlar om att se till att våra testfiler behåller sin rätta och dynamiska filändelse, särskilt när vi jobbar med gränssnittstester som behöver .tsx. Genom att anpassa konsolideringen säkerställer vi att inga syntaxfel uppstår och att systemet förblir helt intakt och friktionsfritt vid varje verifiering. Är det rätt förstått att vi ska genomföra den här ändringen i skriptet?


#### 0a Att vända om: Kontraktsaudit
Kontraktsaudit är genomförd och jag bekräftar att uppdraget är korrekt förstått. Ändringen berör enbart skriptet och säkrar att dynamiska filändelser bevaras för att förhindra syntaxfel vid konsolidering.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
Här är tre ortogonala alternativ för lösning:

Alternativ 1: Direkt variabelinjektion. Vi ersätter den hårdkodade strängen för `permanentTestPath` i `run-planera-live.ts` med en mall-literal som använder variabeln `testExt` för att dynamiskt sätta filändelsen.

Alternativ 2: Abstraktion via en hjälpfunktion. Vi skapar en dedikerad verktygsfunktion i `scripts/` som tar primärmodulen och dess ändelse som argument och returnerar den fullständiga, korrekta sökvägen.

Alternativ 3: Kontextdriven patogenering. Vi bygger ut testkontexten med en dedikerad egenskap för filändelsen som i Fas 3 används för att bygga den permanenta sökvägen, vilket säkerställer fullständig integration med rådande arkitekturflöde.


#### 2c Att vända om: Resiliensgranskning
Resiliensgranskningen visar att Alternativ 1, direkt variabelinjektion, är den mest resilienta vägen. Den minimerar kognitiv förankring och håller ändringen exakt där felet uppstår, vilket förhindrar laterala fel i skriptets struktur. Vi undviker fragmentering genom nya hjälpfunktioner. Resiliensen maximeras genom en ren och direkt operation.


#### 2d Att förlikas: Mättnad
Vi har vägt spänningsfältet och slår fast att Alternativ 1, direkt variabelinjektion, är det absolut vinnande kontraktet för maximal resiliens. MÄTTNAD: JA.
