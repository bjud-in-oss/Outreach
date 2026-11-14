# BYGGCYKEL LOGG: TCK-MAINT-067
**Starttid:** 2026-11-14T12:00:43.712Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-MAINT-067: 6:e WS-retry (60s inom 345 rader), 750ms sessionspaus och pre-write syntax-/radspärr

**Måldomän:** `scripts`
**Målfiler:** `scripts/bidiLiveRunner.ts`, `scripts/lib/channelRunner.ts`, `scripts/lib/sizeGate.js`, `scripts/lib/fas2Tooling.ts`
**Mekanisk Acceptans:**
1. `scripts/bidiLiveRunner.ts` (**strikt <= 345 rader**) utökar återanslutningslogiken vid WebSocket `1011`/`1006`/`503` från 5 till **6 försök** via ett kompakt 1-radigt fördröjningsuttryck (`const delay = (this.reconnectAttempts === this.maxReconnectAttempts ? 60000 : Math.pow(2, this.reconnectAttempts) * 1000) + Math.floor(Math.random() * 1000);`).
2. `scripts/lib/channelRunner.ts` (< 120 rader) behåller separata efemära mikrokanaler men ökar nedkylningspausen efter `runner.close()` till `750 ms`.
3. `scripts/lib/sizeGate.js` (< 95 rader) exporterar `getLineLimitForFile(relPath)` och `getNearLimitWarnings(rootDir, targetFiles)` (varnar vid > 180 rader för 250-radersfiler, > 90 rader för `.tsx`).
4. `scripts/lib/fas2Tooling.ts` (< 220 rader) kör syntaxspärr (`ts.transpileModule` med `target: ts.ScriptTarget.ES2022`) och radgränsspärr (`getLineLimitForFile`) **före `fs.writeFileSync`** i både `save_code` och `apply_patch`.
5. `pnpm verify` passerar med exit 0.

```


#### 1a Att följa: Intention & Nytta
Det här handlar om att stärka systemets stabilitet och motståndskraft. Genom att utöka antalet återanslutningsförsök för WebSockets och införa en nedkylningspaus, säkerställer vi att efemära mikrokanaler inte avbryts i förtid. Samtidigt bygger vi in en säkerhetsspärr för syntax och radgränser precis innan filskrivning. Är det rätt uppfattat att syftet är att förhindra att korrupt kod sprids i systemet?


#### 0a Att vända om: Kontraktsaudit
Ja, det är helt rätt uppfattat. Genom att införa dessa grindar förhindrar vi att trasig eller för stor kod når systemet och skapar instabilitet. Kontraktet är granskat och godkänt för vidare bearbetning.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
För att lösa kontraktet TCK-MAINT-067 föreslår jag följande tre ortogonala alternativ.

Det första alternativet är en direkt kontraktsenlig implementering, där vi uppdaterar återanslutningslogiken för WebSocket i bidiLiveRunner.ts och ökar nedkylningspausen i channelRunner.ts direkt i filerna.

Det andra alternativet fokuserar på en modulär helper-abstraktion, där vi flyttar spärrlogiken för radgränser och syntaxkontroller till en dedikerad helper-fil för att hålla huvudkällkodens storlek och komplexitet nere.

Det tredje alternativet innefattar en centraliserad valideringsmodul som hanterar både radgräns- och syntaxkontroller, vilken sedan anropas från både fas2Tooling och channelRunner för att säkerställa konsekventa kontroller.


#### 2c Att vända om: Resiliensgranskning
Vid resiliensgranskningen av alternativen visar det sig att det tredje alternativet är mest robust, då den centraliserade valideringsmodulen minskar risken för divergerande kontroller och säkerställer att samma regler tillämpas konsekvent oberoende av anropspunkt, vilket stärker resiliensen mot framtida regelförändringar.


#### 2d Att förlikas: Mättnad
Jag bekräftar att det tredje alternativet vinner. Genom den centraliserade valideringsmodulen bygger vi en långsiktigt robust arkitektur. MÄTTNAD: JA.
