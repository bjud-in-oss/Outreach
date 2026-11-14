# BYGGCYKEL LOGG: TCK-MAINT-072
**Starttid:** 2026-11-14T20:52:45.826Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-MAINT-072: Slutför Strangler Fig — banta run-planera-live.ts under 250 rader, full scripts/ + src/features/ skanning i sizeGate.js och negativt beteendetest

**Måldomän:** `scripts`
**Målfiler:** `scripts/run-planera-live.ts`, `scripts/lib/sizeGate.js`, `scripts/lib/fas2Tooling.ts`, `scripts/__tests__/scriptLibs.test.ts`
**Förutsättning:** `TCK-MAINT-071` måste vara `VERIFIED`.
**Mekanisk Acceptans:**
1. `scripts/run-planera-live.ts` (**strikt < 250 rader**) agerar renodlad tunn CLI-orkestrerare (argumentparsning, `VERIFIED`-vakt, startsanering och anrop till `fas1Sweep`, `fas2Loop` och `fas3Consolidation`).
2. `scripts/lib/sizeGate.js` (< 95 rader) tar bort 1000-radersundantaget för `run-planera-live.ts` i `LEGACY_SCRIPT_CAPS` och `getLineLimitForFile` så att **250 rader** gäller som standardtak, och låter `validateCodebaseLineLimits(rootDir)` skanna **både `scripts/` och `src/features/`** (exklusive `__tests__`, `node_modules` och `.legacy.`).
3. `scripts/lib/fas2Tooling.ts` (< 220 rader) avvisar `save_code` om målfilen redan existerar på disk (`if (fs.existsSync(full)) throw new Error(...)`) så att `apply_patch` alltid krävs för befintliga filer.
4. `scripts/__tests__/scriptLibs.test.ts` (< 195 rader) lägger till ett **negativt beteendetest** i `os.tmpdir()` som skapar en 260-raders `.ts`-fil under en temporär `scripts/`-katalog och bevisar att `validateCodebaseLineLimits(tmpDir)` returnerar `1`.
5. `pnpm verify` passerar med exit 0.

```


#### 1a Att följa: Intention & Nytta
Jag förstår verkligen intentionen med det här uppdraget. Genom att slutföra Strangler Fig-mönstret för `run-planera-live.ts` och strama åt storleksgränserna i `sizeGate.js` säkrar vi en mer modulär och lättunderhållen kodbas. Det ger stabilitet och främjar en hållbar utvecklingsmiljö för hela teamet.


#### 0a Att vända om: Kontraktsaudit
Kontraktsaudit för TCK-MAINT-072 är genomförd. Eftersom uppdraget innebär direkta ändringar i `scripts/`-katalogen, som enligt reglerna ska vara oföränderliga för källkodsagenten, kommer kontraktet att hanteras som systemunderhåll under strikt isolerad kontroll enligt mekaniska invarianti. Inga andra domäner påverkas.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
Detta är de tre alternativen för att slutföra Strangler Fig och uppfylla kraven i kontraktet:

Alternativ ett innebär direkt refaktorisering av run-planera-live.ts genom att bryta ut konfigurationslogik och uppdatera storlekskontroller i sizeGate.js och fas2Tooling.ts sekventiellt före testning.

Alternativ två är en inkrementell utfasning där vi skapar nya hjälpmoduler i scripts/lib/ för att stödja den modulära expansionen och strikt följa storleksbegränsningarna.

Alternativ tre fokuserar på testdriven utveckling där vi börjar med att implementera det negativa beteendetestet och sedan anpassar existerande logik mekaniskt för att garantera att AST-granskaren godkänner bygget.


#### 2c Att vända om: Resiliensgranskning
Alternativ ett och två medför risker för att vi bryter rådande körtidskontrakt innan säkerhetsgrinden är på plats. Alternativ tre är mest resilient eftersom det börjar med det negativa beteendetestet, vilket Fail-First-regeln kräver, för att garantera att AST-granskaren godkänner bygget.


#### 2d Att förlikas: Mättnad
Med utgångspunkt i er analys och Fail-First-regeln står det klart att alternativ tre är det vunna kontraktet. Det säkrar resiliens och uppnår fullständig överensstämmelse med arkitektoniska gränser. MÄTTNAD: JA.
