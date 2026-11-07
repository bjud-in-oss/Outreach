# BYGGCYKEL LOGG: TCK-038
**Starttid:** 2026-11-07T22:53:33.531Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-038: Konstruktionsporten och Källkodsmatrisen (Construction Port)

## 1. MÅL
Implementera Konstruktionsporten (src/features/path/engine/konstruktionsport.ts) som förkroppsligar rollen Att följa enligt ADR-028, ADR-029 och ADR-030. Konstruktionsporten ansvarar för att mekaniskt validera att källkodsgenereringen är fullständig innan processen tillåts passera till testning och besiktning. Den kontrollerar att alla specificerade filer existerar fysiskt, att de exporteras korrekt via domänens index.ts, och att radgränserna (max 125 rader för UI, max 250 rader för logik) inte överskrids.

## 2. DESTRUKTIVA HANDLINGSSTEG
Inga filer raderas. Befintlig kod i src/features/path/ kompletteras enligt Väg 2 (Modulär expansion). Gamla orkestreringsskript i scripts/ förblir orörda.
VIKTIGT: Befintliga typer i model/types.ts bevaras intakta (använd apply_patch). PortNekadError och knackaPaPorten är redan deklarerade och återanvänds, de får inte omdeklareras.

## 3. IMPLEMENTERINGSSPECIFIKATION FÖR BYGGMOTORN

### A. Typ- och Kontraktsutökning (src/features/path/model/types.ts)
Komplettera types.ts via apply_patch med:
- FilKrav: { filVag: string; maxRader?: number; kravsExport?: boolean }
- FilInspektion: { existerar: boolean; antalRader: number; exporteradIIndex?: boolean }
- FilInspekterare: (krav: FilKrav, barrelVag?: string) => Promise<FilInspektion>
- KonstruktionsportOptions: { matris: FilKrav[]; inspekterare: FilInspekterare; barrelVag?: string }

### B. Konstruktionsporten (src/features/path/engine/konstruktionsport.ts)
Skapa fabriksfunktionen skapaKonstruktionsport(options: KonstruktionsportOptions): Port:
- Returnerar en asynkron funktion: async (kontext: PathContext): Promise<PortResult> => { ... }.
- När porten anropas inspekteras samtliga poster i options.matris sekventiellt via options.inspekterare(krav, options.barrelVag).
- Bedömning:
  1. Om en fil saknas (existerar === false):
     Returnera { oppnad: false, orsak: `Källkodsfil saknas: "${krav.filVag}"`, omvandelseKrav: 'SKAPA_FILER' }.
  2. Om en fil överskrider radgräns (krav.maxRader && antalRader > krav.maxRader):
     Returnera { oppnad: false, orsak: `Fil "${krav.filVag}" överskrider radgräns (${antalRader} > ${krav.maxRader})`, omvandelseKrav: 'MODULÄR_EXPANSION' }.
  3. Om export krävs men saknas i index.ts (krav.kravsExport && exporteradIIndex === false):
     Returnera { oppnad: false, orsak: `Modul "${krav.filVag}" saknar exportdeklaration i barrel-filen`, omvandelseKrav: 'UPPDATERA_INDEX' }.
  4. Om samtliga filer uppfyller kraven:
     Returnera { oppnad: true }.

### C. Zod-Validering (src/features/path/contracts/pathSchema.ts)
Komplettera schemat med KonstruktionsportOptionsSchema via apply_patch.

### D. Domänexport (src/features/path/index.ts)
Exportera skapaKonstruktionsport och de nya typerna från index.ts.

## 4. ACCEPTANSKRITERIER (Hermetisk TDD och Gate 3a)
1. Skapa src/features/path/__tests__/konstruktionsport.test.ts (Rör inte types.test.ts eller andra tester!).
2. Importera skapaKonstruktionsport, knackaPaPorten och PortNekadError från domänen ('../features/path').
3. Verifiera:
   - Testfall 1: Öppnar porten vid godkänd matris.
   - Testfall 2: Källkodsfil saknas -> kastar PortNekadError med SKAPA_FILER.
   - Testfall 3: Radgräns överskrids -> kastar PortNekadError med MODULÄR_EXPANSION.
   - Testfall 4: Export saknas -> kastar PortNekadError med UPPDATERA_INDEX.
4. pnpm test och node scripts/verify-architecture.js ska vara 100 % gröna.

```


#### 1a Att följa: Intention & Nytta
Givet att källkodskraven är definierade i en matris, När Konstruktionsporten inspekterar filerna utan avvikelser, Så öppnas porten för fortsatt besiktning. Detta främjar närhet till den ideala mjukvaran genom deterministisk kvalitetssäkring.


#### 0a Att vända om: Kontraktsaudit
Kontraktsaudit slutförd. Uppdraget berör strikt en FSD-domän (`src/features/path/`), inga filer raderas, och alla utökningar följer modulkontraktet. Status: GODKÄND.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
För att uppfylla TCK-038 formulerar jag följande tre ortogonala alternativ för konstruktionen av Konstruktionsporten:

Alternativ 1: Den disk-direkta strategin. Här utför `FilInspekterare` direkta `fs.promises`-anrop för att kontrollera filers existens och räkna radbrytningar, samt kontrollerar exporter genom textanalys och regex.

Alternativ 2: Den AST-baserade strategin. Här används AST-skanning för att verifiera exportdeklarationer och mäta faktiska källkodssträngar, vilket ger högre precision och resiliens mot varierande kodformatteringar.

Alternativ 3: Den kontrakt-defensiva strategin. Här valideras alla inspektionssteg mot strikta Zod-kontrakt för att garantera total dataintegritet och möjliggöra en funktionell, renodlad pipeline.


#### 2c Att vända om: Resiliensgranskning
Vid en resiliensgranskning av de tre alternativen kan vi konstatera att Alternativ 1, med direkt textanalys och regex, är alltför bristfällig och riskerar att feltolka modern kodformatering. Alternativ 2, som förlitar sig på AST-skanning, är robust och väl anpassat till våra kvalitetsgrindar och arkitektoniska krav. För högsta möjliga resiliens bör vi kombinera precisionen i AST-analysen med den stringenta valideringen från Alternativ 3. Detta ger oss en helhetlig ochfelsäker arkitektur för Konstruktionsporten.


#### 2d Att förlikas: Mättnad
Det vinnande kontraktet är fastställt: en arkitektur som förenar precisionen i AST-analysen med den stringenta valideringen. Med detta förhållningssätt minimerar vi felmarginaler och uppnår maximal resiliens för Konstruktionsporten. MÄTTNAD: JA.


#### 3a Att följa: Testspecifikation



#### 3b Att följa: Källkod



#### 3c Att förlikas: Slutgiltigt Byggkontrakt
Jag bekräftar det slutgiltiga byggkontraktet för TCK-038. Vi kommer att skapa `src/features/path/engine/konstruktionsport.ts` samt uppdatera modell- och kontraktfilerna via apply_patch. I `index.ts` bevaras exporten av befintliga typer och logik, och vi lägger till `skapaKonstruktionsport` och de nya kontrakten.
