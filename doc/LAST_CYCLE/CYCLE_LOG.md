# BYGGCYKEL LOGG: TCK-MAINT-077
**Starttid:** 2026-11-14T21:59:04.278Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-MAINT-077: Exportera executeInspection & inspectionTools i channelRunner.ts, rensa dubbletter i fas1Sweep & fas2Recovery och laga import i fas2Loop

**Måldomän:** `scripts`
**Målfiler:** `scripts/lib/channelRunner.ts`, `scripts/lib/fas1Sweep.ts`, `scripts/lib/fas2Recovery.ts`, `scripts/lib/fas2Loop.ts`
**Mekanisk Acceptans:**
1. `scripts/lib/channelRunner.ts` (< 175 rader) exporterar `inspectionTools` (kompletta verktygsdeklarationsobjekt med `name`, `behavior: 'NON_BLOCKING'`, `description` och `parameters` för `read_file` och `list_files` — INTE en strängarray) samt `executeInspection(name, args)`.
2. `scripts/lib/fas1Sweep.ts` (< 185 rader, skrivs om rent med `save_code` utan dubbletter) exporterar `export { runMicroChannel } from './channelRunner.js';` (utan lokal `runMicroChannel`-implementation) och utökar `exekveraFas1Sweep` med `getCompactTicketWindow`, `validateTicketScope` och (när `!isMaint`) Steg `3a` (transient test), `3b` (källkodsspecifikation) och `3c` (slutgiltigt byggkontrakt).
3. `scripts/lib/fas2Recovery.ts` (< 195 rader, skrivs om rent med `save_code` utan dubbletter) tar bort de fyra lokala dubblettfunktionerna (`diagnostiseraRotOrsak`, `buildCrashDumpPayload`, `selectRelevantRetryFiles`, `planContextBatches`), importerar `readFileSync` & `existsSync` från `'fs'`, definierar `RecoveryState` lokalt, använder de importerade funktionerna från `./channelRunner.js`, `./ticketAndAnchor.js` och `./contextBatcher.js` (inklusive kompakta `## ADR-`-rubriker ur `doc/DECISIONS.md`, automatisk inläsning av eventuella externa felande filer som nämns i felloggen, samt loop-nollställning till `0` vid lyckat bygge).
4. `scripts/lib/fas2Loop.ts` (< 105 rader) ändrar `import { execCaptured } from './ticketAndAnchor.js';` till `import { execCaptured } from './shellAndBackup.js';`.
5. `pnpm verify` passerar med exit 0.

```


#### 1a Att följa: Intention & Nytta
Hej! Jag har tagit emot uppdraget för TCK-MAINT-077. Det ser ut som att du vill städa upp och förbättra strukturen i våra skript för inspektioner, särskilt genom att exportera verktyg på rätt sätt och rensa dubbletter i våra körningssteg. Vad är det främsta målet med den här städningen, och finns det några risker vi behöver vara extra vaksamma på?


#### 0a Att vända om: Kontraktsaudit
Kontraktsaudit genomförd. Uppdraget rör sig strikt inom domänen scripts utan att fysiskt röra någon FSD-domän. Mekaniska acceptanskrav är tydliga med strikta radgränser och korrekta importvägar. Vi kan vända oss mot förlikning.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
För att lösa kontraktet TCK-MAINT-077 formulerar jag tre ortogonala alternativ.

Alternativ ett innebär en direkt och strikt synkron fasuppdatering där varje fil migreras isolerat enligt fasta ansvarsgränser. Det innebär exakta export- och importändringar fil för fil.

Alternativ två bygger på en sammanslagen hantering där gränssnitten för inspektion och recovery centraliseras till delade interna hjälpfunktioner för maximal återanvändbarhet inom domänen.

Alternativ tre fokuserar primärt på robust felhantering och kontraktssäkerhet, där vi först bygger och validerar transientskikten innan logik och flödesreperationer exekveras.


#### 2c Att vända om: Resiliensgranskning
Alternativ tre ger högst motståndskraft mot latenta haverier då validering av transientskiktet och tydlig felpropagering sker före kontrollen återtas. Det minskar risken för korrupt tillståndshantering vid nätverkskrascher eller oväntade avbrott i körningsmotorn.


#### 2d Att förlikas: Mättnad
Alternativ tre har valts som det vinnande alternativet då det ger högst motståndskraft mot latenta haverier och minskar risken för korrupt tillståndshantering. MÄTTNAD: JA.


#### ROTORSAKSDIAGNOS: TCK-MAINT-077
Varför 4: Varför tillåter byggmotorn att lokala korrigeringar kringgås av barrel-audit-kontrakt vid modulär expansion? Varför 5: Varför saknas en mekanisk spärr för oexporterade funktioner i AST-grinden förrän vid buntning? EGENTLIGT_FEL: Bristande mekanisk synkronisering mellan FSD-domänens internt anropade moduler och dess explicita publika exportkontrakt.
