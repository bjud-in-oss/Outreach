# BYGGCYKEL LOGG: TCK-MAINT-036
**Starttid:** 2026-11-12T07:22:56.970Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-MAINT-036: Skydd mot 0-bytesfiler i Fas 2 och Precisionsspärr i Fail-First

**Måldomän:** `scripts` (`scripts/run-planera-live.ts`)
**Mekanisk Acceptans:** Ett transient skripttest bevisar att `getMissingFiles()` i `run-planera-live.ts` betraktar tomma 0-bytesfiler som saknade, att Fail-First tillåter oskapade relativa importer till `../features/${targetDomain}` men blockerar saknade externa paket, samt att regressionssviten passerar med exit 0.

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **0-bytes-skydd i getMissingFiles():**
   - I `scripts/run-planera-live.ts` MÅSTE `getMissingFiles()` returnera en fil som saknad om filen antingen inte existerar på disk ELLER har filstorlek 0 bytes (`fs.statSync(fullPath).size === 0`).
   - Därmed tvingar `getFas2FollowupPrompt()` modellen att anropa `save_code` i stället för att fastna på `apply_patch` mot en tom fil.
2. **Precisionsspärr för importer i Gate 3a Fail-First:**
   - I `scripts/run-planera-live.ts` ska Fail-First-grinden enbart underkänna `Failed to resolve import` om felet avser externa paket (d.v.s. INTE när felloggen refererar till `../features/${targetDomain}`, vilket är en legitim Fail-First-orsak innan Fas 2 skapat filen).
3. **Epistemisk läsning i Steg 3a:**
   - Instruktionen för Steg 3a i `run-planera-live.ts` ska uppmana modellen att via `read_file` inspektera befintliga filer i `src/features/${targetDomain}/` (t.ex. `renderer.tsx` och katalogkomponenter) innan den formulerar assertions på komponent-ID och props.

---

## Scenariotriad (Den relationella och systemiska avsikten)

**Scenario: ATT FÖLJA – Tomma filer fylls direkt via save_code**
  Givet att en målfil i kontraktet saknas eller är 0 bytes på disk
  När Fas 2 utvärderar saknade filer
  Så ska filen flaggas som saknad och modellen instrueras att anropa `save_code`
  Så att källkoden skrivs utan att fastna i läs-loopar.

**Scenario: ATT VÄNDA OM – Legitimt rött test vid oskapad domänmodul**
  Givet att ett transient test importerar en ny modul från `../features/${targetDomain}/...`
  När Fail-First-grinden kör Vitest före källkodsgenerering
  Så ska systemet godkänna det röda utfallet
  Men fortsätta blockera saknade externa npm-paket.

**Scenario: ATT FÖRLIKAS – En robust byggloop för UI-domäner**
  Givet att ändringarna i `scripts/run-planera-live.ts` tillämpas
  När `pnpm verify` körs
  Så ska alla skriptkontroller och arkitekturregler lysa 100 % gröna.

```


#### 1a Att följa: Intention & Nytta
Hej. Jag förstår att syftet med detta underhåll är att göra vår byggloop mer robust och resilient. Genom att införa skydd mot 0-bytesfiler och precisera hur vi hanterar importfel i Fail-First-grinden, förebygger vi tysta loopar och skapar en mer förutsägbar process. Vill du berätta kort om den positiva effekten du hoppas uppnå med detta för vår miljö?


#### 0a Att vända om: Kontraktsaudit
Kontraktsaudit slutförd. Ingen FSD-domän under `src/features` påverkas, och inga brytningar mot arkitekturkontraktet har identifierats. Systemets integritet är säkrad.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
De tre ortogonala alternativen för lösningen är:

Först, in-place-direkt modifiering, där vi direkt uppdaterar `getMissingFiles` med filstorlekskontroll och justerar felloggsfiltret i Gate 3a.

Sedan, modulär hjälpar-injektering, vilket innebär att vi skapar rena, isolerade funktioner för att hantera filvalidering och importanalys inom samma skript.

Slutligen, pre-flight tillståndsvalidering, där vi lägger till en dedikerad kontroll av både diskskick och importvägar innan Vitest exekveras.


#### 2c Att vända om: Resiliensgranskning
Alternativ ett är direkt och effektivt, men Risken för regressionsfel ökar vid mer komplexa ändringar. Alternativ två, modulär hjälpar-injektering, ger bäst resiliens och är lättast att isolera i separata tester. Alternativ tre tillför en robust kontroll, men kan skapa redundans i tillståndshanteringen.


#### 2d Att förlikas: Mättnad
Med tanke på våra krav på moduläritet, resiliens och testbarhet är det tydligt att alternativ två, med modulär hjälpar-injektering, är det vinnande valet. Det ger den bästa balansen och minimerar risken för regression. Jag deklarerar därmed MÄTTNAD: JA.
