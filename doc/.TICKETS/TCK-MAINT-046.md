# TCK-MAINT-046: Avgränsa självrättningskontext i Fas 2 till målfiler för att skydda 65K TPM

**Måldomän:** `scripts`
**Målfiler:** `scripts/run-planera-live.ts`
**Mekanisk Acceptans:** Vid fel i Fas 2:s självrättningsslinga (`while (!testPassed && attempts < 3)`) bygger `scripts/run-planera-live.ts` `currentSourceSummary` uteslutande utifrån `modifiedFiles` och `getRequiredFiles()` (i stället för att dumpa hela domänkatalogen på >130 KB i ett enda WebSocket-meddelande). Samtliga skripttester, domäntester och FSD-kontroller passerar med exit 0.

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **Avgränsa `currentSourceSummary` i `scripts/run-planera-live.ts`:**
   - I Fas 2:s `catch (vitestErr)`-block (runt rad 818): ersätt rekursiv inläsning av hela `domainDir` med att enbart läsa filerna i `Array.from(new Set([...modifiedFiles, ...getRequiredFiles()]))` som existerar på disk.
   - Detta håller `retryAnchor` mager (< 25 KB) och förhindrar `WS 1011`-avbrott orsakade av överdimensionerade WebSocket-ramar.
2. **Bevara övriga faser och skriptinvarianter:**
   - Ändringen berör uteslutande `scripts/run-planera-live.ts`.

---

## Scenariotriad (Den relationella och systemiska avsikten)

**Scenario: ATT FÖLJA – Självrättningsagenten får exakt sina ändrade filer utan att spränga TPM-taket**
  Givet att en fil i en undermapp (t.ex. `session/geminiLiveSession.ts`) fallerar i Fas 2
  När självrättningsloopen bygger `retryAnchor`
  Så inkluderas endast `modifiedFiles` och `getRequiredFiles()`
  Och WebSocket-sändningen går igenom utan `WS 1011`.

**Scenario: ATT VÄNDA OM – Avvisande av 130 KB-dumpar över Live WebSocket**
  Givet att en stor domän innehåller 30+ filer
  När `currentSourceSummary` byggs
  Så får aldrig hela domänkatalogen serialiseras in i startankaret
  Utan agenten använder `read_file` om den behöver inspektera andra filer.

**Scenario: ATT FÖRLIKAS – En resilient byggmotor inför TCK-052**
  Givet att `scripts/run-planera-live.ts` är uppdaterad
  När `pnpm verify` körs
  Så passerar samtliga skript- och domäntester med exit 0.
