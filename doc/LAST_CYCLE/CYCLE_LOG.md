# BYGGCYKEL LOGG: TCK-MAINT-079
**Starttid:** 2026-11-14T23:24:16.526Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-MAINT-079: Koppla extractErrorSignature, asynkron diagnostiseraRotOrsak, ADR-019 Fail-First-generering & recovery-loopar i fas2Recovery.ts och fas2Loop.ts

**Måldomän:** `scripts`
**Målfiler:** `scripts/lib/fas2Recovery.ts`, `scripts/lib/fas2Loop.ts`
**Förutsättning:** `TCK-MAINT-078` måste vara `VERIFIED`.
**Mekanisk Acceptans:**
1. `scripts/lib/fas2Recovery.ts` (< 215 rader) tar bort sin lokala stubb `diagnostiseraRotOrsak`, importerar i stället `extractErrorSignature` från `./ticketAndAnchor.js` och den asynkrona `diagnostiseraRotOrsak` från `./channelRunner.js`, läser automatiskt in eventuella externa felande filer som nämns i felloggen, anropar `planContextBatches(files, errorLog)` & `buildCrashDumpPayload(data)` från `./contextBatcher.js` med korrekta argumentsignaturer samt nollställer omvändelseräknaren till `0` vid lyckat bygge.
2. `scripts/lib/fas2Loop.ts` (< 215 rader):
   - Bygger `enrichedFas2Anchor` (med befintliga målfiler förpackade via `planContextBatches`, max `24 000` tecken) **högst upp** i `korFas2Loop` så att både testgenereringen och källkodsexekveringen har befintliga typer/scheman i startankaret.
   - När `!isMaint`: om `transientTestFullPath` inte existerar på disk, kör först en `Att följa`-mikrokanal med ett verktygswrapper `executeTestOnlyTools` som **enbart tillåter skrivning (`save_code`/`apply_patch`) till `transientTestFile`** (avvisar alla andra skrivningar enligt `ADR-019`), med `maxTurns: 5` och **`onMutationCheck: () => fs.existsSync(transientTestFullPath)`** (samt `getFollowupPrompt` som uppmanar till omedelbar `save_code` av `transientTestFile` med relativa importer `../features/${targetDomain}/...`).
   - Kör därefter Gate 3a (`node scripts/drivers/ts.js --check-alibi --file ${transientTestFile}`, där återhämtningsloopen också använder `executeTestOnlyTools` och `onMutationCheck`) följt av röd Fail-First (`npx vitest run ${transientTestFile}`).
   - Kör därefter källkodsändringarna (`maxTurns: 8`, `onMutationCheck: isFas2Complete`) samt (efter källkodsändringarna) den 3-försöks Vitest + Gate 2c + `hanteraFas2TestFel`-återhämtningsloopen (när `!isMaint`) eller `korMaintValidering` (när `isMaint`).
3. `pnpm verify` passerar med exit 0.

```


#### 1a Att följa: Intention & Nytta
Det här underhållet handlar om att stärka systemets förmåga att hantera fel och återhämta sig. Genom att koppla på mer avancerad feldiagnostik och tvinga fram tester först, vill vi skapa en mycket mer robust utvecklingsmiljö som skyddar mot krascher och sparar tid för dig. Hur ser du på den förändringen?


#### 0a Att vända om: Kontraktsaudit
Kontraktsaudit för TCK-MAINT-079 är genomförd. Vi säkerställer att fas2Loop och fas2Recovery ansluter korrekt till de nya diagnostikfunktionerna och strikt följer ADR-019 för Fail-First-generering för att bevara systemresiliensen.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
För att lösa kontraktet TCK-MAINT-079 och de förändringar som krävs i `fas2Recovery.ts` och `fas2Loop.ts`, formulerar jag tre ortogonala alternativ att överväga.

Alternativ 1: Centraliserad orkestrering i loopen och direkt anropsstruktur. I detta alternativ ersätter `fas2Recovery.ts` lokala funktioner med de asynkrona importerade versionerna och hanterar batch-planering och crash-dump direkt vid aktivering. `korFas2Loop` i `fas2Loop.ts` innehåller all livscykelhantering sekventiellt linjärt.

Alternativ 2: Modulär uppdelning och delegering av ansvarsområden. Här bryts loiken i `korFas2Loop` ned i specifika del-rutiner för testgenerering, kodändringar och recovery, vilket håller huvudfunktionen renare. `fas2Recovery.ts` agerar som en ren gränssnittsbrygga till externa tjänster.

Alternativ 3: Händelsestyrd feedbackloop och asynkrona återhämtningsmekanismer. `fas2Recovery.ts` planerar batchas och hanterar felrapporter via interna händelser, vilket frikopplar själva återhämtningen från den linjära exekveringen i `fas2Loop.ts`.


#### 2c Att vända om: Resiliensgranskning
För att säkra maximal resiliens och minimera kognitiv belastning, utvärderas alternativen utifrån deras förmåga att hantera latenta haverier och strikt följa ADR-019.

Alternativ 1 ger en rak överblick av livscykeln, men riskerar att leda till en monolitisk loop med stor risk för tillståndsfel om felsökningsstegen inte är strikt isolerade.

Alternativ 2 stärker moduluppdelningen och delegerar ansvarsområdena vilket underlättar testning av isolerade funktioner, vilket är direkt i linje med mekanisk alibispärr.

Alternativ 3 erbjuder en flexibel händelsestyrd arkitektur, men ökar komplexiteten i att spåra det deterministiska tillståndet exakt över tid.

Vägt spänningsfältet ser jag att Alternativ 2 ger bäst förutsättningar för att möta kraven på resiliens och modulär utökning.


#### 2d Att förlikas: Mättnad
Spänningsfältet är vägt. Alternativ 2 vinner eftersom det maximerar moduluppdelningen och underlättar testning i linje med våra kvalitetsgrindar. MÄTTNAD: JA.
