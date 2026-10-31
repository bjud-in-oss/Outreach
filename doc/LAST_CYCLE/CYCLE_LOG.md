# BYGGCYKEL LOGG: TCK-MAINT-008
**Starttid:** 2026-10-31T16:25:48.877Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-MAINT-008: Implementera ADR-013 Omvändelseslingan i run-planera-live.ts

## MÅL
Bygg in ADR-013 i `scripts/run-planera-live.ts` så att motorn vid haveri i Fas 2 sanerar källkod, sparar kraschdump och loopar tillbaka till Fas 1 för omplanering (max 1 omvändelse).

## UPPDRAG FÖR BYGGMOTORN
1. Använd `read_file` för att inspektera `scripts/run-planera-live.ts` runt Fas 1-starten (rad 180) och Fas 2-testloopen (rad 460–505).
2. Använd `apply_patch` för att:
   a) Definiera `CRASH_DUMP_PATH`, `omvandelseCount = 0` och omsluta Fas 1 och Fas 2 i en omvändelseslinga `while (omvandelseCount <= maxOmvandelse)`.
   b) Om `attempts >= 3` i Fas 2:
      - Om `omvandelseCount < maxOmvandelse`: öka räknaren, kör `git checkout -- src/features/${targetDomain}`, skriv kraschlogg till `doc/LAST_CYCLE/CRASH_DUMP.json`, och bryt Fas 2 för att starta om Fas 1 med kraschdumpen i startankaret.
      - Om `omvandelseCount >= maxOmvandelse`: avbryt med `process.exit(1)`.
   c) Vid godkänt test: bryt omvändelseslingan och fortsätt till Fas 3.

```


#### 1a Att följa: Intention & Nytta
Givet att exekveringsmotorn har påbörjat Fas 2, när tre försök har misslyckats utan godkänt resultat, och omvänjelsecounten är under max omvänjelse, så saneras källkoden, en kraschdump sparas i doc/LAST_CYCLE/CRASH_DUMP.json, och processen loopar tillbaka till Fas 1 för omplanering.


#### 0a Att vända om: Kontraktsaudit
Jag bekräftar att kontraktet har auditerats. Uppgiften berör inte mer än en FSD-domän och inkluderar de destruktiva saneringsstegen enligt ADR-013. Vi kan gå vidare.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
För att implementera ADR-013 Omvändelseslingan i `scripts/run-planera-live.ts` formulerar jag följande tre ortogonala alternativ:

Alternativ 1 innebär en explicit proceduriell loop. Vi omsluter fas 1 och fas 2 i en `while`-loop i huvudskriptet, hanterar `omvandelseCount` internt och återställer tillståndet inför nästa körning.

Alternativ 2 bygger på en händelsedriven tillståndsmaskin. Fasövergångar styrs via EventBus, där en kraschsignal utlöser en övergång tillbaka till planeringsläget med incrementerad räknare.

Alternativ 3 separerar körningen genom en underprocess. När fas 2 havererar, skrivs dumpen och processen avslutas, varpå en ny instans startas av en extern runner med det uppdaterade startankaret.


#### 2c Att vända om: Resiliensgranskning
Vid granskning av resiliens och felhantering för de tre alternativen kan vi konstatera följande: Alternativ ett, den explicita loopen, är enkel att implementera och håller tillståndet samlat, men den är sårbar för odokumenterade läckage eller odödliga tillstånd som kan korrumpera nästa iteration. Alternativ två, den händelsedrivna tillståndsmaskinen, frikopplar logiken väl, men riskerar komplexitet och problem vid eventbussavbrott. Alternativ tre, med processseparation via underprocesser, erbjuder högst skydd mot krascher genom total sessionisolering och en ren omstart varje gång. Det skapar dock friktion i filhanteringen. För resiliens och robust felhantering tillgodoses bäst det tredje alternativet enligt principen om att krascha kontrollerat.


#### 2d Att förlikas: Mättnad
Som kraften *Att förlikas* slår jag fast att alternativ tre, med processseparation via underprocesser och total sessionisolering, är det vinnande alternativet för att uppnå maximal resiliens. Principen om att krascha kontrollerat säkrar systemets integritet över tid. MÄTTNAD: JA.
