# BYGGCYKEL LOGG: TCK-MAINT-035
**Starttid:** 2026-11-12T07:13:35.130Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
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

```


#### 1a Att följa: Intention & Nytta
Det här uppdraget handlar om att skapa en helt ren och stabil grund för alla våra framtida byggcykler. Genom att ovillkorligen städa bort gamla testfiler, optimera testmiljön för UI och se till att konsolideringen sker med rätt ändelser, slipper vi konstigheter som spökfiler och trasiga importfel. Det gör att hela systemet blir mer förutsägbart och effektivt.


#### 0a Att vända om: Kontraktsaudit
Uppdraget för TCK-MAINT-035 är nu granskat och förstått. Vi har en tydlig plan för ovillkorlig startsanering, optimerad testmiljö med Happy-DOM och strikt importkontroll. Alla systemiska invarianter och destruktiva steg är säkrade. Vi är redo att gå vidare med nästa planeringsfas.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
För att lösa TCK-MAINT-035 formulerar jag tre ortogonala alternativ.

Alternativ 1 bygger på integrerad terminal-exekvering, där vi använder `child_process` för att utföra alla rensnings- och gitkommandon direkt.

Alternativ 2 fokuserar på programmatisk Node.js-logik, där vi använder `fs/promises` intensivt för att läsa av filsystemet och parsas resultatet från `git status` i Typescript för ökad typ-säkerhet.

Alternativ 3 innebär modulär domänisolering, där vi extraherar all saneringslogik till en isolerad modul som anropas genom definierade kontrakt, vilket gör systemet mer testbart.


#### 2c Att vända om: Resiliensgranskning
Alternativ ett innebär snabb exekvering via terminalen men riskerar att dölja fel om kommandona skulle fallera. Alternativ två ger god typ-säkerhet och kontroll men kan bli komplext att underhålla vid förändringar. Alternativ tre är mest resilient tack vare modulär isolering vilket underlättar framtida tester och felhantering.


#### 2d Att förlikas: Mättnad
Efter att ha vägt alternativen och beaktat vårt mål om resiliens och långsiktig stabilitet står det klart att alternativ tre är det vinnande alternativet. Den modulära isoleringen ger oss den felmarginal och den testbarhet vi behöver. MÄTTNAD: JA.
