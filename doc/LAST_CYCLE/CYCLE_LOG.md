# BYGGCYKEL LOGG: TCK-058
**Starttid:** 2026-11-13T21:57:32.504Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-058: Exempelskördning av wal_logger.legacy.ts och WalEngine.getWalSummary (ADR-030)

**Måldomän:** `wal_logger` (`src/features/wal_logger/`)
**Målfiler:** `src/features/wal_logger/engine/walEngine.ts`
**Skördad Legacy:** `src/__tests__/wal_logger.legacy.ts`
**Mekanisk Acceptans:** Ett hermetiskt Vitest-test (konsoliderat till `src/features/wal_logger/__tests__/`) verifierar samtliga 3 scenarier från `src/__tests__/wal_logger.legacy.ts` (`WalEngine.appendWalEntry`, `commitWalEntry`, och `WalReplayer.replayUncommittedEntries`) samt nya `engine.getWalSummary()`, varefter Fas 3 raderar `src/__tests__/wal_logger.legacy.ts` och `pnpm verify` passerar med exit 0.

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **Utöka `src/features/wal_logger/engine/walEngine.ts` (< 120 rader):**
   - Lägg till `public getWalSummary(): { total: number; pending: number; committed: number; failed: number }` i `WalEngine` som räknar poster per status i `this.entries`.
2. **Testdisciplin i Steg 3a (Fail-First + Skörd utan `vi.fn()`):**
   - Läs `src/__tests__/wal_logger.legacy.ts`, `src/features/wal_logger/engine/walEngine.ts` och `src/features/wal_logger/replay/walReplay.ts` i Steg 3a.
   - Importera `WalEngine` och `WalReplayer`. Inga kors-domänimporter och inga `vi.fn()`/`vi.spyOn()`.

---

## Scenariotriad (Den relationella och systemiska avsikten)

**Scenario: ATT FÖLJA – WAL-loggens hashkedja och replay blir levande regressionsskydd**
  Givet att `wal_logger.legacy.ts` innehåller 3 verifierade tester för `WalEngine` och `WalReplayer`
  När de skördas in i `src/features/wal_logger/__tests__/` tillsammans med `getWalSummary`
  Så körs de i varje `pnpm verify` och `wal_logger.legacy.ts` städas bort i Fas 3.

**Scenario: ATT VÄNDA OM – Avvisande av förlorade PENDING-poster vid krasch**
  Givet att `wal_logger` tidigare saknade aktiva enhetstester
  När replay av oavslutade transaktioner körs i Vitest
  Så garanteras append-only-integriteten enligt ADR-030.

**Scenario: ATT FÖRLIKAS – Grön verifiering i hela repot**
  Givet att testerna passerar och legacy-filen är borttagen
  När `pnpm verify` körs
  Så passerar hela sviten med exit 0.

```


#### 1a Att följa: Intention & Nytta
Hej! Jag förstår precis intentionen med TCK-058. Målet är att skapa en stabil grund för regressionsskydd genom att skörda de gamla testerna och lägga till den nya funktionen getWalSummary för full insyn i loggens tillstånd. Är det en korrekt bild av vad du vill uppnå så att vi kan gå vidare?


#### 0a Att vända om: Kontraktsaudit
Kontraktsaudit genomförd. Arbetet omfattar uteslutande FSD-domänen wal_logger och uppfyller kraven på destruktiv sanering av legacy-filer i Fas 3. Vi är redo att gå vidare.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
För TCK-058 formulerar jag tre ortogonala alternativ för lösningen.

Det första är en O(1) state-counter metod, där vi lägger till diskreta räknare i WalEngine som uppdateras vid varje statusändring.

Det andra är en på-begäran beräkning där getWalSummary itererar genom this.entries och aggregerar antalet statusar dynamiskt.

Det tredje är att strukturera lagringen i en mappning per WalStatus, så att varje statusnivå har sin egen array och summan deriveras från dess längd.


#### 2c Att vända om: Resiliensgranskning
Granskning av alternativen ur ett resiliensperspektiv visar att på-begäran beräkning, alltså alternativ två, är det säkraste för att undvika tillståndsskillnader. Eftersom WAL-loggen hanterar kritiska data, ger den direkta avläsningen i this.entries en garanterad sanning. Vi undviker risker med desynkroniserade räknare.


#### 2d Att förlikas: Mättnad
Som kraften Att förlikas, väger jag avvägningarna. Att använda på-begäran beräkning minimerar risken för desynkronisering och säkerställer att vi alltid läser från den absoluta källan. Kontraktet är låst kring alternativ två för optimal resiliens. Jag deklarerar härmed MÄTTNAD: JA.


#### 3a Att följa: Testspecifikation



#### 3b Att följa: Källkod



#### 3c Att förlikas: Slutgiltigt Byggkontrakt
Baserat på byggkontraktet för TCK-058 fastställer jag att vi skapar det nya testet `src/features/wal_logger/__tests__/wal_logger.test.ts` som skördar legacy-datan, bevarar och uppgraderar `walEngine.ts` med `getWalSummary()`, samt säkerställer att `wal_logger.legacy.ts` tas bort i Fas 3. Vår `index.ts` förblir intakt med nuvarande exportkontrakt.
