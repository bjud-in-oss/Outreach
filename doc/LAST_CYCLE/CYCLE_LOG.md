# BYGGCYKEL LOGG: TCK-MAINT-068
**Starttid:** 2026-11-14T12:09:49.776Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-MAINT-068: Modulär critiqueTriage.ts med auto-initierad Papperskorg, fullständig s-städning och återställd radgränsvakt i sizeGate.js

**Måldomän:** `scripts`
**Målfiler:** `scripts/lib/critiqueTriage.ts`, `scripts/__tests__/scriptLibs.test.ts`, `scripts/lib/fas3Consolidation.ts`, `scripts/lib/sizeGate.js`
**Mekanisk Acceptans:**
1. Ny modul `scripts/lib/critiqueTriage.ts` (< 145 rader) exporterar `omprioriteraBatchForbattringar(improvementsPath, obsoletePatterns?)` (auto-initierar rubriker `## 2.`, `## 3.`, `## 4.`, **tömmer `## 4. Papperskorg` allra först**, flyttar inaktuella poster dit och sorterar aktiva poster `HOG -> MEDEL -> LAG`) och `hanteraKonstruktivKritik`.
2. `scripts/__tests__/scriptLibs.test.ts` (< 165 rader) lägger till enhetstest i `os.tmpdir()` för `omprioriteraBatchForbattringar`.
3. `scripts/lib/fas3Consolidation.ts` (< 200 rader):
   - Kör `execSync('git add -N src/ scripts/ 2>/dev/null || true', { cwd: ROOT_DIR })` före `git diff` i `hanteraTrepunktsbesiktning`, och i `s`-grenen kör `execSync('git reset HEAD -- src/ scripts/ 2>/dev/null || true && git checkout -- src/ scripts/ package.json vite.config.ts 2>/dev/null || true && git clean -fd src/ scripts/', { cwd: ROOT_DIR })`.
   - `uppdateraBiljettstatus` ersätter både `[ ] **${ticketId}** (READY)` och `[ ] **${ticketId}**` så att statusraden blir rent `[x] **${ticketId}** (VERIFIED)`.
4. `scripts/lib/sizeGate.js` (< 85 rader) ersätter stubben `validateCodebaseLineLimits(rootDir) { return 0; }` med riktig rekursiv radgränsvalidering (återanvänder `countLines` och `getLineLimitForFile` över `scripts/` och `src/features/`, exklusive `__tests__`, `node_modules` och `.legacy.`, loggar `❌ RADGRÄNSBROTT` och returnerar verkligt antal brott).
5. `pnpm verify` passerar med exit 0.

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **Kirurgisk 4-filsbiljett & verklig radgränsvakt:**
   - `validateCodebaseLineLimits` får ALDRIG returnera en hårdkodad nolla utan att skanna filerna under `scripts/` och `src/features/`.

```


#### 1a Att följa: Intention & Nytta
Med den här biljetten ser jag att er intention är att stärka våra underhållsrutiner. Vi bygger en ny modul för att hantera konstruktiv kritik och städa upp i papperskorgen, samt förbättra vår git-återställning och införa en riktig vakthund för radgränser. Det här kommer att göra våra processer mycket mer robusta. Stämmer det här med hur du har tänkt dig uppdraget?


#### 0a Att vända om: Kontraktsaudit
Kontraktsaudit genomförd. Biljetten håller sig inom en domän och uppfyller kraven på destruktiv sanering och verklig radgränsvakt. Alla tekniska begränsningar och filer är korrekt planerade. Status är godkänd.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
Vi formulerar tre ortogonala alternativ baserat på kraven i TCK-MAINT-068.

Det första alternativet är en direkt procedurinriktad lösning som följer kraven strikt för maximal enkelhet och prestanda genom synkron I/O och enkel stränghantering.

Det andra alternativet bygger på en objektorienterad modulär struktur, där vi inkapslar triagerings- och valideringslogik i dedikerade klasshanterare för god struktur.

Det tredje alternativet använder funktionell programmering och Zod-scheman för att strikt validera tillståndskontrakt och transformationer, vilket ger maximerad typsäkerhet och robusthet.


#### 2c Att vända om: Resiliensgranskning
Alternativ ett klarar de mekaniska kraven, men dess procedurinriktade felhantering är för skör för oväntade I/O-fel i skripten. Alternativ två med klasser ger visserligen modularitet, men riskerar att dölja tillståndsförändringar. Alternativ tre med strikta scheman är mest resilient mot felaktiga data. Vi väljer det tredje eftersom det bäst stöder principen fail-fast.


#### 2d Att förlikas: Mättnad
Vi slår fast att Alternativ tre, med strikta scheman, är det vinnande valet då det bäst stödjer principen om fail-fast och ger högst resiliens mot felaktiga data. MÄTTNAD: JA.
