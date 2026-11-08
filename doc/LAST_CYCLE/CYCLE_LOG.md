# BYGGCYKEL LOGG: TCK-039
**Starttid:** 2026-11-08T09:24:56.710Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-039: Besiktningsporten och Recept-harmonisering

## 1. MÅL
Implementera Besiktningsporten (src/features/path/engine/besiktningsport.ts) och skapaLeanRecept (src/features/path/recipes/leanRecipe.ts) enligt ADR-028, ADR-029 och ADR-030. Besiktningsporten förkroppsligar rollen Att förlikas och validerar slutresultatet.

## 2. KÄLLKODSSPECIFIKATION FÖR DOMÄNEN
1. src/features/path/engine/besiktningsport.ts:
   - Exportera skapaBesiktningsport(options: { inspekterare: (kontext: PathContext) => Promise<{ godkand: boolean; felmeddelande?: string }> }): Port.
   - Returnera en asynkron funktion: async (kontext: PathContext): Promise<PortResult> => { ... }.
   - Vid godkand: true -> returnera { oppnad: true }.
   - Vid godkand: false -> returnera { oppnad: false, orsak: "Besiktning underkänd: " + (resultat.felmeddelande || "Okänt fel"), omvandelseKrav: "ÅTGÄRDA_BESIKTNING" }.
2. src/features/path/recipes/leanRecipe.ts:
   - Exportera skapaLeanRecept(options: { avsikt: Port; provning: Port; konstruktion: Port; besiktning: Port }): PathRecipe.
   - Returnera ett PathRecipe med noder för de 4 portarna: { id: "path-lean", name: "Vägen Lean 4-Portar", description: "Deklarativ 4-ports tillståndsmaskin", nodes: [ { id: "p1", name: "Avsikt", type: "PORT", port: options.avsikt }, { id: "p2", name: "Provning", type: "PORT", port: options.provning }, { id: "p3", name: "Konstruktion", type: "PORT", port: options.konstruktion }, { id: "p4", name: "Besiktning", type: "PORT", port: options.besiktning } ] }.
3. src/features/path/index.ts:
   - Exportera skapaBesiktningsport och skapaLeanRecept.

## 3. ACCEPTANSKRITERIER (Hermetisk TDD och Gate 3a)
1. Skapa src/features/path/__tests__/besiktningsport.test.ts:
   - Inga vi.fn()-spioner. Använd rena async-funktioner som mocks: async () => ({ godkand: true }) eller async () => ({ oppnad: true }).
   - Testfall 1: Godkänd besiktning öppnar porten via knackaPaPorten(port, kontext).
   - Testfall 2: Underkänd besiktning kastar PortNekadError med ÅTGÄRDA_BESIKTNING via knackaPaPorten(port, kontext).
   - Testfall 3: Recept med 4 godkända mock-portar fullföljs av exekveraRecept(recept, kontext).
2. pnpm verify ska vara 100 % grön.

```


#### 1a Att följa: Intention & Nytta
Givet att en exekveringsprocess når besiktningsstadiet, när besiktningsporten inspekterar och godkänner kontexten, så öppnas porten och processen fortsätter till nästa steg. Speglade detta din intention?


#### 0a Att vända om: Kontraktsaudit
Jag har granskat TCK-039 och kan bekräfta att uppdraget uppfyller kraven för kontraktet enligt vår arkitekturmanual. Vi fokuserar på domänen path, vilket respekterar gränsen för en enhetlig FSD-modul och använder rena asynkrona funktioner i testerna. All förberedelse är därmed låst.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
Som kraften Att följa formulerar jag härmed tre ortogonala alternativ för lösningen av TCK-039.

Alternativ 1 innebär en direkt implementering av Besiktningsporten och Lean-receptet med strikt fokus på kontraktets funktioner och enkel felhantering.

Alternativ 2 fokuserar på robusthet genom att inkludera Zod-validering för alla konfigurationsobjekt, vilket förhindrar körtidsfel vid felaktig kontext.

Alternativ 3 separerar inspekterarens logik i en egen modul för att förbättra läsbarhet och göra enhetstester enklare att strukturera och underhålla.


#### 2c Att vända om: Resiliensgranskning
Alternativ 2 är vinnaren. Zod-valideringen bygger in den nödvändiga spärrarna som krävs för full resiliens och förhindrar korrupt tillståndshantering vid felaktiga indata i `PathContext`. Detta eliminerar latenta haverier helt och säkerställer att körtidskontraktet skyddar processen mekaniskt.


#### 2d Att förlikas: Mättnad
Baserat på vår avvägning slår jag fast att Alternativ 2 är det vinnande kontraktet. Zod-valideringen bygger in nödvändiga spärrar för full resiliens och skyddar processen mekaniskt mot korrupt tillståndshantering. MÄTTNAD: JA.


#### 3a Att följa: Testspecifikation



#### 3b Att följa: Källkod



#### 3c Att förlikas: Slutgiltigt Byggkontrakt
Det slutgiltiga byggkontraktet för TCK-039 fastställer att vi skapar filerna `besiktningsport.ts` och `leanRecipe.ts` i domänen. Vi kommer även uppdatera `index.ts` för exporten och bevara testet i testsökvägen för att garantera en grön verifiering.
