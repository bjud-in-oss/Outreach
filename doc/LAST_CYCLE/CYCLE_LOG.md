# BYGGCYKEL LOGG: TCK-MAINT-019
**Starttid:** 2026-11-09T18:17:33.016Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-MAINT-019: Etablera Parallellt Körskript run-path.ts och package.json-alias

## 1. MÅL
Etablera det parallella körskriptet `scripts/run-path.ts` och registrera npm-kommandot `"bygg:path"` i `package.json` enligt ADR-029 (Strangler Fig). Skriptet ska möjliggöra autonom provkörning av Vägmotorn (`src/features/path/`) via terminalen.

## 2. INFRASTRUKTURSPECIFIKATION
1. `scripts/run-path.ts`:
   - Läser in biljett-id från `process.argv[2]` (fallback: 'PROMPT').
   - Läser biljetttexten och extraherar måldomän.
   - Instansierar `skapaPathOrkestrerare` med `skapaMockSessionAdapter` och dummy-portar.
   - Kör orkestreraren och loggar slutrapport i terminalen.
2. `package.json`:
   - Lägg till skriptet `"bygg:path": "tsx --env-file=.env scripts/run-path.ts"`.

## 3. ACCEPTANSKRITERIER
1. `scripts/run-path.ts` existerar och kan exekveras utan syntax- eller körtidsfel.
2. `pnpm verify` passerar 100 % grön.

```


#### 1a Att följa: Intention & Nytta
Givet att utvecklingsmiljön är redo och konfigurerad, när användaren exekverar kommandot bygg path med ett specifikt biljett id så ska skriptet run path ts initiera orkestreraren och köra Vägmotorns logik autonomt utan körtidsfel.


#### 0a Att vända om: Kontraktsaudit
Jag har granskat kontraktet för TCK-MAINT-019. Jag bekräftar att uppdraget ryms inom en enskild FSD-domän under src/features/ (nämligen path) och att infrastrukturella tillägg i rotfilerna är tillåtna enligt kontraktet. Inga externa paket utanför den godkända listan krävs. Kontraktet är godkänt för vidare exekvering.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
Vi har tre ortogonala alternativ för att etablera körskriptet.

Alternativ ett är direkt exekvering med synkron initiering, då biljetten läses direkt och orkestreraren monteras utan asynkron bootstrap.

Alternativ två är en modulär fabrik och asynkron uppstart, där vi döljer monteringslogiken i en isolerad funktion.

Alternativ tre är konfigurationsdriven exekvering som matchar befintliga kontrakt strikt, där parametrar från miljövariabler styr instansieringen.


#### 2c Att vända om: Resiliensgranskning
Vid en resiliensgranskning av de tre alternativen framstår det andra alternativet – modulär fabrik med asynkron bootstrap – som det mest resilienta för utvecklingsskriptet.

Detta alternativ isolerar monteringslogiken, hanterar asynkrona beroenden på ett kontrollerat sätt och minimerar risken för att ohanterade fel stoppar exekveringsmotorn abrupt under uppstarten.

Direkt exekvering saknar nödvändig felhanteringsbrygga, och konfigurationsdrivna alternativ introducerar onödig komplexitet för ett enskilt skript, vilket kan försämra systemets transparens.


#### 2d Att förlikas: Mättnad
Vi har vägt spänningsfältet mellan enkelhet och resiliens. Med hänsyn till kraven på kontrollerad asynkron bootstrap och isolerad monteringslogik slår vi fast att det andra alternativet är det vinnande kontraktet. MÄTTNAD: JA.
