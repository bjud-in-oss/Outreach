# TCK-MAINT-035: Global Startsanering, Scoped Happy-DOM och Dynamisk Konsolidering

**Måldomän:** `scripts` (`scripts/run-planera-live.ts`) & `vite.config.ts`
**Mekanisk Acceptans:** Ett transient skripttest bevisar att `run-planera-live.ts` vid varje start ovillkorligen rensar samtliga transienta testfiler (`src/__tests__/transient_*`) och ospårade filer under `src/`, att `vite.config.ts` konfigurerar `environmentMatchGlobs` med `happy-dom` för UI-tester, samt att Fas 3 konsoliderar testfiler med `${testExt}` utan att bryta regressionssviten (exit 0).

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **Global Startsanering (Poka-Yoke mot spökfiler):**
   - I `scripts/run-planera-live.ts` ska startsaneringen köras OVILLKORLIGEN (både när `isMaint` är sant och falskt):
     * Radera ALLA filer i `src/__tests__/` som matchar `transient_*.test.*`.
     * Skanna `git status --porcelain src/` och radera ALLA ospårade filer (`?? src/...`) så att arbetskatalogen är 100 % ren inför Fas 0.
2. **Scoped Happy-DOM i Vite-konfigurationen:**
   - I `vite.config.ts` ska sektionen `test` konfigureras med `environmentMatchGlobs: [['src/features/a2ui/**', 'happy-dom'], ['src/**/*.test.tsx', 'happy-dom']]` i stället för global `environment: 'happy-dom'`, så att rena backend-tester fortsätter köras snabbt i Node.
3. **Importspärr i Gate 3a Fail-First:**
   - I `scripts/run-planera-live.ts` ska Fail-First-grinden avvisa felloggar som innehåller `Failed to resolve import` eller `Cannot find package`.
4. **Dynamisk testextension vid Fas 3-konsolidering:**
   - På rad 807 i `scripts/run-planera-live.ts` MÅSTE `permanentTestPath` använda den dynamiska variabeln `testExt` i stället för hårdkodat `.test.ts`:
     `path.join(permanentTestDir, `${path.basename(primaryModule)}.test.${testExt}`)`

---

## Scenariotriad (Den relationella och systemiska avsikten)

**Scenario: ATT FÖLJA – En ren byggplatta och snabb testmiljö**
  Givet att Byggmotorn startar ett nytt uppdrag
  När startsaneringen och testmiljön initieras
  Så ska eventuella kvarlämnade spökfiler vara bortstädade och DOM-miljön endast laddas för UI-komponenter
  Och bygget exekverar snabbt och förutsägbart.

**Scenario: ATT VÄNDA OM – Avvisande av trasiga importer och felaktiga filändelser**
  Givet att ett transient test saknar ett paket eller innehåller JSX-komponenter
  När Gate 3a Fail-First och Fas 3-konsolideringen körs
  Så ska trasiga importer avvisas direkt och godkända TSX-tester arkiveras med `.test.tsx`
  Utan att oxc-parsern kraschar under slutverifiering.

**Scenario: ATT FÖRLIKAS – Helheten förblir grön och stabil**
  Givet att ändringarna i `scripts/run-planera-live.ts` och `vite.config.ts` tillämpas
  När `pnpm verify` körs
  Så ska samtliga tester och arkitekturkontroller passera med exit code 0.
