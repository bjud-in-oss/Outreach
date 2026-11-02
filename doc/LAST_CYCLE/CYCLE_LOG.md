# BYGGCYKEL LOGG: TCK-035
**Starttid:** 2026-11-02T13:09:50.300Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-035: Initiera Vägen och Typkontrakten (Path Engine)

## 1. MÅL
Skapa grundbulten för den nya deklarativa processmotorn i domänen `src/features/path/` enligt ADR-029 och ordboken i ADR-028. Detta kontrakt upprättar FSD-strukturen, typdefinitionerna för Vägen och Portarna, samt ett hermetiskt test i minnet för att verifiera att en "knackning" hanteras rätt.

---

## 2. DESTRUKTIVA HANDLINGSSTEG
Inga filer ska raderas. Detta är en "greenfield"-domän. Det befintliga skriptet `scripts/run-planera-live.ts` får **under inga omständigheter** röras eller modifieras.

---

## 3. IMPLEMENTERINGSSPECIFIKATION FÖR BYGGMOTORN

Skapa domänen `src/features/path/` med följande struktur och kontrakt:

### A. Typdefinitioner (`src/features/path/model/types.ts`)
Skapa de rena TypeScript-gränssnitten som speglar ordboken i ADR-028:
- `PathContext`: Håller biljettdatum, aktuell fas och minnestillstånd.
- `PortResult`: Ett gränssnitt med `{ oppnad: boolean; orsak?: string; omvandelseKrav?: string }`.
- `Port`: Ett asynkront gränssnitt som tar emot `PathContext` och returnerar `PortResult`.

### B. Kärnlogik för Knackning (`src/features/path/engine/pathRunner.ts`)
Implementera funktionen `knackaPaPorten(port: Port, kontext: PathContext): Promise<void>`:
- Funktionen ska anropa portens väktare.
- Om `dom.oppnad` är falskt, ska funktionen kasta ett specifikt fel: `PortNekadError`.

### C. Zod-Scheman (`src/features/path/contracts/pathSchema.ts`)
Skapa Zod-scheman för `PathContext` och `PortResult` för att säkra typesafety under runtime. Exportera dem via domänens `index.ts`.

---

## 4. ACCEPTANSKRITERIER
*(Mekaniskt förankrat via Gate 3a och steel-thread)*
1. Skapa `src/features/path/__tests__/pathRunner.test.ts`.
2. Testet måste instansiera en mock-port i minnet och verifiera att `knackaPaPorten` kastar ett `PortNekadError` om porten returnerar `{ oppnad: false }`.
3. Koden ska valideras rent mot Zod.
4. `pnpm test` och `node scripts/verify-architecture.js` ska lysa 100 % grönt, och `src/features/path/` ska utgöra en ren FSD-domän.
5. Samtliga skapade .ts-filer under src/features/path/ ska strikt underskrida 250 rader.

```


#### 1a Att följa: Intention & Nytta
Givet att en ny deklarativ processmotor ska initieras i domänen src features path När typdefinitioner för PathContext och Port etableras samt knackaPaPorten implementeras Så ska ett test i minnet verifiera att en nekad knackning kastar PortNekadError och att typerna valideras korrekt mot Zod. Speglade detta din intention? y n


#### 0a Att vända om: Kontraktsaudit
Kontraktsaudit genomförd. Uppdraget rör uteslutande en enda FSD-domän: `src/features/path/`. Inga destruktiva handlingar krävs och källkoden förblir intakt. Intentionen är tydlig och alla kriterier för typkontrakt och hermetiska tester är godkända.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
Här är tre ortogonala alternativ för att initiera path engine i `src/features/path/`.

Alternativ 1: Funktionell direkt och strikt. Den fokuserar på ren funktionell programmering, omedelbar Zod-validering i gränserna och en enkel exekveringsmodell.

Alternativ 2: Tillståndsorienterad klassbaserad implementation. Vi kapslar in `PathContext` och exekveringslogik i en klass för att möjliggöra utbyggnad av livscykeln och tillståndet internt över tid.

Alternativ 3: Händelsedriven arkitektur och middleware. Varje knackning producerar en händelse på `SwarmEventBus`, vilket tillåter observabilitet och asynkron hantering från start.

Vilket av dessa vägval vill du utforska vidare via `check-alignment`?


#### 2c Att vända om: Resiliensgranskning
För att säkra maximal resiliens och uppfylla FSD-kontraktet för TCK-035 förordar jag Alternativ 1. Den funktionella och strikta modellen minimerar tillståndsrisker vid fel, ger högsta möjliga testbarhet i minnet och säkerställer att `PortNekadError` propageras omedelbart utan sidobiverkningar. Detta ger renast felhantering i händelsebussen.


#### 2d Att förlikas: Mättnad
Jag har vägt spänningsfältet och mätt det semantiska deltat. Alternativ 1 är det vinnande kontraktet; dess strikta och funktionella felhantering med omedelbar propagering av PortNekadError säkrar maximal resiliens. MÄTTNAD: JA.


#### 3a Att följa: Testspecifikation



#### 3b Att följa: Källkod
The requested FSD structure and TypeScript definitions are specified below to establish the Path Engine domain according to the TCK-035 contract.


#### 3c Att förlikas: Slutgiltigt Byggkontrakt
Vi fastställer byggkontraktet för TCK-035. Följande filer ska skapas: `model/types.ts` för gränssnitt, `contracts/pathSchema.ts` för Zod-validering, `engine/pathRunner.ts` för kärnlogik, samt `__tests__/pathRunner.test.ts` för verifiering. Domänens index.ts exporterar samtliga typer och scheman för att bibehålla FSD-kontraktet.
