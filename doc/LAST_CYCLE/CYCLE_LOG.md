# BYGGCYKEL LOGG: TCK-MAINT-017
**Starttid:** 2026-11-07T23:06:23.570Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-MAINT-017: Infrastrukturhärdning, pnpm verify-spärr och Processminne

## 1. MÅL
Härda Outreach-motorns orkestreringsinfrastruktur och processminne efter erfarenheterna från TCK-035 till TCK-038:
1. Installera en obligatorisk verifieringsspärr i scripts/synka.ts som kör pnpm verify före git commit och push.
2. Automatisera synkronisering av doc/TICKETS.md i Fas 0 av scripts/run-planera-live.ts.
3. Begränsa kognitiv drift i Fas 1 Steg 2b av scripts/run-planera-live.ts genom att förbjuda externa grannberoenden (som SwarmEventBus) vid isolerade domänuppdrag.
4. Uppdatera doc/PROCESS_IMPROVEMENTS.md med lärdomarna från TCK-035–038.
5. Formalisera ADR-031 (Källkodsmatriser, Konstruktionsintegritet och Typamputationsskydd) i doc/DECISIONS.md.

## 2. DESTRUKTIVA HANDLINGSSTEG
Inga produktionsfiler under src/ modifieras. Ändringarna sker uteslutande i scripts/ och doc/.

## 3. IMPLEMENTERINGSSPECIFIKATION FÖR BYGGMOTORN

### A. Säkerhet i synkningen (scripts/synka.ts)
I scripts/synka.ts, lägg till obligatorisk kontroll av arbetskopian innan commit tillåts:
- När status detekteras, kör execSync('pnpm verify', { stdio: 'inherit', cwd: ROOT_DIR }).
- Vid fel i pnpm verify, avbryt processen med exitkod 1 och felmeddelandet:
  "❌ [SYNK AVBRUTEN]: pnpm verify underkändes. Rätta koden innan du synkar."

### B. Fas 0 och Fas 1 i orkestreringsmotorn (scripts/run-planera-live.ts)
1. Vid start i main(), direkt efter att targetDomain fastställts, anropa:
   try { execSync('node scripts/update-tickets.js', { cwd: ROOT_DIR }); } catch {}
   så att doc/TICKETS.md alltid är synkroniserad från starten av bygget.
2. I anropet för Fas 1 Steg 2b, utöka instruktionen till:
   "Steg 2b: Formulera 3 ortogonala alternativ för lösning. REGLER: Introducera ALDRIG externa beroenden eller granndomäner (som SwarmEventBus) om inte biljetten uttryckligen efterfrågar distribuerad telemetri."

### C. Processminne (doc/PROCESS_IMPROVEMENTS.md)
Lägg till ett nytt avsnitt under Processförbättringar:
- [2026-11-08] Erfarenheter från TCK-035 till TCK-038 (Vägens fundament):
  * TDZ i felhanterare: Variabler som fångar felloggar (testLog) måste initieras överst i catch-blocket.
  * Kontinuerlig barrel-synk: index.ts i aktiva FSD-domäner uppdateras deterministiskt inför varje testkörning.
  * Mekanisk flerfilskontroll i Fas 2: Byggmotorn kräver att samtliga specificerade källkodsfiler existerar på disk innan testerna startas.
  * Typamputationsskydd: save_code förbjuds att skriva över model/types.ts och index.ts om deklarerade exporter saknas.
  * Git-omvändelse framför MAINT-ackumulering: Trasig eller skuldsatt kod backas med git reset till senast kända rena tillstånd hellre än att plåstras över.
  * Filbaserad IPC: Komplexa ändringar överförs via efemära filer på disk för att eliminera klippta terminalbuffertar.

### D. Konstitutionellt Beslut (doc/DECISIONS.md)
Dokumentera ADR-031:
- Rubrik: ADR-031: Källkodsmatriser, Mekanisk Konstruktionsintegritet och Typamputationsskydd
- Status: Beslutad (2026-11-08)
- Beslut: Konstruktionsporten validerar FilKrav[] mekaniskt; save_code skyddar mot typamputation; scripts/synka.ts kräver grön pnpm verify före push.

## 4. ACCEPTANSKRITERIER
1. scripts/synka.ts exekverar pnpm verify innan git commit tillåts.
2. scripts/run-planera-live.ts synkroniserar biljetter i Fas 0 och begränsar Steg 2b-prompten.
3. doc/PROCESS_IMPROVEMENTS.md och doc/DECISIONS.md innehåller de nya posterna.
4. pnpm verify är 100 % grön (alla 18 tester och 62 arkitekturregler passerar).

```


#### 1a Att följa: Intention & Nytta
Jag bekräftar min förståelse av intentionen. Syftet med TCK-MAINT-017 är att härda Outreach-motorns orkestreringsinfrastruktur och processminne genom att installera en obligatorisk verifieringsspärr, automatisera synkronisering, begränsa kognitiv drift samt formalisera lärdomar och ADR-031.


#### 0a Att vända om: Kontraktsaudit
Kontraktsaudit godkänd. Inga FSD-domäner under src påverkas och inga externa API-kontrakt bryts. Vi rör oss strikt inom infrastruktur och dokumentation i scripts/ och doc/.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
För att härda orkestreringsinfrastrukturen och möta kraven i TCK-MAINT-017, formulerar jag följande tre ortogonala alternativ för lösning:

Alternativ 1: Direkt procedurell integrering. Vi implementerar kontrollen i `scripts/synka.ts` genom att använda `execSync` för att köra `pnpm verify` direkt före `git commit`. I `scripts/run-planera-live.ts` lägger vi till synkronisering av biljetter i Fas 0 via ett `execSync`-anrop och uppdaterar prompten i Fas 1 Steg 2b för att blockera externa beroenden.

Alternativ 2: Modulär drivrutin för validering och orkestrering. Vi skapar separata drivrutiner i `scripts/drivers/` för att hantera tillståndskontroller och kontraktsverifiering. Detta separerar logiken för `pnpm verify` och biljetternas status från synk- och planeringsskripten, vilket ger en mer modulär struktur.

Alternativ 3: VCS-integrering och pre-commit-krok. I stället för att ändra `scripts/synka.ts` förlitar vi oss på mekaniska Git-krokar eller strikt CI-pipeline-verifiering utanför applikationens körtid. Processminnet uppdateras genom separata körningar.


#### 2c Att vända om: Resiliensgranskning
Granskning av alternativen ur ett resiliensperspektiv visar att Alternativ 1 är mest robust. Genom att integrera verifieringen direkt i `scripts/synka.ts` minskar vi komplexiteten och risken för latenta fel, vilket stärker konstruktionsintegriteten. Alternativ 2 och 3 introducerar fler rörliga delar som kräver mer underhåll i vår hårdkodade miljö.


#### 2d Att förlikas: Mättnad
Vi väger spänningsfältet mellan komplexitet och resiliens och fastställer härmed att Alternativ 1 vinner. Vi låser detta kontrakt för att säkra konstruktionsintegriteten. MÄTTNAD: JA.
