# BYGGCYKEL LOGG: TCK-MAINT-023
**Starttid:** 2026-11-09T20:30:36.154Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-MAINT-023: Härda Action Loopens Filkrav och Etablera run-path Integrationstest

## 1. MÅL
Åtgärda blindfläcken i Action Loopen i `scripts/run-planera-live.ts` så att filer med flera punkter (t.ex. `.test.ts`) inkluderas i kravlistan och inte avbryts i förtid, samt etablera det permanenta integrationstestet `scripts/__tests__/run-path.test.ts` med ESM-säker start i `scripts/run-path.ts`.

## 2. INFRASTRUKTURSPECIFIKATION
1. `scripts/run-planera-live.ts`:
   - I `getRequiredFiles()`: ändra regexen för MAINT till:
     `const promptFiles = ticketPrompt.match(/scripts\/[a-zA-Z0-9_\-./]+\.(?:ts|js)/g) || [];`
   - I `isFas2Complete()`: säkerställ att för MAINT måste alla filer i `getRequiredFiles()` finnas i antingen `createdModules` eller `modifiedFiles` innan fasen får markeras som klar.

2. `scripts/run-path.ts`:
   - Ersätt CommonJS-kontrollen `if (require.main === module)` med ESM-säker CLI-detektering:
     ```typescript
     import { fileURLToPath } from 'node:url';
     const isDirectCli = process.argv[1] && (
       process.argv[1] === fileURLToPath(import.meta.url) ||
       process.argv[1].endsWith('run-path.ts') ||
       process.argv[1].endsWith('run-path.js')
     );
     if (isDirectCli) {
       exekveraRunPath().catch(() => process.exit(1));
     }
     ```

3. `scripts/__tests__/run-path.test.ts`:
   - Skapa integrationstestet som anropar `exekveraRunPath` med syntetiskt I/O och verifierar att recepten (både default lean och classic) exekverar grönt.

## 3. ACCEPTANSKRITERIER
1. `scripts/__tests__/run-path.test.ts` existerar och körs grönt i `pnpm test`.
2. `pnpm verify` passerar 100 % grön med 17 testfiler.
3. Trepunktsbesiktningen visar explicit att testfilen skapats och godkänns med `j`.

```


#### 1a Att följa: Intention & Nytta
Den mänskliga nyttan ligger i att skapa en mer robust utvecklingsmiljö. Genom att lösa problemet med filnamn som innehåller flera punkter, säkerställer vi att kritiska testfiler inkluderas korrekt och inte avbryts i förtid. Detta stärker stabiliteten i hela motorstyrningen.


#### 0a Att vända om: Kontraktsaudit
Jag utför nu kontraktsaudit för TCK-MAINT-023. Ändringarna rör enbart orchestreringsskript i `scripts/` och omfattar inte källkod under `src/features/`. Kontraktet för gränssnitt och felhantering är godkänt och inga tidigare testinvarianter bryts. Vi kan gå vidare till avsiktsgrinden.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
För TCK-MAINT-023 har jag tagit fram följande tre ortogonala alternativ för lösning: 

Alternativ 1 innebär linjär uppdatering direkt i de berörda filerna (`run-planera-live.ts` och `run-path.ts`) och att simulera I/O direkt mot skriptets gränssnitt vid test.

Alternativ 2 bygger på modulär separation genom att extrahera regex-kontroll och ESM-detektering till dedikerade verktygsfunktioner i en separat fil för att stärka testbarheten.

Alternativ 3 fokuserar på miljöinjektion och konfiguration, vilket låter integrationstesterna injicera testade sökvägar och syntetiskt I/O utan hårdkodade beroenden.


#### 2c Att vända om: Resiliensgranskning
Vid en resiliensgranskning är Alternativ 2 det mest robusta valet. Genom att separera regex-kontroll och ESM-detektering till dedikerade hjälpfunktioner skyddar vi huvudloopen från direkta kodändringar och latenta fel, vilket stärker testbarheten och resiliensen avsevärt.


#### 2d Att förlikas: Mättnad
I egenskap av kraften Att förlikas har jag vägt spänningsfältet och mätt det semantiska deltat. Jag låser nu kontraktet och fastställer Alternativ 2 som vinnande.
MÄTTNAD: JA.
