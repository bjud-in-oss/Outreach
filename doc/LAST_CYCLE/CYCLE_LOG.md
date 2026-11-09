# BYGGCYKEL LOGG: TCK-044
**Starttid:** 2026-11-09T21:14:49.598Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-044: Deterministisk Fasberikning av PathContext i PathRunner

## 1. MÅL
Säkerställ att tillståndsmaskinen i `src/features/path/engine/pathRunner.ts` alltid berikar `PathContext` med `aktuellFas` ('avsikt' | 'provning' | 'konstruktion' | 'besiktning') innan en port knackas på eller ett steg exekveras, så att mottagande callbacks och promptkompilatorn alltid har tillgång till aktiv fas.

## 2. KÄLLKODSSPECIFIKATION
Domän: `src/features/path/`

1. `src/features/path/engine/pathRunner.ts`:
   - I `exekveraRecept(recipe, kontext)`:
     Vid iterering över `recipe.nodes`, beräkna nodens fas baserat på nodens id (`bestamFasForSteg(node.id)`).
   - Skapa ett berikat kontextobjekt för anropet:
     ```typescript
     const nodFas = bestamFasForSteg(node.id);
     const berikadKontext: PathContext = {
       ...kontext,
       aktuellFas: nodFas
     };
     ```
   - Skicka `berikadKontext` vidare till `node.execute(berikadKontext)` för steg, och till `knackaPaPorten(portFn, berikadKontext)` för portar.

## 3. ACCEPTANSKRITERIER (Hermetisk TDD och Gate 3a)
1. Det transienta testet `src/__tests__/transient_TCK-044.test.ts` ska registrera en portcallback, köra ett recept och bevisa att mottagen `kontext.aktuellFas` är definierad (t.ex. 'avsikt' vid port-avsikt/p1).
2. Testet måste fallera rött (Fail-First) mot befintlig kodbas innan källkoden patchas.
3. Efter implementation ska samtliga 18 testfiler i Vitest passera gröna.

```


#### 1a Att följa: Intention & Nytta
Det stämmer, målet är att säkerställa att tillståndsmaskinen i `pathRunner.ts` konsekvent berikar `PathContext` med `aktuellFas` före varje steg eller portaktivering. Detta ger callbacks och promptkompilatorn nödvändig kontextuell information. Här är Gherkin-scenariot:

Egenskap: Deterministisk Fasberikning av PathContext

Givet att en exekveringscykel initieras i PathRunner
När ett steg eller en port ska exekveras
Så ska PathContext berikas med rätt aktuellFas baserad på nodens id genom bestamFasForSteg

Scenario: Verifiera att aktuellFas är tillgänglig i kontexten vid portanrop
Givet ett recept med en nod och en registrerad portcallback
När receptet exekveras
Så ska portcallbacken ta emot en kontext som innehåller aktuellFas

Speglade detta din intention? (y/n)


#### 0a Att vända om: Kontraktsaudit
Granskning slutförd. Kontraktet uppfyller kraven: max 1 FSD-domän berörs (path), och vi förhåller oss strikt till test- och arkitekturgränserna.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
Här är tre ortogonala alternativ för TCK-044 att berika PathContext med aktiv fas i pathRunner:

Alternativ 1: Direkt injektion i exekveringsloopen. Vi beräknar fasen och skapar det utökade kontextobjektet direkt i nod-loopen.

Alternativ 2: Funktionell kontextberikare. Vi extraherar logiken för att berika kontexten till en lokal hjälppfunktion, vilket håller loopen ren och läsbar.

Alternativ 3: Intern delegat för nod-exekvering. Vi delar upp hanteringen av steg och portar i en separat lokal metod som tar noden och kontexten, och adderar fasen precis innan anropet.


#### 2c Att vända om: Resiliensgranskning
Alternativ 2, den funktionella kontextberikaren, är den mest resilienta lösningen. Genom att inkapsla skapandet av det berikade kontextobjektet i en ren hjälpfunktion, förhindrar vi muteringsbuggar och upprätthåller en obruten immutabilitet genom hela exekveringsloopen. Det håller koden läsbar, minskar risken för latenta fel vid framtida utökningar och skyddar domänintegriteten utan att introducera onödig komplexitet.


#### 2d Att förlikas: Mättnad
Jag har vägt in spänningsfältet och fastställer härmed att Alternativ 2, den funktionella kontextberikaren, är vårt vinnande kontrakt. Den säkerställer immutabilitet och skyddar domänintegriteten fullt ut. MÄTTNAD: JA.


#### 3a Att följa: Testspecifikation



#### 3b Att följa: Källkod



#### 3c Att förlikas: Slutgiltigt Byggkontrakt
Det slutgiltiga byggkontraktet för TCK-044 bekräftas. Vi skapar det transienta testet src/__tests__/transient_TCK-044.test.ts och uppdaterar källkoden i src/features/path/engine/pathRunner.ts för att fasberika PathContext innan nodexeckvering.
