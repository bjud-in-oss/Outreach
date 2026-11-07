# BYGGCYKEL LOGG: TCK-038
**Starttid:** 2026-11-07T22:34:31.082Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-038: Konstruktionsporten och Källkodsmatrisen (Construction Port)

## 1. MÅL
Implementera Konstruktionsporten (src/features/path/engine/konstruktionsport.ts) som förkroppsligar rollen Att följa enligt ADR-028, ADR-029 och ADR-030. Konstruktionsporten ansvarar för att mekaniskt validera att källkodsgenereringen är fullständig innan processen tillåts passera till testning och besiktning. Den kontrollerar att alla specificerade filer existerar fysiskt, att de exporteras korrekt via domänens index.ts, och att radgränserna (max 125 rader för UI, max 250 rader för logik) inte överskrids.

## 2. DESTRUKTIVA HANDLINGSSTEG
Inga filer raderas. Befintlig kod i src/features/path/ kompletteras enligt Väg 2 (Modulär expansion). Gamla orkestreringsskript i scripts/ förblir orörda.

## 3. IMPLEMENTERINGSSPECIFIKATION FÖR BYGGMOTORN

### A. Typ- och Kontraktsutökning (src/features/path/model/types.ts)
Komplettera types.ts med kontrakt för källkodsvalidering:
- FilKrav: { filVag: string; maxRader?: number; kravsExport?: boolean }
- FilInspektion: { existerar: boolean; antalRader: number; exporteradIIndex?: boolean }
- FilInspekterare: (krav: FilKrav, barrelVag?: string) => Promise<FilInspektion>
- KonstruktionsportOptions: { matris: FilKrav[]; inspekterare: FilInspekterare; barrelVag?: string }

### B. Konstruktionsporten (src/features/path/engine/konstruktionsport.ts)
Skapa fabriksfunktionen skapaKonstruktionsport(options: KonstruktionsportOptions): Port:
- Returnerar en asynkron funktion av typen Port: async (kontext: PathContext): Promise<PortResult> => { ... }.
- När porten anropas inspekteras samtliga poster i options.matris sekventiellt via options.inspekterare(krav, options.barrelVag).
- Bedömning av Konstruktionsporten:
  1. Om en fil saknas på disken (existerar === false):
     Returnera { oppnad: false, orsak: `Källkodsfil saknas: "${krav.filVag}"`, omvandelseKrav: 'SKAPA_FILER' }.
  2. Om en fil överskrider angiven radgräns (krav.maxRader && antalRader > krav.maxRader):
     Returnera { oppnad: false, orsak: `Fil "${krav.filVag}" överskrider radgräns (${antalRader} > ${krav.maxRader})`, omvandelseKrav: 'MODULÄR_EXPANSION' }.
  3. Om export krävs men filen inte exporteras i index.ts (krav.kravsExport && exporteradIIndex === false):
     Returnera { oppnad: false, orsak: `Modul "${krav.filVag}" saknar exportdeklaration i barrel-filen`, omvandelseKrav: 'UPPDATERA_INDEX' }.
  4. Om samtliga filer i matrisen uppfyller kraven:
     Returnera { oppnad: true }.

### C. Zod-Validering (src/features/path/contracts/pathSchema.ts)
Komplettera schemat med KonstruktionsportOptionsSchema:
- matris: z.array(z.object({ filVag: z.string().min(1), maxRader: z.number().positive().optional(), kravsExport: z.boolean().optional() }))
- inspekterare: z.custom<Function>()
- barrelVag: z.string().optional()

### D. Domänexport (src/features/path/index.ts)
Exportera skapaKonstruktionsport och de nya typerna från src/features/path/index.ts.

## 4. ACCEPTANSKRITERIER (Hermetisk TDD och Gate 3a)
1. Skapa src/features/path/__tests__/konstruktionsport.test.ts.
2. Körtidsankare och TDD Fail-First: Testet ska importera skapaKonstruktionsport, knackaPaPorten, PortNekadError, Port och PathContext från den egna domänen. Använd rena asynkrona mock-funktioner för inspekterare (inga syntetiska spioner som vi.fn()).
3. Testfall 1 (Godkänd konstruktion):
   När samtliga filer i matrisen rapporteras som existerande, inom radgränser och exporterade, ska knackaPaPorten(port, kontext) öppna porten utan fel (resultat.oppnad === true).
4. Testfall 2 (Underkänt p.g.a. saknad fil):
   När en fil rapporteras som existerar: false, ska knackaPaPorten kasta PortNekadError med omvandelseKrav: 'SKAPA_FILER'.
5. Testfall 3 (Underkänt p.g.a. radöverskridelse):
   När en fil har antalRader: 300 men maxRader: 250, ska knackaPaPorten kasta PortNekadError med omvandelseKrav: 'MODULÄR_EXPANSION'.
6. Testfall 4 (Underkänt p.g.a. saknad barrel-export):
   När krav.kravsExport: true men exporteradIIndex: false, ska knackaPaPorten kasta PortNekadError med omvandelseKrav: 'UPPDATERA_INDEX'.
7. Fil- och radgränser: Samtliga skapade eller ändrade .ts-filer under src/features/path/ ska strikt hålla sig under 250 rader per fil.
8. pnpm test och node scripts/verify-architecture.js ska vara 100 % gröna.

```


#### 1a Att följa: Intention & Nytta
Givet att en Konstruktionsport är konfigurerad med en matris av filkrav och en inspekterare, När samtliga filer i matrisen rapporteras som existerande, inom radgränser och exporterade, Så ska porten öppnas utan fel.


#### 0a Att vända om: Kontraktsaudit
TCK-038 är godkänd. Uppdraget berör strikt en FSD-domän (src/features/path/) och innehåller inga krav på destruktiv sanering. Jag förbereder nu Intent Gate för att låsa byggkontraktet.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
Jag formulerar tre ortogonala alternativ för att implementera Konstruktionsporten och Källkodsmatrisen i `path`-domänen, baserat på ADR-028 och ADR-029:

Alternativ 1: Direkt filsystemsinpektion. Helt frikopplad lösning där en `FilInspekterare` använder Node.js `fs/promises` för att synkront eller asynkront läsa filinnehåll och pars-kontrollera exportdeklarationer direkt via AST eller regex på begäran.

Alternativ 2: Abstraherad Provider och Dependency Injection. Integrerade mock-kontrakt och asynkrona funktioner för att tillåta injektion av simulerade tillståndstester, vilket isolerar I/O-bunden logik och säkerställer helt deterministisk exekvering i TDD-sviten.

Alternativ 3: Pre-indexerad Manifestkontroll. Förberedande parse-steg där `barrelVag` läses in och omvandlas till en central registry Map, varpå inspektorn enbart kör uppslag mot minnet för snabb och prestandaoptimerad validering utan upprepad skivläsning.


#### 2c Att vända om: Resiliensgranskning
Baserat på haveriet i Fas 2 och kraven på hermetisk TDD, väljer jag Alternativ 2: Abstraherad Provider och Dependency Injection. Genom att injicera en ren asynkron funktion för inspektion isolerar vi logiken från fysisk I/O, vilket garanterar deterministiska och stabila testresultat.


#### 2d Att förlikas: Mättnad
Jag har vägt spänningsfältet och alternativen. Alternativ 2, Abstraherad Provider och Dependency Injection, står som vackrare och mer resilient lösning för att garantera deterministiska testresultat. Vi har nått syntetisk vägvägning. MÄTTNAD: JA.


#### 3a Att följa: Testspecifikation



#### 3b Att följa: Källkod



#### 3c Att förlikas: Slutgiltigt Byggkontrakt
Det här bygget har alla förutsättningar. Jag har förlikats med kontraktet och fastställt att vi skapar `konstruktionsport.ts` i motorn, uppdaterar typerna och valideringsschemat och exporterar allt deterministiskt via `index.ts` i domänen `path`. Nu exekverar vi Fas 2.
