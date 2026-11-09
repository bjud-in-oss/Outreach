# BYGGCYKEL LOGG: TCK-MAINT-025
**Starttid:** 2026-11-09T21:20:07.671Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-MAINT-025: Dynamisk Modalietsväxling (BIDI_MODALITY) för BidiLiveSession

## 1. MÅL
Inför en miljövariabel `BIDI_MODALITY` i `scripts/bidiLiveRunner.ts` för att låta användaren tvinga Bidi Live-strömmen till ren text (`TEXT`) när ljudbuffertar (`AUDIO`) kraschar eller fastnar i 120s-timeout, utan att påverka default-beteendet.

## 2. INFRASTRUKTURSPECIFIKATION
Berörd fil: `scripts/bidiLiveRunner.ts`.

1. `scripts/bidiLiveRunner.ts`:
   - Läs in miljövariabeln `BIDI_MODALITY`.
   - Om `BIDI_MODALITY` är satt till `'TEXT'`, sätt `responseModalities: ["TEXT"]` i `connectConfig`.
   - Radera eller uteslut `outputAudioTranscription` om modaliteten är `TEXT` (eftersom det orsakar API-fel om man begär transkription på en text-only anslutning).
   - Annars, behåll nuvarande default: `responseModalities: ["AUDIO"]` med `outputAudioTranscription: {}`.

## 3. ACCEPTANSKRITERIER
1. `pnpm verify` passerar 100 % grön (inga syntax- eller TS-fel introduceras).
2. Trepunktsbesiktningen i slutet av körningen visar exakt de tillagda raderna och godkänns manuellt med `j`.

```


#### 1a Att följa: Intention & Nytta
Givet att ljudbuffertarna i en Live-session har en risk att fastna eller krascha, när miljövariabeln BIDI_MODALITY sätts till TEXT, så ska Bidi Live-strömmen konfigureras för enbart text och utelämna output audio transcription för att förhindra API-fel. Intentionen är att ge användaren en stabil fallback-mekanism vid ljudproblem.


#### 0a Att vända om: Kontraktsaudit
STATUS: GODKÄND

Kontraktsaudit genomförd. Förändringen av `scripts/bidiLiveRunner.ts` rör inte någon FSD-domän under `src/features/`, uppfyller alla krav och följer etablerade rutiner. Vägvalet är redo för Intent Gate.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
För att lösa TCK-MAINT-025 och införa dynamisk modalitetsväxling i `bidiLiveRunner.ts`, formulerar jag härmed tre ortogonala alternativ:

Alternativ 1 är den direkta villkorsstyrda konfigurationen, där vi läser in `BIDI_MODALITY` direkt i anslutningslogiken och bygger konfigurationen villkorsstyrt med enkla `if/else`-satser.

Alternativ 2 använder konfigurationsobjektsmaskning, där vi definierar en basstruktur och applicerar sammanfogning eller spridningsoperatorer för att uppdatera modalitet och transkriptionsalternativ baserat på miljövariabeln.

Alternativ 3 bygger en dedikerad fabriksfunktion för att generera `connectConfig`, vilket abstraherar bort komplexiteten kring villkorshanteringen och gör koden mer testbar och modulär.


#### 2c Att vända om: Resiliensgranskning
Vid en granskning ur resiliensperspektiv framstår Alternativ 3 som starkast. Genom att kapsla in konfigurationslogiken i en dedikerad fabriksfunktion isolerar vi tillståndet från huvudexekveringen, vilket gör det avsevärt lättare att validera med Zod och förhindra latenta API-fel vid felaktiga miljövariabler.


#### 2d Att förlikas: Mättnad
Jag låser Alternativ 3 som det vinnande kontraktet. Genom den dedikerade fabriksfunktionen uppnår vi maximal resiliens och valideringssäkerhet. Mättnad: JA.
