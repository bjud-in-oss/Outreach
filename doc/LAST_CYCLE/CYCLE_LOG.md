# BYGGCYKEL LOGG: TCK-MAINT-046
**Starttid:** 2026-11-12T12:22:25.279Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-MAINT-046: Avgränsa självrättningskontext i Fas 2 till målfiler för att skydda 65K TPM

**Måldomän:** `scripts`
**Målfiler:** `scripts/run-planera-live.ts`
**Mekanisk Acceptans:** Vid fel i Fas 2:s självrättningsslinga (`while (!testPassed && attempts < 3)`) bygger `scripts/run-planera-live.ts` `currentSourceSummary` uteslutande utifrån `modifiedFiles` och `getRequiredFiles()` (i stället för att dumpa hela domänkatalogen på >130 KB i ett enda WebSocket-meddelande). Samtliga skripttester, domäntester och FSD-kontroller passerar med exit 0.

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **Avgränsa `currentSourceSummary` i `scripts/run-planera-live.ts`:**
   - I Fas 2:s `catch (vitestErr)`-block (runt rad 818): ersätt rekursiv inläsning av hela `domainDir` med att enbart läsa filerna i `Array.from(new Set([...modifiedFiles, ...getRequiredFiles()]))` som existerar på disk.
   - Detta håller `retryAnchor` mager (< 25 KB) och förhindrar `WS 1011`-avbrott orsakade av överdimensionerade WebSocket-ramar.
2. **Bevara övriga faser och skriptinvarianter:**
   - Ändringen berör uteslutande `scripts/run-planera-live.ts`.

---

## Scenariotriad (Den relationella och systemiska avsikten)

**Scenario: ATT FÖLJA – Självrättningsagenten får exakt sina ändrade filer utan att spränga TPM-taket**
  Givet att en fil i en undermapp (t.ex. `session/geminiLiveSession.ts`) fallerar i Fas 2
  När självrättningsloopen bygger `retryAnchor`
  Så inkluderas endast `modifiedFiles` och `getRequiredFiles()`
  Och WebSocket-sändningen går igenom utan `WS 1011`.

**Scenario: ATT VÄNDA OM – Avvisande av 130 KB-dumpar över Live WebSocket**
  Givet att en stor domän innehåller 30+ filer
  När `currentSourceSummary` byggs
  Så får aldrig hela domänkatalogen serialiseras in i startankaret
  Utan agenten använder `read_file` om den behöver inspektera andra filer.

**Scenario: ATT FÖRLIKAS – En resilient byggmotor inför TCK-052**
  Givet att `scripts/run-planera-live.ts` är uppdaterad
  När `pnpm verify` körs
  Så passerar samtliga skript- och domäntester med exit 0.

```


#### 1a Att följa: Intention & Nytta
Jag förstår intentionen med TCK-MAINT-046. Det handlar om att skydda systemets körtid genom att kraftigt begränsa mängden data som skickas via WebSocket under felsökningsloopen. Genom att bara inkludera de ändrade filerna och de som är absolut nödvändiga håller vi ankaret magert och undviker avbrott. Ska vi påbörja arbetet med Fas 1 och planeringen?


#### 0a Att vända om: Kontraktsaudit
Jag har granskat kontraktet för TCK-MAINT-046. Avgränsningen till enbart ändrade filer och nödvändiga resurser i `currentSourceSummary` är korrekt upprättad för att skydda vår 65K TPM och undvika WebSocket-fel. Kontraktet är godkänt och jag är redo att gå vidare till Fas 1.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
Här är tre ortogonala alternativ för att avgränsa kontexten i Fas 2:

Alternativ ett är in-place minimalistisk filtrering. Du skapar en Set av unika filvägar från modifiedFiles och getRequiredFiles, och läser filerna iterativt direkt i felhanteringsblocket. Det är extremt förutsägbart och kräver inga nya beroenden.

Alternativ två är en extraherad hjälpfunktion. Du flyttar logiken till en ren funktion som tar argumenten, filtrerar mot existerande filer och returnerar den aggregerade källkoden. Det håller huvudflödet magert och ökar testbarheten.

Alternativ tre är manifest-baserad injektion. Här låter du byggmotorn styra vilka specifika manifestfiler som ska läsas baserat på domänens index.ts, vilket garanterar strikt kontroll.


#### 2c Att vända om: Resiliensgranskning
Alternativ två, med en extraherad hjälpfunktion, ger bäst resiliens. Den håller huvudflödet rent, är lätt att testa isolerat och minskar risken för fel i felhanteringsblocket. Det är också lättast att säkra mot regressioner.


#### 2d Att förlikas: Mättnad
Vi slår fast att alternativ två, med den extraherade hjälpfunktionen, vinner. Den ger bäst resiliens, håller huvudflödet rent, underlättar isolerad testning och minskar risken för fel i felhanteringsblocket. MÄTTNAD: JA.
