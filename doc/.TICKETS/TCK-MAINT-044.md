# TCK-MAINT-044: Rekursiv Självrättningskontext och Sanering av Tysta Catch-block

**Måldomän:** `scripts`, `gemini_live_swarm`
**Målfiler:** `scripts/run-planera-live.ts`, `src/features/gemini_live_swarm/session/geminiLiveSession.ts`
**Mekanisk Acceptans:** Ett transient skripttest bevisar att `scripts/run-planera-live.ts` läser in domänens hela källkod (rekursivt eller utifrån `modifiedFiles` & `createdModules`) vid Fas 2:s självrättningsloop. Vidare åtgärdas befintliga tomma `catch {}`-block i `geminiLiveSession.ts` mekaniskt i detta underhållsarbete så att Gate 2c (`--check-catch-blocks`) passerar grönt inför framtida funktionella domänbyggen. Samtliga tester och arkitekturkontroller passerar med exit 0.

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **Djupseende Självrättningskontext i Fas 2 (`scripts/run-planera-live.ts`):**
   - I Fas 2:s `catch (vitestErr)`-block (runt rad 818), ändra logiken för `currentSourceSummary`. I stället för ett oflexibelt och icke-rekursivt `fs.readdirSync`, skapa en hjälpfunktion inuti catch-blocket:
     ```typescript
     const getAllTsFiles = (dir: string): string[] => {
       if (!fs.existsSync(dir)) return [];
       let results: string[] = [];
       for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
         const full = path.join(dir, entry.name);
         if (entry.isDirectory() && entry.name !== '__tests__') {
           results = results.concat(getAllTsFiles(full));
         } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
           results.push(full);
         }
       }
       return results;
     };
     ```
   - Bygg sedan `currentSourceSummary` genom att loopa över resultatet från `getAllTsFiles(domainDir)` och skriva ut innehållet, så att modellen ALDRIG är blind för filer i undermappar under självrättningen.
2. **Sanering av Gate 2c-brott i `src/features/gemini_live_swarm/session/geminiLiveSession.ts`:**
   - Det finns två förbefintliga tomma catch-block i filen som hindrar framtida funktionsbyggen (`TCK-051`). Ersätt dem mekaniskt via `apply_patch`:
     * Byt ut `if (this.activeSdkSession?.close) { try { this.activeSdkSession.close(); } catch {} }` mot `if (this.activeSdkSession?.close) { try { this.activeSdkSession.close(); } catch (err) { console.warn('[GeminiLiveSession] close', err); } }`
     * Byt ut `private notifyListeners(chunk: LiveStreamChunk): void { for (const listener of this.streamListeners) { try { listener(chunk); } catch {} } }` mot `private notifyListeners(chunk: LiveStreamChunk): void { for (const listener of this.streamListeners) { try { listener(chunk); } catch (err) { console.warn('[GeminiLiveSession] listener', err); } } }`
3. **Bevara skript- och FSD-invarianter:**
   - Inga andra funktionsändringar får göras. Syftet är uteslutande att härda byggmotorn och rensa den tekniska skulden i domänen.

---

## Scenariotriad (Den relationella och systemiska avsikten)

**Scenario: ATT FÖLJA – Modellen ser sin egen källkod vid fel**
  Givet att en källkodsagent introducerar ett fel i en undermapp (t.ex. `session/liveBridge.ts`)
  När Vitest underkänner bygget och självrättningsloopen triggas i Fas 2
  Så ska det nya rekursiva anropet läsa in filen och infoga dess innehåll i `retryAnchor`
  Och agenten kan laga felet direkt utan att gissa blint.

**Scenario: ATT VÄNDA OM – Avvisande av förbefintlig Gate 2c-skuld**
  Givet att äldre kod innehåller tysta catch-block som fångas av vår nya striktare AST-skanner
  När vi rensar dessa genom underhåll (MAINT)
  Så belastar vi inte framtida funktionella biljetter (t.ex. TCK-051) med att behöva gissa och städa upp kod de inte själva skrivit
  Så att domänbyggen förblir fokuserade.

**Scenario: ATT FÖRLIKAS – En redo och transparent motor inför TCK-051**
  Givet att skript och domänkod har uppdaterats
  När `pnpm verify` körs
  Så passerar samtliga tester och Gate 2c med exit 0.
