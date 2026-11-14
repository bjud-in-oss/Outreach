# BYGGCYKEL LOGG: TCK-MAINT-074
**Starttid:** 2026-11-14T21:13:29.610Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-MAINT-074: Slutför Strangler Fig — tunn run-planera-live.ts (< 220 rader), 250-raderstak över scripts/ + src/features/ och AST-spärrar

**Måldomän:** `scripts`
**Målfiler:** `scripts/run-planera-live.ts`, `scripts/lib/sizeGate.js`, `scripts/lib/fas2Tooling.ts`, `scripts/__tests__/scriptLibs.test.ts`
**Förutsättning:** `TCK-MAINT-073` måste vara `VERIFIED`.
**Mekanisk Acceptans:**
1. `scripts/run-planera-live.ts` (**strikt < 220 rader**, skrivs om rent med `save_code`) agerar tunn CLI-orkestrerare som importerar `exekveraFas1Sweep` (`./lib/fas1Sweep.js`), `korFas2Loop` (`./lib/fas2Loop.js`), `codegenTools` + `createFas2ToolExecutor` + `isFas2Complete` + `getFas2FollowupPrompt` (`./lib/fas2Tooling.js`), `konsolideraTest` + `synkaDomanBarrel` + `uppdateraFeatureIndex` + `uppdateraBiljettstatus` + `hanteraTrepunktsbesiktning` + `genomforGitCommitPush` + `saneraSkordadLegacy` (`./lib/fas3Consolidation.js`), `hanteraKonstruktivKritik` (`./lib/critiqueTriage.js`), nollställer omvändelseräknaren före `--kritik-iter=1` och anropar `dumpCrashDiff()` i `main().catch`.
2. `scripts/lib/sizeGate.js` (< 95 rader) tar bort `'run-planera-live.ts': 1000` ur `LEGACY_SCRIPT_CAPS` och `getLineLimitForFile` så att **250 rader** gäller universellt för alla `.ts`/`.js`-moduler (utöver legacy `bidiLiveRunner.ts` 345 och `sessionIntentAudio.ts` 300), och låter `validateCodebaseLineLimits(rootDir)` skanna **både `scripts/` och `src/features/`** (exklusive `__tests__`, `node_modules` och `.legacy.`).
3. `scripts/lib/fas2Tooling.ts` (< 235 rader) avvisar `save_code` om målfilen redan existerar på disk (`if (fs.existsSync(full)) throw new Error(...)`), aktiverar `reportDiagnostics: true, allowJs: true` i `ts.transpileModule` samt avvisar **duplicerade exporter** i samma fil via TypeScript AST (`ts.createSourceFile`) före skrivning.
4. `scripts/__tests__/scriptLibs.test.ts` (< 120 rader) lägger till ett **negativt beteendetest** i `os.tmpdir()` som skapar en 260-raders `.ts`-fil under en temporär `scripts/`-katalog och bevisar att `validateCodebaseLineLimits(tmpDir)` returnerar `1`.
5. `pnpm verify` passerar med exit 0.

```


#### 1a Att följa: Intention & Nytta
Jag förstår att intentionen med det här uppdraget är att ytterligare stärka systemets modularitet och resiliens genom att slutföra Strangler Fig-mönstret för orkestreringsskriptet. Jag ser framför mig hur vi tunnar ut koden, tillämpar en universell storleksgräns och inför striktare AST-kontroller för att förhindra framtida kodskuld. Stämmer detta överens med din bild av nästa steg?


#### 0a Att vända om: Kontraktsaudit
Det stämmer precis. Genom att tunna ut `run-planera-live.ts`, införa universella storleksgränser för både `scripts` och `src/features`, samt skärpa AST-kontrollerna, förhindrar vi effektivt ny kodskuld och stärker systemets resiliens. Jag har granskat kontraktet och är redo att påbörja planeringssvepet.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
För att uppfylla kraven i TCK-MAINT-074 formulerar jag följande tre ortogonala lösningsalternativ:

Alternativ 1 är direkt refaktorisering. Vi implementerar kraven direkt i befintliga filer och håller AST-kontrollerna inline i `fas2Tooling.ts`.

Alternativ 2 är frikopplad validering. Vi extraherar kontrollerna för duplicerade exporter till en separat hjälpmodul.

Alternativ 3 är fabriksmönster för exekvering. Vi bygger en konfigurationsstyrd exekveringsmotor som applicerar nödvändiga AST-spärrar dynamiskt före skrivning.


#### 2c Att vända om: Resiliensgranskning
Vid en resiliensgranskning ser jag att Alternativ 2, frikopplad validering, är klart bäst. Genom att extrahera kontrollerna till en separat hjälpmodul minskar vi komplexiteten i `fas2Tooling.ts` och bygger in tolerans mot framtida kodförändringar, samtidigt som testbarheten för AST-spärrarna stärks avsevärt.


#### 2d Att förlikas: Mättnad
Jag bekräftar valet av Alternativ 2, frikopplad validering, som det vinnande kontraktet. Genom att extrahera kontrollerna till en separat hjälpmodul uppnår vi maximal resiliens och förbättrad testbarhet. MÄTTNAD: JA.


#### ROTORSAKSDIAGNOS: Meta-Omvandelse: TCK-MAINT-074
Varför 4: Sökfunktionen är låst till specifika underkataloger och missar filer i rotnivån av domänen. Varför 5: Eftersom vi använder statiska tester frikopplade från arkitekturförändringar uppstår detta glapp. Egentligt fel: Svagheten i att integrera gränsvärdeslogiken direkt i testexekveringen utan en gemensam konfiguration. Denna diagnos loggas nu i CYCLE_LOG.md.
