# BYGGCYKEL LOGG: TCK-MAINT-066
**Starttid:** 2026-11-14T11:43:33.890Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-MAINT-066: Delegerad maintValidation.ts (färsk barnprocess), smart extractCuratedRange-trunkering i buildRetryAnchor och verifierad backup

**Måldomän:** `scripts`
**Målfiler:** `scripts/lib/maintValidation.ts`, `scripts/lib/ticketAndAnchor.ts`, `scripts/lib/shellAndBackup.ts`, `scripts/run-planera-live.ts`
**Mekanisk Acceptans:**
1. Ny modul `scripts/lib/maintValidation.ts` (< 110 rader) bryter ut `MAINT`-valideringen (`verify-architecture.js`, `vitest run scripts/__tests__/`, `pnpm test`, `esbuild` och `tsc -p scripts/tsconfig.json --noEmit`) så att den alltid exekveras som en **färsk barnprocess** efter Fas 2 (aldrig stale kod i V8-minnet) och är så kompakt att den aldrig trunkeras vid självrättning.
2. `scripts/lib/ticketAndAnchor.ts` (< 195 rader) uppgraderar `buildRetryAnchor` till att använda befintliga `extractCuratedRange(content, startLine, endLine)` runt de felrader som nämns i `testLog` (samt filens nedersta 160 rader om inga specifika radnummer matchar) i stället för blind `.slice(0, ...)` som amputerar slutet av stora filer.
3. `scripts/lib/shellAndBackup.ts` (< 115 rader):
   - Exporterar `createVerifiedScriptsBackup()`: rensar ospårade filer (`git reset HEAD -- src/ scripts/ 2>/dev/null || true && git clean -fd src/ scripts/`) och validerar `verify-architecture.js` + `esbuild` *innan* `scripts/` kopieras till `doc/LAST_CYCLE/scripts_backup/`.
   - Utökar `restoreScriptsBackup()` med `git reset HEAD` + `git clean -fd src/ scripts/` och kapar `execCaptured`-terminalutdata till max 25 rader (full logg i `doc/LAST_CYCLE/LAST_ERROR.log`).
4. `scripts/run-planera-live.ts` (< 910 rader) anropar `createVerifiedScriptsBackup()`, delegerar `MAINT`-valideringen till `npx tsx scripts/lib/maintValidation.ts`, begränsar `MAINT`-självrättningens `filesToInclude` till `getRequiredFiles()` och filtrerar `currentSig` ur faktiska `❌`/`FAIL`/`Error:`/`error TS`/`RADGRÄNSBROTT`-rader.
5. `pnpm verify` passerar med exit 0.

```


#### 1a Att följa: Intention & Nytta
Hej! Jag ser att vi ska tackla TCK-MAINT-066. Det är ett viktigt steg för att göra våra underhållsrutiner och säkerhetskopior ännu mer pålitliga genom att köra valideringar isolerat och undvika dataförlust vid återskapning. Vad ser du som den största vinsten med den här förändringen för vårt arbete?


#### 0a Att vända om: Kontraktsaudit
Den största vinsten är att vi helt eliminerar risken för stale-kod i minnet under våra MAINT-valideringar. Genom att köra dem som en färsk barnprocess kan vi lita på att testerna reflekterar den absoluta verkligheten i källkoden. Kontraktet ser balanserat ut och följer våra radgränser precis. STATUS: GODKÄND för nästa steg.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
Vi ser tre distinkta vägar att uppfylla kontraktet för TCK-MAINT-066 genom processisolering och smart trunkering.

Alternativ ett fokuserar på strikt processisolering där maintValidation.ts agerar oberoende barnprocess via exekvering och använder exakta radnummer för felmatchning.

Alternativ två bygger upp en modulär sekvens i shellAndBackup.ts med hård verifiering av repots tillstånd och arkitektur innan backup utförs.

Alternativ tre använder avancerad parsning av testloggen för att dynamiskt extrahera kuraterade områden och begränsar felpropageringen till specifika signaturer.


#### 2c Att vända om: Resiliensgranskning
Alternativ ett ger bäst isolering mot stale state, men kräver robust felhantering för att inte misslyckas tyst. Alternativ två skyddar integriteten i källkoden men kräver en varsam hantering av ospårade filer. Alternativ tre säkerställer dataåtergivning utan amputation, vilket är kritiskt för logganalys.


#### 2d Att förlikas: Mättnad
Jag väger alternativen och ser att alternativ tre väger tyngst. Genom att säkerställa dataåtergivning utan amputation skyddar vi logganalysens integritet. MÄTTNAD: JA.
