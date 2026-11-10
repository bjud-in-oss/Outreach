# BYGGCYKEL LOGG: TCK-048
**Starttid:** 2026-11-10T22:53:05.128Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-048: Kärnfull Relevans och Typberikning i Promptkompilatorn

**Måldomän:** `path` (`src/features/path/`)
**Mekanisk Acceptans:** Ett transient test bevisar Fail-First (exit 1) vid saknad domänkontext, passerar Gate 3a via funktionell minnesexekvering (noll syntetiska spioner), och avslutas med 100 % grön regressionssvit (exit 0).

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **Vaccin mot kontextsvält (Kärnfull Relevans):**
   - `kompileraPrompt` i `src/features/path/engine/promptCompiler.ts` får INTE banta bort domänens typdefinitioner för att nå ett godtyckligt tokental.
   - När en prompt sammanställs för faserna 'avsikt', 'provning' eller 'konstruktion' MÅSTE systeminstruktionen deterministiskt berikas med måldomänens aktiva typkontrakt (t.ex. `model/types.ts`) om sådana skickas med i `kontextMinne` eller via explicit parameter.
2. **Förbud mot syntetiska spioner (Gate 3a):**
   - Testfilen får INTE importera eller anropa `vi.fn()` eller `vi.spyOn()`. Alla utfall valideras genom primitiva tillståndsvariabler och direkta strängjämförelser i minnet.
3. **Bevara bakåtkompatibilitet i promptSchema:**
   - `PromptCompileInputSchema` och `CompiledPromptSchema` i `contracts/pathSchema.ts` ska förbli orubbliga sanningskällor (SSOT) och härleda typer via `z.infer`.
4. **Inga tysta fel:**
   - Felaktiga eller saknade indata till kompilatorn ska valideras strikt via schemat och kasta kontrollerade fel snarare än att generera tomma prompter.

---

## Scenariotriad (Den relationella och systemiska avsikten)

**Scenario: ATT FÖLJA – Modellen förses med full sanning och klar blick**
  Givet en måldomän med definierade typer och barrel-exporter
  När `kompileraPrompt` anropas för konstruktionsfasen
  Så ska den returnerade `systemInstruction` innehålla domänens fullständiga typdefinitioner
  Och beräknat token-antal ska återspegla den faktiska payloaden utan godtycklig trunkering.

**Scenario: ATT VÄNDA OM – Avvisande av förvanskad eller tom domänkontext**
  Givet att kompilatorn matas med ogiltig fas eller saknar obligatoriska uppdragsparametrar
  När kompileringen exekveras
  Så ska funktionen omedelbart kasta ett valideringsfel enligt Zod-kontraktet
  Och felaktiga antaganden ska inte släppas igenom till exekveringsmotorn.

**Scenario: ATT FÖRLIKAS – Helheten bevaras och resurser förblir fria från brus**
  Givet att kompileringen fullföljs framgångsrikt
  När svaret levereras
  Så ska den färdiga prompten vara helt renad från historiska felloggar och samtalstranskript
  Och endast det kärnfulla uppdraget och dess systemiska ramverk ska återstå.

```


#### 1a Att följa: Intention & Nytta
Hej! Jag är redo att sätta igång med att stärka promptkompilatorn så att den alltid behåller rätt typdefinitioner och kärnfull relevans. För att jag ska kunna göra ett så bra jobb som möjligt, finns det något särskilt scenario eller någon risk du tänker på som vi absolut behöver ta hänsyn till i det här arbetet?


#### 0a Att vända om: Kontraktsaudit
Jag har auditerat kontraktet för TCK-048 och kan bekräfta att avgränsningen till `path`-domänen är tydlig. Vi kommer att säkra att `kompileraPrompt` levererar fullständiga typdefinitioner och att våra tester håller sig till ren minnesexekvering utan syntetiska spioner. Allt är redo för nästa steg.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
För att lösa TCK-048 och säkerställa att kompilatorn bevarar domänens typkontrakt, har jag tagit fram följande tre separata alternativ:

Alternativ ett: Vi utökar `PromptCompileInput` med en specifik egenskap för direkt injektion av typdefinitioner.

Alternativ två: Kompilatorn läser automatiskt domänens `model/types.ts` via filsystemet och injekterar innehållet mekaniskt.

Alternativ tre: Vi bygger in ett dedikerat typlager i prompt-mallen, vilket separerar typdefinitioner från övriga och bibehåller relevans.


#### 2c Att vända om: Resiliensgranskning
Alternativ två innebär en hög risk för systemkrasch och bryter dessutom mot arkitekturprincipen om en isolerad VFS-miljö. Alternativ ett är absolut säkrast för långsiktig resiliens, då det kräver att typkontraktet injiceras explicit utan dolda filsystemberoenden.


#### 2d Att förlikas: Mättnad
Jag har vägt spänningsfältet mellan alternativen och ser tydligt att Alternativ ett är den trygga vägen framåt. Genom att injicera typkontraktet explicit skyddar vi systemets resiliens och eliminerar dolda beroenden. Jag låser nu detta kontrakt. MÄTTNAD: JA.


#### 3a Att följa: Testspecifikation



#### 3b Att följa: Källkod



#### 3c Att förlikas: Slutgiltigt Byggkontrakt
För att säkra att prompterna bibehåller full typkontext och är fria från ovidkommande brus, kommer vi att bevara `pathSchema.ts` och `index.ts` som de är. Vi skapar det transienta testet `promptCompiler.test.ts` och uppdaterar därefter `promptCompiler.ts` för att implementera de nödvändiga kraven för typberikning.
